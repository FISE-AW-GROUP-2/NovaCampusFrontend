"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { AvailableRoomCard } from "./available-room-card"
import { BookRoomDialog } from "./book-room-dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { getAvailableRoomsApi, bookRoomApi } from "@/lib/api/rooms"
import type { Room, BookingFormData } from "@/types/room"
import { CalendarSearch, DoorOpen, Search } from "lucide-react"

function todayStr() {
  return new Date().toISOString().split("T")[0]
}

export function RoomBookingContent() {
  const [date, setDate] = useState(todayStr())
  const [start, setStart] = useState("09:00")
  const [end, setEnd] = useState("11:00")

  const [rooms, setRooms] = useState<Room[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [showBookDialog, setShowBookDialog] = useState(false)
  const [isBooking, setIsBooking] = useState(false)

  const { toast } = useToast()
  const { user } = useAuth()

  const searchAvailability = useCallback(async () => {
    if (start >= end) {
      toast({
        title: "Invalid time range",
        description: "Start time must be before end time.",
        variant: "destructive",
      })
      return
    }
    setIsSearching(true)
    setHasSearched(true)
    try {
      const result = await getAvailableRoomsApi({
        date,
        start,
        end,
        campusId: user?.campusId,
      })
      if (result.success && result.data) {
        setRooms(result.data.availableRooms)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch available rooms",
          variant: "destructive",
        })
        setRooms([])
      }
    } finally {
      setIsSearching(false)
    }
  }, [date, start, end, user?.campusId])

  const handleBookClick = (room: Room) => {
    setSelectedRoom(room)
    setShowBookDialog(true)
  }

  const handleBook = async (courseId: string) => {
    if (!selectedRoom) return
    setIsBooking(true)
    try {
      const payload: BookingFormData = {
        roomId: selectedRoom._id,
        courseId,
        date,
        startTime: start,
        endTime: end,
      }
      const result = await bookRoomApi(payload)
      if (result.success) {
        toast({
          title: "Room booked",
          description: `${selectedRoom.name} is booked for ${date}, ${start}–${end}.`,
        })
        setShowBookDialog(false)
        // Remove the now-booked room from the available list
        setRooms((prev) => prev.filter((r) => r._id !== selectedRoom._id))
        setSelectedRoom(null)
      } else if (result.status === 409) {
        toast({
          title: "Room not available",
          description: "This room was just booked for the selected slot. Please pick another.",
          variant: "destructive",
        })
        setShowBookDialog(false)
        setRooms((prev) => prev.filter((r) => r._id !== selectedRoom._id))
      } else {
        toast({
          title: "Booking failed",
          description: result.error || "Failed to book the room",
          variant: "destructive",
        })
      }
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search criteria */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                min={todayStr()}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="start">Start Time</Label>
              <Input
                id="start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="end">End Time</Label>
              <Input id="end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <Button onClick={searchAvailability} disabled={isSearching} className="lg:w-auto">
              {isSearching ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Find Available Rooms
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isSearching ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : !hasSearched ? (
        <div className="text-center py-12">
          <CalendarSearch className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Find a room</h3>
          <p className="text-muted-foreground">
            Select a date and time slot to see which rooms are available.
          </p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-12">
          <DoorOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No rooms available</h3>
          <p className="text-muted-foreground">
            No rooms are free for {date}, {start}–{end}. Try a different slot.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{rooms.length} available</Badge>
            <span className="text-sm text-muted-foreground">
              for {date}, {start}–{end}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <AvailableRoomCard key={room._id} room={room} onBook={handleBookClick} />
            ))}
          </div>
        </div>
      )}

      <BookRoomDialog
        open={showBookDialog}
        onOpenChange={setShowBookDialog}
        room={selectedRoom}
        date={date}
        startTime={start}
        endTime={end}
        onBook={handleBook}
        isLoading={isBooking}
      />
    </div>
  )
}
