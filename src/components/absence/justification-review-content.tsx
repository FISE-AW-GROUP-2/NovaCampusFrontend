"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { getPendingJustificationsApi, reviewJustificationApi } from "@/lib/api/absences"
import {
  justificationDecisionConfig,
  type JustificationRequest,
} from "@/types/absence"
import {
  FileText,
  CheckCircle2,
  XCircle,
  Inbox,
  Calendar,
  User,
} from "lucide-react"

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

export function JustificationReviewContent() {
  const { toast } = useToast()

  const [requests, setRequests] = useState<JustificationRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actioningId, setActioningId] = useState<string | null>(null)

  // Reject dialog state
  const [rejectTarget, setRejectTarget] = useState<JustificationRequest | null>(null)
  const [rejectNote, setRejectNote] = useState("")

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getPendingJustificationsApi()
      if (result.success && result.data) {
        setRequests(result.data.justifications)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch justifications.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  // The backend only serves the pending queue, so a decided item leaves the list.
  const applyDecision = (id: string) => {
    setRequests((prev) => prev.filter((r) => r._id !== id))
  }

  const handleApprove = async (request: JustificationRequest) => {
    setActioningId(request._id)
    try {
      const result = await reviewJustificationApi(request._id, { decision: "approved" })
      if (result.success) {
        toast({ title: "Justification approved", description: "The student has been notified." })
        applyDecision(request._id)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to approve justification.",
          variant: "destructive",
        })
      }
    } finally {
      setActioningId(null)
    }
  }

  const handleConfirmReject = async () => {
    if (!rejectTarget) return
    if (!rejectNote.trim()) {
      toast({
        title: "Note required",
        description: "Please provide a reason for rejecting.",
        variant: "destructive",
      })
      return
    }
    setActioningId(rejectTarget._id)
    try {
      const result = await reviewJustificationApi(rejectTarget._id, {
        decision: "rejected",
        rejectionNote: rejectNote.trim(),
      })
      if (result.success) {
        toast({ title: "Justification rejected", description: "The student has been notified." })
        applyDecision(rejectTarget._id)
        setRejectTarget(null)
        setRejectNote("")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to reject justification.",
          variant: "destructive",
        })
      }
    } finally {
      setActioningId(null)
    }
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nothing to review</h3>
          <p className="text-muted-foreground">
            There are no pending justifications right now.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map((request) => {
            const decisionCfg = justificationDecisionConfig[request.decision]
            const isPending = request.decision === "pending"
            const busy = actioningId === request._id
            return (
              <Card key={request._id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {request.courseName || request.absence?.courseName || "Course"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {request.studentName || request.studentEmail || "Student"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(request.sessionDate || request.absence?.sessionDate)}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className={`${decisionCfg.bgColor} ${decisionCfg.color} shrink-0`}>
                      {decisionCfg.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Reason</p>
                    <p className="text-sm">{request.reason}</p>
                  </div>

                  {request.documentUrl && (
                    <a
                      href={request.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      View document
                    </a>
                  )}

                  {request.decision === "rejected" && request.rejectionNote && (
                    <div className="rounded-lg bg-red-500/5 p-3">
                      <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                        Rejection note
                      </p>
                      <p className="text-sm text-muted-foreground">{request.rejectionNote}</p>
                    </div>
                  )}

                  {isPending && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={busy}
                        onClick={() => handleApprove(request)}
                      >
                        {busy ? <Spinner className="mr-1.5 h-3.5 w-3.5" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-destructive hover:text-destructive"
                        disabled={busy}
                        onClick={() => {
                          setRejectTarget(request)
                          setRejectNote("")
                        }}
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null)
            setRejectNote("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject justification</DialogTitle>
            <DialogDescription>
              Provide a note explaining why this justification is rejected. The student will be
              notified and the absence will remain confirmed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="rejectNote">Rejection note</Label>
            <Textarea
              id="rejectNote"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Explain the reason for rejection..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null)
                setRejectNote("")
              }}
              disabled={actioningId === rejectTarget?._id}
            >
              Cancel
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmReject}
              disabled={actioningId === rejectTarget?._id}
            >
              {actioningId === rejectTarget?._id && <Spinner className="mr-2 h-4 w-4" />}
              Reject justification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
