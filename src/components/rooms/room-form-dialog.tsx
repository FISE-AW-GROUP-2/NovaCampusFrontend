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
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createRoomApi, updateRoomApi } from "@/lib/api/rooms"
import { useAuth } from "@/contexts/auth-context"
import { RoomType, ROOM_TYPE_LABELS, type Room, type RoomFormData } from "@/types/room"
import { X, Plus } from "lucide-react"

interface RoomFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  room?: Room | null
  onSuccess?: (room: Room) => void
}

const DEFAULT_FORM: RoomFormData = {
  name: "",
  capacity: 30,
  type: RoomType.CLASSROOM,
  floor: 0,
  building: "",
  equipment: [],
  isActive: true,
}

export function RoomFormDialog({ open, onOpenChange, room, onSuccess }: RoomFormDialogProps) {
  const [formData, setFormData] = useState<RoomFormData>(DEFAULT_FORM)
  const [equipmentInput, setEquipmentInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const isEditing = !!room

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name,
        capacity: room.capacity,
        type: room.type,
        floor: room.floor,
        building: room.building,
        equipment: room.equipment ?? [],
        isActive: room.isActive,
      })
    } else {
      setFormData(DEFAULT_FORM)
    }
    setEquipmentInput("")
  }, [room, open])

  const addEquipment = () => {
    const value = equipmentInput.trim()
    if (value && !formData.equipment.includes(value)) {
      setFormData({ ...formData, equipment: [...formData.equipment, value] })
    }
    setEquipmentInput("")
  }

  const removeEquipment = (item: string) => {
    setFormData({ ...formData, equipment: formData.equipment.filter((e) => e !== item) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // campusId comes from the authenticated user (derived from the JWT).
      const result = isEditing
        ? await updateRoomApi(room._id, formData)
        : await createRoomApi({ ...formData, campusId: user?.campusId })

      if (result.success && result.data) {
        toast({
          title: isEditing ? "Room updated" : "Room created",
          description: `${formData.name} has been ${isEditing ? "updated" : "created"} successfully.`,
        })
        onSuccess?.(result.data)
        onOpenChange(false)
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${isEditing ? "update" : "create"} room`,
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Room" : "Create New Room"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the room details below."
              : "Fill in the details to add a new room."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Room Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Room A-101"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as RoomType })}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(RoomType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {ROOM_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="building">Building</Label>
                <Input
                  id="building"
                  placeholder="e.g., Science Wing"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  type="number"
                  value={formData.floor}
                  onChange={(e) =>
                    setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                max={1000}
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment">Equipment</Label>
              <div className="flex gap-2">
                <Input
                  id="equipment"
                  placeholder="e.g., Projector"
                  value={equipmentInput}
                  onChange={(e) => setEquipmentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addEquipment()
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" onClick={addEquipment}>
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add equipment</span>
                </Button>
              </div>
              {formData.equipment.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {formData.equipment.map((item) => (
                    <Badge key={item} variant="secondary" className="gap-1">
                      {item}
                      <button
                        type="button"
                        onClick={() => removeEquipment(item)}
                        className="ml-1 rounded-full hover:text-destructive"
                        aria-label={`Remove ${item}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="isActive">Active Status</Label>
              <div className="flex items-center gap-2 pt-1">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <span className="text-sm text-muted-foreground">
                  {formData.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {isEditing ? "Update Room" : "Create Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
