"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ROOM_TYPE_LABELS, type Room } from "@/types/room"
import { Users, Building2, Layers, CalendarPlus, MonitorCheck } from "lucide-react"

interface AvailableRoomCardProps {
  room: Room
  onBook: (room: Room) => void
}

export function AvailableRoomCard({ room, onBook }: AvailableRoomCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="default">{ROOM_TYPE_LABELS[room.type]}</Badge>
        </div>
        <CardTitle className="text-lg leading-tight">{room.name}</CardTitle>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          {room.building}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{room.capacity} seats</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="h-4 w-4" />
            <span>Floor {room.floor}</span>
          </div>
        </div>
        {room.equipment && room.equipment.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
              <MonitorCheck className="h-3.5 w-3.5" />
              Equipment
            </div>
            <div className="flex flex-wrap gap-1.5">
              {room.equipment.map((item) => (
                <Badge key={item} variant="outline" className="font-normal">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <Button className="mt-4 w-full" onClick={() => onBook(room)}>
          <CalendarPlus className="mr-2 h-4 w-4" />
          Book Room
        </Button>
      </CardContent>
    </Card>
  )
}
