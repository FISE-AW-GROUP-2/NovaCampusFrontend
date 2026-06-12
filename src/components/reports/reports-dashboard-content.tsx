"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  getDashboardApi,
  getMultiCampusReportApi,
  getSuccessRateReportApi,
  getCampusReportApi,
  exportStrategicReportApi,
} from "@/lib/api/reports"
import type { CampusSnapshot, SuccessRateEntry } from "@/types/report"
import {
  BarChart3,
  Building2,
  Download,
  GraduationCap,
  Percent,
  Users,
  Wallet,
} from "lucide-react"

const SEMESTER_OPTIONS = ["all", "Fall", "Spring", "Summer"]
const CURRENT_YEAR = new Date().getFullYear()
const ACADEMIC_YEARS = [
  "all",
  ...Array.from({ length: 4 }, (_, i) => {
    const year = CURRENT_YEAR + 1 - i
    return `${year - 1}-${year}`
  }),
]

function pct(value?: number): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—"
  // Tolerate backends returning ratios (0-1) instead of percentages.
  const v = value <= 1 && value > 0 ? value * 100 : value
  return `${Math.round(v * 10) / 10}%`
}

function pctNumber(value?: number): number {
  if (value === undefined || value === null || Number.isNaN(value)) return 0
  return value <= 1 && value > 0 ? value * 100 : value
}

