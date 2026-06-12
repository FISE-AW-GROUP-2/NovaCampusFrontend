"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { getPaymentsApi } from "@/lib/api/payments"
import {
  formatAmount,
  paymentStatusConfig,
  type Payment,
  type PaymentStatus,
} from "@/types/payment"
import { CreditCard } from "lucide-react"

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

// Read-only view: the backend scopes the list to the authenticated student.
export function StudentPaymentsContent() {
  const { toast } = useToast()

  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState<PaymentStatus | "all">("all")

  const fetchPayments = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getPaymentsApi({ status })
      if (result.success && result.data) {
        setPayments(result.data.payments)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch your payments.",
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

  const outstanding = useMemo(
    () =>
      payments
        .filter((p) => p.status !== "paid")
        .reduce((acc, p) => acc + (p.amount || 0), 0),
    [payments]
  )

  return (
    <div className="space-y-6">
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

        {payments.length > 0 && (
          <p className="text-sm text-muted-foreground sm:ml-auto">
            Outstanding balance:{" "}
            <span className="font-medium text-foreground">
              {formatAmount(outstanding, payments[0]?.currency)}
            </span>
          </p>
        )}
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
              ? "No payment records have been created for you yet."
              : "No payments match the selected status."}
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Due date</TableHead>
                <TableHead className="hidden lg:table-cell">Paid on</TableHead>
                <TableHead>Status</TableHead>
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
                        <p className="font-medium text-sm truncate">{payment.label}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">
                          Due {formatDate(payment.dueDate)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {formatAmount(payment.amount, payment.currency)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {formatDate(payment.dueDate)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {payment.paidDate ? formatDate(payment.paidDate) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${cfg.bgColor} ${cfg.color}`}>
                        {cfg.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
