import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Event } from "@/lib/types"
import { Trash2 } from "lucide-react"

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  event?: Event | null
  selectedDate?: Date | null
  onSave: (event: Partial<Event>) => void
  onDelete?: () => void
}

export function EventModal({ isOpen, onClose, event, selectedDate, onSave, onDelete }: EventModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("")
  const [allDay, setAllDay] = useState(false)
  const [color, setColor] = useState("#15803d")

  useEffect(() => {
    if (event) {
      // Editing existing event
      setTitle(event.title)
      setDescription(event.description || "")
      setAllDay(event.allDay)
      setColor(event.color || "#15803d")

      const start = new Date(event.startDate)
      setStartDate(start.toISOString().split("T")[0])
      setStartTime(start.toTimeString().slice(0, 5))

      if (event.endDate) {
        const end = new Date(event.endDate)
        setEndDate(end.toISOString().split("T")[0])
        setEndTime(end.toTimeString().slice(0, 5))
      } else {
        setEndDate(start.toISOString().split("T")[0])
        setEndTime(start.toTimeString().slice(0, 5))
      }
    } else if (selectedDate) {
      // Creating new event with selected date
      const date = selectedDate.toISOString().split("T")[0]
      const time = selectedDate.toTimeString().slice(0, 5)

      setTitle("")
      setDescription("")
      setStartDate(date)
      setStartTime(time)
      setEndDate(date)
      setEndTime(time)
      setAllDay(false)
      setColor("#15803d")
    } else {
      // Creating new event without selected date
      const now = new Date()
      const date = now.toISOString().split("T")[0]
      const time = now.toTimeString().slice(0, 5)

      setTitle("")
      setDescription("")
      setStartDate(date)
      setStartTime(time)
      setEndDate(date)
      setEndTime(time)
      setAllDay(false)
      setColor("#15803d")
    }
  }, [event, selectedDate, isOpen])

  const handleSave = () => {
    if (!title.trim()) return

    let startDateTime: string
    let endDateTime: string

    if (allDay) {
      startDateTime = new Date(`${startDate}T00:00:00`).toISOString()
      endDateTime = new Date(`${endDate}T23:59:59`).toISOString()
    } else {
      startDateTime = new Date(`${startDate}T${startTime}`).toISOString()
      endDateTime = new Date(`${endDate}T${endTime}`).toISOString()
    }

    const eventData: Partial<Event> = {
      title: title.trim(),
      description: description.trim() || undefined,
      startDate: startDateTime,
      endDate: endDateTime,
      allDay,
      color,
    }

    onSave(eventData)
  }

  const colorOptions = [
    { value: "#15803d", label: "Green", class: "bg-green-600" },
    { value: "#3b82f6", label: "Blue", class: "bg-blue-500" },
    { value: "#ef4444", label: "Red", class: "bg-red-500" },
    { value: "#f59e0b", label: "Yellow", class: "bg-yellow-500" },
    { value: "#8b5cf6", label: "Purple", class: "bg-purple-500" },
    { value: "#06b6d4", label: "Cyan", class: "bg-cyan-500" },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Create Event"}</DialogTitle>
          <DialogDescription>
            {event ? "Update your event details" : "Add a new event to your calendar"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description (optional)"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="all-day" checked={allDay} onCheckedChange={setAllDay} />
            <Label htmlFor="all-day">All day event</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            {!allDay && (
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input id="start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            {!allDay && (
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${option.class} ${
                    color === option.value ? "border-foreground" : "border-border"
                  }`}
                  onClick={() => setColor(option.value)}
                  title={option.label}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {event && onDelete && (
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim()}>
              {event ? "Update" : "Create"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
