"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PaymentFormDialog } from "./payment-form-dialog"
import { RemindersDialog } from "./reminders-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  getPaymentsApi,
  deletePaymentApi,
  markPaymentPaidApi,
} from "@/lib/api/payments"
import { getUsersApi } from "@/lib/api/users"
import {
  formatAmount,
  paymentStatusConfig,
  type Payment,
  type PaymentStatus,
} from "@/types/payment"
import { getUserDisplayName } from "@/types/user"
import { UserRole } from "@/types/auth"
import { BellRing, CheckCircle2, CreditCard, Pencil, Plus, Trash2 } from "lucide-react"

const STATUS_OPTIONS: Array<PaymentStatus | "all"> = ["all", "pending", "paid", "overdue"]

function formatDate(iso?: string): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return iso
  }
}

// Mirror of Payment.isOverdue() — a pending payment past its due date.
function isOverdue(payment: Payment): boolean {
  return (
    payment.status === "overdue" ||
    (payment.status === "pending" && new Date(payment.dueDate).getTime() < Date.now())
  )
}

export function EducationManagerPaymentsContent() {
  const { toast } = useToast()

  const [payments, setPayments] = useState<Payment[]>([])
  const [studentNames, setStudentNames] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState<PaymentStatus | "all">("all")

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Payment | null>(null)
  const [remindTarget, setRemindTarget] = useState<Payment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getPaymentsApi({ status })
      if (result.success && result.data) {
        setPayments(result.data.payments)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch payments.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [status, toast])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  // Resolve student names for display (payment documents only carry studentId).
  useEffect(() => {
    getUsersApi({ role: UserRole.STUDENT }).then((result) => {
      if (result.success && result.data) {
        const names: Record<string, string> = {}
        result.data.users.forEach((u) => {
          names[u._id] = getUserDisplayName(u)
        })
        setStudentNames(names)
      }
    })
  }, [])

  const studentLabel = useCallback(
    (payment: Payment) =>
      payment.studentName || studentNames[payment.studentId] || payment.studentId,
    [studentNames]
  )

  // KPI tiles above the table.
  const stats = useMemo(() => {
    const pending = payments.filter((p) => p.status === "pending")
    const overdue = payments.filter((p) => isOverdue(p) && p.status !== "paid")
    const paid = payments.filter((p) => p.status === "paid")
    const sum = (list: Payment[]) => list.reduce((acc, p) => acc + (p.amount || 0), 0)
    return {
      pendingCount: pending.length,
      pendingTotal: sum(pending),
      overdueCount: overdue.length,
      overdueTotal: sum(overdue),
      paidCount: paid.length,
      paidTotal: sum(paid),
      currency: payments[0]?.currency,
    }
  }, [payments])

  const handleMarkPaid = async (payment: Payment) => {
    setMarkingPaidId(payment._id)
    try {
      const result = await markPaymentPaidApi(payment._id)
      if (result.success) {
        toast({
          title: "Payment marked as paid",
          description: `${payment.label} — ${formatAmount(payment.amount, payment.currency)}`,
        })
        fetchPayments()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to mark the payment as paid.",
          variant: "destructive",
        })
      }
    } finally {
      setMarkingPaidId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const result = await deletePaymentApi(deleteTarget._id)
      if (result.success) {
        toast({ title: "Payment deleted", description: "The payment has been removed." })
        setPayments((prev) => prev.filter((p) => p._id !== deleteTarget._id))
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete the payment.",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI tiles */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Pending
          </p>
          <p className="text-2xl font-bold">{formatAmount(stats.pendingTotal, stats.currency)}</p>
          <p className="text-xs text-muted-foreground">{stats.pendingCount} payment(s)</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Overdue
          </p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatAmount(stats.overdueTotal, stats.currency)}
          </p>
          <p className="text-xs text-muted-foreground">{stats.overdueCount} payment(s)</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Collected
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatAmount(stats.paidTotal, stats.currency)}
          </p>
          <p className="text-xs text-muted-foreground">{stats.paidCount} payment(s)</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Select value={status} onValueChange={(v) => setStatus(v as PaymentStatus | "all")}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt === "all" ? "All statuses" : paymentStatusConfig[opt].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          className="sm:ml-auto"
          onClick={() => {
            setEditTarget(null)
            setShowForm(true)
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          New payment
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16">
          <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No payments</h3>
          <p className="text-muted-foreground">
            {status === "all"
              ? "Create the first payment record for a student."
              : "No payments match the selected status."}
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="hidden md:table-cell">Label</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Due date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-40 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => {
                const effectiveStatus: PaymentStatus = isOverdue(payment)
                  ? "overdue"
                  : payment.status
                const cfg = paymentStatusConfig[effectiveStatus] ?? paymentStatusConfig.pending
                return (
                  <TableRow key={payment._id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{studentLabel(payment)}</p>
                        <p className="text-xs text-muted-foreground md:hidden truncate">
                          {payment.label}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {payment.label}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {formatAmount(payment.amount, payment.currency)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {formatDate(payment.dueDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${cfg.bgColor} ${cfg.color}`}>
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {payment.status !== "paid" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-600"
                              title="Mark as paid"
                              disabled={markingPaidId === payment._id}
                              onClick={() => handleMarkPaid(payment)}
                            >
                              {markingPaidId === payment._id ? (
                                <Spinner className="h-3.5 w-3.5" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Reminders"
                              onClick={() => setRemindTarget(payment)}
                            >
                              <BellRing className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit payment"
                          onClick={() => {
                            setEditTarget(payment)
                            setShowForm(true)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete payment"
                          onClick={() => setDeleteTarget(payment)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <PaymentFormDialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open)
          if (!open) setEditTarget(null)
        }}
        payment={editTarget}
        onSuccess={fetchPayments}
      />

      <RemindersDialog
        open={!!remindTarget}
        onOpenChange={(open) => !open && setRemindTarget(null)}
        payment={
          remindTarget ? { ...remindTarget, studentName: studentLabel(remindTarget) } : null
        }
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this payment?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${deleteTarget.label}" (${formatAmount(deleteTarget.amount, deleteTarget.currency)}) for ${studentLabel(deleteTarget)} will be permanently removed, along with its reminder history.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Spinner className="mr-2 h-4 w-4" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
