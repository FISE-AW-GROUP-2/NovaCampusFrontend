"use client"

import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { submitJustificationApi } from "@/lib/api/absences"
import type { Absence } from "@/types/absence"
import { Upload, FileText, X } from "lucide-react"

interface JustificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  absence: Absence | null
  onSuccess: (absenceId: string) => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ACCEPTED = ".pdf,.png,.jpg,.jpeg,.doc,.docx"

export function JustificationDialog({
  open,
  onOpenChange,
  absence,
  onSuccess,
}: JustificationDialogProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [reason, setReason] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setReason("")
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (selected.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please upload a document smaller than 10 MB.",
        variant: "destructive",
      })
      return
    }
    setFile(selected)
  }

  const handleSubmit = async () => {
    if (!absence) return
    if (!reason.trim()) {
      toast({ title: "Reason required", description: "Please describe your reason.", variant: "destructive" })
      return
    }
    if (!file) {
      toast({
        title: "Document required",
        description: "Please attach a supporting document.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const result = await submitJustificationApi(absence._id, reason.trim(), file)
      if (result.success) {
        toast({
          title: "Justification submitted",
          description: "Your justification is pending review.",
        })
        onSuccess(absence._id)
        reset()
        onOpenChange(false)
      } else {
        toast({
          title: "Submission failed",
          description: result.error || "Could not submit your justification.",
          variant: "destructive",
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit a justification</DialogTitle>
          <DialogDescription>
            {absence?.courseName ? `For ${absence.courseName} — ` : ""}
            Provide a reason and attach a supporting document. Submissions are reviewed by your
            education manager.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you were absent..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Supporting document</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => {
                    setFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start text-muted-foreground"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose a file (PDF, image, or document)
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Spinner className="mr-2 h-4 w-4" />}
            Submit justification
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
