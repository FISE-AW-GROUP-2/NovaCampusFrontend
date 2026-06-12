// Reporting Service Types based on the class diagram (CD_Reporting)

export type ReportType =
  | "success_rate"
  | "revenue"
  | "attendance"
  | "occupancy"
  | "comparative"

export type ReportScope = "campus" | "all_campuses"

export interface Report {
  _id: string
  generatedBy?: string
  type: ReportType
  scope: ReportScope
  campusId?: string
  academicYear?: string
  semester?: string
  payload?: Record<string, unknown>
  generatedAt?: string
}

// One row of aggregated KPIs for a campus (CampusSnapshot in the diagram).
export interface CampusSnapshot {
  _id?: string
  campusId: string
  campusName?: string
  academicYear?: string
  semester?: string
  totalStudents?: number
  successRate?: number
  totalRevenue?: number
  collectionRate?: number
  avgAttendance?: number
  roomOccupancyRate?: number
  computedAt?: string
  // Comparative rank computed by the reporting service
  rank?: number
}

export interface DashboardResponse {
  snapshots: CampusSnapshot[]
  totals?: {
    totalStudents?: number
    totalRevenue?: number
    avgSuccessRate?: number
    avgAttendance?: number
  }
  generatedAt?: string
}

export interface SuccessRateEntry {
  campusId?: string
  campusName?: string
  courseId?: string
  courseName?: string
  successRate: number
  totalStudents?: number
}

export interface ReportQueryParams {
  academicYear?: string
  semester?: string
}

export const reportTypeLabels: Record<ReportType, string> = {
  success_rate: "Success Rate",
  revenue: "Revenue",
  attendance: "Attendance",
  occupancy: "Occupancy",
  comparative: "Comparative",
}
