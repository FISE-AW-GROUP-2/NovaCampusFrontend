"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { createPaymentApi, updatePaymentApi } from "@/lib/api/payments"
import { getUsersApi } from "@/lib/api/users"
import type { Payment } from "@/types/payment"
import { getUserDisplayName, type ManagedUser } from "@/types/user"
import { UserRole } from "@/types/auth"

interface PaymentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the dialog edits this payment instead of creating one. */
  payment?: Payment | null
  onSuccess?: () => void
}

const CURRENCIES = ["EUR", "USD", "GBP", "MAD", "DZD"]

interface FormState {
  studentId: string
  amount: string
  currency: string
  label: string
  dueDate: string
}

const DEFAULT_FORM: FormState = {
  studentId: "",
  amount: "",
  currency: "EUR",
  label: "",
  dueDate: "",
}

function userLabel(u: ManagedUser): string {
  const name = getUserDisplayName(u)
  return name === u.email ? u.email : `${name} (${u.email})`
}

export function PaymentFormDialog({
  open,
  onOpenChange,
  payment,
  onSuccess,
}: PaymentFormDialogProps) {
  const { toast } = useToast()
  const isEditing = !!payment

  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [students, setStudents] = useState<ManagedUser[]>([])
  const [studentsLoaded, setStudentsLoaded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    if (payment) {
      setForm({
        studentId: payment.studentId,
        amount: String(payment.amount),
        currency: payment.currency || "EUR",
        label: payment.label,
        dueDate: payment.dueDate ? payment.dueDate.slice(0, 10) : "",
      })
    } else {
      setForm(DEFAULT_FORM)
    }
  }, [open, payment])

  // Load students for the picker. If the user service refuses (role-gated),
  // the form falls back to a free-text student id input.
  useEffect(() => {
    if (!open || isEditing || studentsLoaded) return
    getUsersApi({ role: UserRole.STUDENT }).then((result) => {
      if (result.success && result.data) {
        setStudents(result.data.users)
      }
      setStudentsLoaded(true)
    })
  }, [open, isEditing, studentsLoaded])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amount = Number(form.amount)
    if (Number.isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Enter a positive amount.",
        variant: "destructive",
      })
      return
    }
    if (!isEditing && !form.studentId) {
      toast({
        title: "Missing student",
        description: "Select the student this payment belongs to.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        amount,
        currency: form.currency,
        label: form.label,
        dueDate: form.dueDate,
      }
      const result = isEditing
        ? await updatePaymentApi(payment!._id, payload)
        : await createPaymentApi({ studentId: form.studentId, ...payload })

      if (result.success) {
        toast({
          title: isEditing ? "Payment updated" : "Payment created",
          description: isEditing
            ? "The payment has been updated."
            : "The payment has been recorded for the student.",
        })
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save the payment.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Payment" : "New Payment"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of this payment."
              : "Record a payment due for a student."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="student">Student</Label>
              {students.length > 0 ? (
                <Select
                  value={form.studentId}
                  onValueChange={(v) => setForm({ ...form, studentId: v })}
                >
                  <SelectTrigger id="student">
                    <SelectValue
                      placeholder={studentsLoaded ? "Select a student" : "Loading students..."}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {userLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="student"
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  placeholder="Student ID"
                  required
                />
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="e.g., Tuition fee — Semester 1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="e.g., 1500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(v) => setForm({ ...form, currency: v })}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due date</Label>
            <Input
              id="dueDate"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
              {isEditing ? "Save changes" : "Create payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