function money(value?: number): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—"
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${value}`
  }
}

function campusLabel(s: CampusSnapshot): string {
  return s.campusName || s.campusId
}

export function ReportsDashboardContent() {
  const { toast } = useToast()

  const [snapshots, setSnapshots] = useState<CampusSnapshot[]>([])
  const [successRates, setSuccessRates] = useState<SuccessRateEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const [academicYear, setAcademicYear] = useState<string>("all")
  const [semester, setSemester] = useState<string>("all")

  const [drillCampus, setDrillCampus] = useState<CampusSnapshot | null>(null)
  const [drillDetail, setDrillDetail] = useState<CampusSnapshot | null>(null)
  const [drillLoading, setDrillLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    const params = {
      academicYear: academicYear !== "all" ? academicYear : undefined,
      semester: semester !== "all" ? semester : undefined,
    }
    try {
      const [dashboard, multiCampus, success] = await Promise.all([
        getDashboardApi(params),
        getMultiCampusReportApi(params),
        getSuccessRateReportApi(params),
      ])

      // Prefer the dashboard snapshots; fall back to the multi-campus report.
      const rows =
        (dashboard.success && dashboard.data?.snapshots?.length
          ? dashboard.data.snapshots
          : undefined) ??
        (multiCampus.success ? multiCampus.data ?? [] : [])
      setSnapshots(rows)
      setSuccessRates(success.success ? success.data ?? [] : [])

      if (!dashboard.success && !multiCampus.success) {
        toast({
          title: "Error",
          description:
            dashboard.error || multiCampus.error || "Failed to load reporting data.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [academicYear, semester, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Aggregated KPIs across campuses.
  const totals = useMemo(() => {
    const totalStudents = snapshots.reduce((acc, s) => acc + (s.totalStudents || 0), 0)
    const totalRevenue = snapshots.reduce((acc, s) => acc + (s.totalRevenue || 0), 0)
    const avg = (key: keyof CampusSnapshot) => {
      const values = snapshots
        .map((s) => s[key])
        .filter((v): v is number => typeof v === "number")
      if (values.length === 0) return undefined
      return values.reduce((a, b) => a + pctNumber(b), 0) / values.length
    }
    return {
      totalStudents,
      totalRevenue,
      avgSuccessRate: avg("successRate"),
      avgAttendance: avg("avgAttendance"),
      avgOccupancy: avg("roomOccupancyRate"),
      avgCollection: avg("collectionRate"),
    }
  }, [snapshots])

  // Comparative rankings (success rate descending, as in the sequence diagram).
  const ranked = useMemo(
    () =>
      [...snapshots].sort(
        (a, b) => pctNumber(b.successRate) - pctNumber(a.successRate)
      ),
    [snapshots]
  )

  const chartData = useMemo(
    () =>
      snapshots.map((s) => ({
        name: campusLabel(s),
        successRate: pctNumber(s.successRate),
        attendance: pctNumber(s.avgAttendance),
        occupancy: pctNumber(s.roomOccupancyRate),
        collection: pctNumber(s.collectionRate),
        revenue: s.totalRevenue || 0,
        students: s.totalStudents || 0,
      })),
    [snapshots]
  )

  const successChartData = useMemo(
    () =>
      successRates.map((e) => ({
        name: e.campusName || e.courseName || e.campusId || e.courseId || "—",
        successRate: pctNumber(e.successRate),
      })),
    [successRates]
  )

  const handleDrill = async (snapshot: CampusSnapshot) => {
    setDrillCampus(snapshot)
    setDrillDetail(null)
    setDrillLoading(true)
    try {
      const result = await getCampusReportApi(snapshot.campusId, {
        academicYear: academicYear !== "all" ? academicYear : undefined,
        semester: semester !== "all" ? semester : undefined,
      })
      setDrillDetail(result.success && result.data ? result.data : snapshot)
    } finally {
      setDrillLoading(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportStrategicReportApi({
        academicYear: academicYear !== "all" ? academicYear : undefined,
        semester: semester !== "all" ? semester : undefined,
      })
      if (result.success && result.data) {
        const url = URL.createObjectURL(result.data)
        const link = document.createElement("a")
        link.href = url
        link.download = "strategic-report.pdf"
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
        toast({
          title: "Export ready",
          description: "The strategic report has been downloaded.",
        })
      } else {
        toast({
          title: "Export failed",
          description: result.error || "Could not generate the strategic report.",
          variant: "destructive",
        })
      }
    } finally {
      setIsExporting(false)
    }
  }

  const detail = drillDetail ?? drillCampus

  return (
    <div className="space-y-6">
      {/* Filters + export */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Select value={academicYear} onValueChange={setAcademicYear}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Academic year" />
          </SelectTrigger>
          <SelectContent>
            {ACADEMIC_YEARS.map((y) => (
              <SelectItem key={y} value={y}>
                {y === "all" ? "All years" : y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={semester} onValueChange={setSemester}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Semester" />
          </SelectTrigger>
          <SelectContent>
            {SEMESTER_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All semesters" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          className="sm:ml-auto"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <Spinner className="mr-1.5 h-4 w-4" />
          ) : (
            <Download className="mr-1.5 h-4 w-4" />
          )}
          Strategic report (PDF)
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : snapshots.length === 0 ? (
        <div className="text-center py-16">
          <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No reporting data</h3>
          <p className="text-muted-foreground">
            No campus snapshots are available for the selected period.
          </p>
        </div>
      ) : (
        <>
          {/* Global KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total students
                </p>
              </div>
              <p className="text-2xl font-bold">{totals.totalStudents}</p>
              <p className="text-xs text-muted-foreground">
                across {snapshots.length} campus(es)
              </p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Avg success rate
                </p>
              </div>
              <p className="text-2xl font-bold">{pct(totals.avgSuccessRate)}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total revenue
                </p>
              </div>
              <p className="text-2xl font-bold">{money(totals.totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">
                collection rate {pct(totals.avgCollection)}
              </p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Avg attendance
                </p>
              </div>
              <p className="text-2xl font-bold">{pct(totals.avgAttendance)}</p>
              <p className="text-xs text-muted-foreground">
                room occupancy {pct(totals.avgOccupancy)}
              </p>
            </Card>
          </div>

          {/* Comparison charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-4">Rates by campus (%)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => `${Math.round(Number(value) * 10) / 10}%`} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="successRate" name="Success" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="attendance" name="Attendance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="occupancy" name="Occupancy" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-medium mb-4">Revenue & students by campus</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      yAxisId="left"
                      dataKey="revenue"
                      name="Revenue"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="students"
                      name="Students"
                      fill="#06b6d4"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Success-rate analysis */}
          {successChartData.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-4">Success rate analysis (%)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={successChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => `${Math.round(Number(value) * 10) / 10}%`} />
                    <Bar
                      dataKey="successRate"
                      name="Success rate"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Comparative ranking table; click a row to drill into the campus */}
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Rank</TableHead>
                  <TableHead>Campus</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Success</TableHead>
                  <TableHead className="hidden md:table-cell">Revenue</TableHead>
                  <TableHead className="hidden md:table-cell">Collection</TableHead>
                  <TableHead className="hidden lg:table-cell">Attendance</TableHead>
                  <TableHead className="hidden lg:table-cell">Occupancy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranked.map((snapshot, index) => (
                  <TableRow
                    key={snapshot.campusId}
                    className="cursor-pointer"
                    onClick={() => handleDrill(snapshot)}
                  >
                    <TableCell>
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        #{snapshot.rank ?? index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {campusLabel(snapshot)}
                    </TableCell>
                    <TableCell className="text-sm">{snapshot.totalStudents ?? "—"}</TableCell>
                    <TableCell className="text-sm">{pct(snapshot.successRate)}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {money(snapshot.totalRevenue)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {pct(snapshot.collectionRate)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {pct(snapshot.avgAttendance)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {pct(snapshot.roomOccupancyRate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {/* Campus drill-down */}
      <Dialog open={!!drillCampus} onOpenChange={(open) => !open && setDrillCampus(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {drillCampus ? campusLabel(drillCampus) : ""}
            </DialogTitle>
            <DialogDescription>
              Campus report
              {academicYear !== "all" ? ` — ${academicYear}` : ""}
              {semester !== "all" ? ` (${semester})` : ""}
            </DialogDescription>
          </DialogHeader>

          {drillLoading ? (
            <div className="flex items-center justify-center py-10">
              <Spinner className="h-6 w-6" />
            </div>
          ) : detail ? (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Students", value: `${detail.totalStudents ?? "—"}` },
                { label: "Success rate", value: pct(detail.successRate) },
                { label: "Revenue", value: money(detail.totalRevenue) },
                { label: "Collection rate", value: pct(detail.collectionRate) },
                { label: "Avg attendance", value: pct(detail.avgAttendance) },
                { label: "Room occupancy", value: pct(detail.roomOccupancyRate) },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border p-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    {item.label}
                  </p>
                  <p className="text-xl font-bold">{item.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
