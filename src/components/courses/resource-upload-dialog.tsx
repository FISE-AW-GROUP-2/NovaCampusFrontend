"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { ResourceType } from "@/types/course"
import { Upload, File, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ResourceUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  onUpload: (file: File, type: ResourceType) => Promise<void>
  isLoading?: boolean
}

const ALLOWED_TYPES: Record<string, string[]> = {
  [ResourceType.SLIDES]: [".pptx", ".ppt", ".pdf"],
  [ResourceType.DOCUMENT]: [".pdf", ".docx", ".doc", ".txt"],
  [ResourceType.VIDEO]: [".mp4", ".webm", ".mov"],
  [ResourceType.OTHER]: [".pdf", ".pptx", ".docx", ".mp4", ".zip"],
}

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

export function ResourceUploadDialog({
  open,
  onOpenChange,
  onUpload,
  isLoading,
}: ResourceUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [resourceType, setResourceType] = useState<ResourceType>(ResourceType.DOCUMENT)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const resetState = () => {
    setFile(null)
    setResourceType(ResourceType.DOCUMENT)
    setError(null)
    setDragActive(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState()
    }
    onOpenChange(newOpen)
  }

  const validateFile = (selectedFile: File): boolean => {
    // Check file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size must be less than 20 MB")
      return false
    }

    // Check file extension
    const extension = "." + selectedFile.name.split(".").pop()?.toLowerCase()
    const allowedExtensions = ALLOWED_TYPES[resourceType]
    if (!allowedExtensions.includes(extension)) {
      setError(`Invalid file type. Allowed: ${allowedExtensions.join(", ")}`)
      return false
    }

    setError(null)
    return true
  }

  const handleFileSelect = (selectedFile: File) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError("Please select a file")
      return
    }
    await onUpload(file, resourceType)
    resetState()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Upload Course Resource</DialogTitle>
          <DialogDescription>
            Upload slides, documents, or videos for this course. Max file size: 20 MB.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resourceType">Resource Type</Label>
              <Select
                value={resourceType}
                onValueChange={(value) => {
                  setResourceType(value as ResourceType)
                  setFile(null)
                  setError(null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ResourceType.SLIDES}>Slides (PPT, PDF)</SelectItem>
                  <SelectItem value={ResourceType.DOCUMENT}>Document (PDF, DOCX)</SelectItem>
                  <SelectItem value={ResourceType.VIDEO}>Video (MP4, WebM)</SelectItem>
                  <SelectItem value={ResourceType.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>File</Label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50",
                  file && "border-primary bg-primary/5"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  accept={ALLOWED_TYPES[resourceType].join(",")}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileSelect(e.target.files[0])
                    }
                  }}
                />

                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <File className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Drag and drop or click to select
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Allowed: {ALLOWED_TYPES[resourceType].join(", ")}
                    </p>
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !file}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              Upload Resource
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
