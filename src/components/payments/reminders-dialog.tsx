"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { getPaymentRemindersApi, sendPaymentReminderApi } from "@/lib/api/payments"
import { formatAmount, type Payment, type ReminderLog } from "@/types/payment"
import { BellRing, Mail, Bell } from "lucide-react"

interface RemindersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment: Payment | null
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

export function RemindersDialog({ open, onOpenChange, payment }: RemindersDialogProps) {
  const { toast } = useToast()

  const [reminders, setReminders] = useState<ReminderLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const fetchReminders = useCallback(async () => {
    if (!payment) return
    setIsLoading(true)
    try {
      const result = await getPaymentRemindersApi(payment._id)
      if (result.success && result.data) {
        setReminders(result.data)
      }
    } finally {
      setIsLoading(false)
    }
  }, [payment])

  useEffect(() => {
    if (open) fetchReminders()
  }, [open, fetchReminders])

  const handleSend = async () => {
    if (!payment) return
    setIsSending(true)
    try {
      const result = await sendPaymentReminderApi(payment._id)
      if (result.success) {
        toast({
          title: "Reminder sent",
          description: "The student has been notified about this payment.",
        })
        fetchReminders()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send the reminder.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment Reminders</DialogTitle>
          <DialogDescription>
            {payment
              ? `${payment.label} — ${formatAmount(payment.amount, payment.currency)} (${payment.studentName || payment.studentId})`
              : ""}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner className="h-6 w-6" />
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-10">
            <BellRing className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No reminders sent for this payment yet.
            </p>
          </div>
        ) : (
          <ul className="space-y-3 max-h-72 overflow-y-auto">
            {reminders.map((reminder) => (
              <li key={reminder._id} className="flex items-start gap-3 rounded-lg border p-3">
                {reminder.channel === "email" ? (
                  <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                ) : (
                  <Bell className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{formatDateTime(reminder.sentAt)}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {reminder.channel}
                    </Badge>
                    {reminder.aiDraftUsed && (
                      <Badge variant="secondary" className="text-[10px]">
                        AI draft
                      </Badge>
                    )}
                  </div>
                  {reminder.messageBody && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                      {reminder.messageBody}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleSend} disabled={isSending || payment?.status === "paid"}>
            {isSending ? (
              <Spinner className="mr-1.5 h-4 w-4" />
            ) : (
              <BellRing className="mr-1.5 h-4 w-4" />
            )}
            Send reminder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
