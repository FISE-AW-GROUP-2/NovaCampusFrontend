"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { RoomCard } from "./room-card"
import { RoomFormDialog } from "./room-form-dialog"
import { useToast } from "@/hooks/use-toast"
import { getRoomsApi, deleteRoomApi } from "@/lib/api/rooms"
import { RoomType, ROOM_TYPE_LABELS, type Room } from "@/types/room"
import { Plus, Search, DoorOpen } from "lucide-react"

const TYPE_OPTIONS: Array<RoomType | "all"> = ["all", ...Object.values(RoomType)]

export function ManageRoomsContent() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [type, setType] = useState<RoomType | "all">("all")

  const [showRoomForm, setShowRoomForm] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)

  const { toast } = useToast()

  const fetchRooms = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getRoomsApi({
        search: search || undefined,
        type,
      })
      if (result.success && result.data) {
        setRooms(result.data.rooms)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch rooms",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [search, type])

  useEffect(() => {
    const debounce = setTimeout(fetchRooms, 300)
    return () => clearTimeout(debounce)
  }, [fetchRooms])

  const handleRoomSuccess = (room: Room) => {
    setRooms((prev) => {
      const exists = prev.find((r) => r._id === room._id)
      return exists ? prev.map((r) => (r._id === room._id ? room : r)) : [room, ...prev]
    })
    setEditingRoom(null)
  }

  const handleDeleteRoom = async (roomId: string) => {
    const result = await deleteRoomApi(roomId)
    if (result.success) {
      setRooms((prev) => prev.filter((r) => r._id !== roomId))
      toast({ title: "Room deleted", description: "The room has been deleted successfully." })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete room",
        variant: "destructive",
      })
    }
  }

  const handleEditClick = (room: Room) => {
    setEditingRoom(room)
    setShowRoomForm(true)
  }

  const handleFormClose = (open: boolean) => {
    if (!open) setEditingRoom(null)
    setShowRoomForm(open)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={type} onValueChange={(v) => setType(v as RoomType | "all")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Room type" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt === "all" ? "All Types" : ROOM_TYPE_LABELS[opt]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowRoomForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Room
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-12">
          <DoorOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No rooms found</h3>
          <p className="text-muted-foreground mb-4">
            {search || type !== "all"
              ? "Try adjusting your filters"
              : "Get started by adding your first room"}
          </p>
          {!search && type === "all" && (
            <Button onClick={() => setShowRoomForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Room
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <RoomCard
              key={room._id}
              room={room}
              onEdit={handleEditClick}
              onDelete={handleDeleteRoom}
            />
          ))}
        </div>
      )}

      <RoomFormDialog
        open={showRoomForm}
        onOpenChange={handleFormClose}
        room={editingRoom}
        onSuccess={handleRoomSuccess}
      />
    </div>
  )
}
