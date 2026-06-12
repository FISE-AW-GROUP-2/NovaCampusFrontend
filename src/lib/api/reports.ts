/**
 * Reporting Service API Client (Central Admin only)
 *
 * All calls go through same-origin Next.js proxy routes which forward the
 * HttpOnly JWT to the backend Reporting microservice (mounted at /api/reports).
 * No dynamic route segments are used on the client; identifiers are passed
 * via query string.
 *
 * Backend endpoints:
 *  - GET /reports/dashboard         KPI snapshot per campus
 *  - GET /reports/multi-campus      comparative report (merged service summaries)
 *  - GET /reports/success-rate      success-rate analysis
 *  - GET /reports/strategic/export  strategic report PDF
 *  - GET /reports/campus/:campusId  campus drill-down
 *  - GET /reports                   report history
 *  - GET /reports/:id               single report
 */

import { apiClient } from "./client"
import type {
  CampusSnapshot,
  DashboardResponse,
  Report,
  ReportQueryParams,
  SuccessRateEntry,
} from "@/types/report"

const REPORTS_BASE = "/api/reports"

export interface ReportApiResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  status?: number
}

function buildQuery(params?: ReportQueryParams): string {
  const searchParams = new URLSearchParams()
  if (params?.academicYear) searchParams.set("academicYear", params.academicYear)
  if (params?.semester) searchParams.set("semester", params.semester)
  const query = searchParams.toString()
  return query ? `?${query}` : ""
}

// ---- Response normalization ----------------------------------------------
// Backend payloads may be bare arrays, { snapshots: [...] } or a Report
// document whose payload holds the data. Normalize so the UI always gets
// a flat list of CampusSnapshot rows.

function extractSnapshots(data: unknown): CampusSnapshot[] {
  if (Array.isArray(data)) return data as CampusSnapshot[]
  const obj = (data ?? {}) as Record<string, unknown>
  for (const key of ["snapshots", "campuses", "data"]) {
    if (Array.isArray(obj[key])) return obj[key] as CampusSnapshot[]
  }
  // Report document shape: { report: { payload: { campuses: [...] } } }
  const report = (obj.report ?? obj) as Record<string, unknown>
  const payload = report.payload as Record<string, unknown> | undefined
  if (payload) {
    for (const key of ["campuses", "snapshots", "data"]) {
      if (Array.isArray(payload[key])) return payload[key] as CampusSnapshot[]
    }
  }
  return []
}

function normalizeDashboard(data: unknown): DashboardResponse {
  const snapshots = extractSnapshots(data)
  const obj = (data ?? {}) as Record<string, unknown>
  return {
    snapshots,
    totals: (obj.totals as DashboardResponse["totals"]) ?? undefined,
    generatedAt: typeof obj.generatedAt === "string" ? obj.generatedAt : undefined,
  }
}

function normalizeSuccessRates(data: unknown): SuccessRateEntry[] {
  if (Array.isArray(data)) return data as SuccessRateEntry[]
  const obj = (data ?? {}) as Record<string, unknown>
  for (const key of ["successRates", "entries", "campuses", "data"]) {
    if (Array.isArray(obj[key])) return obj[key] as SuccessRateEntry[]
  }
  return []
}

function normalizeReports(data: unknown): Report[] {
  if (Array.isArray(data)) return data as Report[]
  const obj = (data ?? {}) as Record<string, unknown>
  if (Array.isArray(obj.reports)) return obj.reports as Report[]
  return []
}

// ---- Endpoints -------------------------------------------------------------

export async function getDashboardApi(
  params?: ReportQueryParams
): Promise<ReportApiResult<DashboardResponse>> {
  const response = await apiClient.get<unknown>(`${REPORTS_BASE}/dashboard${buildQuery(params)}`)
  return {
    success: !response.error,
    data: response.error ? undefined : normalizeDashboard(response.data),
    error: response.error?.message,
    status: response.error?.status,
  }
}

export async function getMultiCampusReportApi(
  params?: ReportQueryParams
): Promise<ReportApiResult<CampusSnapshot[]>> {
  const response = await apiClient.get<unknown>(
    `${REPORTS_BASE}/multi-campus${buildQuery(params)}`
  )
  return {
    success: !response.error,
    data: response.error ? undefined : extractSnapshots(response.data),
    error: response.error?.message,
    status: response.error?.status,
  }
}

export async function getSuccessRateReportApi(
  params?: ReportQueryParams
): Promise<ReportApiResult<SuccessRateEntry[]>> {
  const response = await apiClient.get<unknown>(
    `${REPORTS_BASE}/success-rate${buildQuery(params)}`
  )
  return {
    success: !response.error,
    data: response.error ? undefined : normalizeSuccessRates(response.data),
    error: response.error?.message,
    status: response.error?.status,
  }
}

export async function getCampusReportApi(
  campusId: string,
  params?: ReportQueryParams
): Promise<ReportApiResult<CampusSnapshot>> {
  const searchParams = new URLSearchParams({ campusId })
  if (params?.academicYear) searchParams.set("academicYear", params.academicYear)
  if (params?.semester) searchParams.set("semester", params.semester)

  const response = await apiClient.get<unknown>(`${REPORTS_BASE}/campus?${searchParams}`)
  const snapshots = response.error ? [] : extractSnapshots(response.data)
  // A campus report may come back as a single snapshot object instead of a list.
  const single =
    snapshots[0] ??
    ((response.data && typeof response.data === "object"
      ? ((response.data as Record<string, unknown>).snapshot ?? response.data)
      : undefined) as CampusSnapshot | undefined)
  return {
    success: !response.error,
    data: response.error ? undefined : single,
    error: response.error?.message,
    status: response.error?.status,
  }
}

export async function getReportsHistoryApi(): Promise<ReportApiResult<Report[]>> {
  const response = await apiClient.get<unknown>(REPORTS_BASE)
  return {
    success: !response.error,
    data: response.error ? undefined : normalizeReports(response.data),
    error: response.error?.message,
    status: response.error?.status,
  }
}

// Download the strategic report PDF generated by the backend. Calls fetch
// directly (not the JSON apiClient) because the response is a binary document.
export async function exportStrategicReportApi(
  params?: ReportQueryParams
): Promise<ReportApiResult<Blob>> {
  try {
    const response = await fetch(
      `${REPORTS_BASE}/strategic-export${buildQuery(params)}`,
      { credentials: "include" }
    )
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      return {
        success: false,
        error: data.message || data.error || `Export failed with status ${response.status}`,
        status: response.status,
      }
    }
    const blob = await response.blob()
    return { success: true, data: blob, status: response.status }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    }
  }
}
