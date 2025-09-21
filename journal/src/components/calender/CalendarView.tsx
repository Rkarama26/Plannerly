import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Event } from "@/lib/types"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { firebaseService } from "@/lib/firebase"
import { EventModal } from "./EventModal"

type ViewType = "month" | "week" | "day"

export function CalendarView() {
    const { user } = useAuth()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [viewType, setViewType] = useState<ViewType>("month")
    const [events, setEvents] = useState<Event[]>([])
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    useEffect(() => {
        if (user) {
            loadEvents()
        }
    }, [user])

    const loadEvents = async () => {
        if (!user) return
        const userEvents = await firebaseService.getUserEvents(user.id)
        setEvents(userEvents || [])
    }

    const handleEventSave = async (eventData: Partial<Event>) => {
        if (!user) return

        if (selectedEvent) {
            // Update existing event
            const updatedEvent = { ...selectedEvent, ...eventData, updatedAt: new Date().toISOString() }
            await firebaseService.put(`events/${selectedEvent.id}`, updatedEvent)
        } else {
            // Create new event
            const newEvent = {
                ...eventData,
                userId: user.id,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
            await firebaseService.createEvent(newEvent)
        }

        await loadEvents()
        setIsModalOpen(false)
        setSelectedEvent(null)
        setSelectedDate(null)
    }

    const handleEventDelete = async (eventId: string) => {
        await firebaseService.deleteTask(eventId)
        await loadEvents()
        setIsModalOpen(false)
        setSelectedEvent(null)
    }

    const navigateDate = (direction: "prev" | "next") => {
        const newDate = new Date(currentDate)

        if (viewType === "month") {
            newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
        } else if (viewType === "week") {
            newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
        } else {
            newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1))
        }

        setCurrentDate(newDate)
    }



    const formatDateHeader = () => {
        const options: Intl.DateTimeFormatOptions =
            viewType === "month"
                ? { year: "numeric", month: "long" }
                : viewType === "week"
                    ? { year: "numeric", month: "long", day: "numeric" }
                    : { year: "numeric", month: "long", day: "numeric", weekday: "long" }

        return currentDate.toLocaleDateString("en-US", options)
    }

    const openEventModal = (event?: Event, date?: Date) => {
        setSelectedEvent(event || null)
        setSelectedDate(date || null)
        setIsModalOpen(true)
    }

    return (
        <div className="space-y-6">
            {/* Calendar Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <h2 className="text-xl font-semibold min-w-[200px] text-center">{formatDateHeader()}</h2>
                        <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                        Today
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex rounded-lg border border-border p-1">
                        {(["month", "week", "day"] as ViewType[]).map((view) => (
                            <Button
                                key={view}
                                variant={viewType === view ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewType(view)}
                                className="capitalize"
                            >
                                {view}
                            </Button>
                        ))}
                    </div>
                    <Button onClick={() => openEventModal()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Event
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <Card>
                <CardContent className="p-0">
                    {viewType === "month" && (
                        <MonthView
                            currentDate={currentDate}
                            events={events}
                            onEventClick={openEventModal}
                            onDateClick={openEventModal}
                        />
                    )}
                    {viewType === "week" && (
                        <WeekView
                            currentDate={currentDate}
                            events={events}
                            onEventClick={openEventModal}
                            onDateClick={openEventModal}
                        />
                    )}
                    {viewType === "day" && <DayView currentDate={currentDate} events={events} onEventClick={openEventModal} />}
                </CardContent>
            </Card>

            {/* Event Modal */}
            <EventModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setSelectedEvent(null)
                    setSelectedDate(null)
                }}
                event={selectedEvent}
                selectedDate={selectedDate}
                onSave={handleEventSave}
                onDelete={selectedEvent ? () => handleEventDelete(selectedEvent.id) : undefined}
            />
        </div>
    )
}
const getEventsForDate = (events: Event[], date: Date) => {
    return events.filter((event) => {
        const eventDate = new Date(event.startDate)
        return eventDate.toDateString() === date.toDateString()
    })
}

// Month View Component
function MonthView({
    currentDate,
    events,
    onEventClick,
    onDateClick,
}: {
    currentDate: Date
    events: Event[]
    onEventClick: (event: Event) => void
    onDateClick: (event?: Event, date?: Date) => void
}) {

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const startOfWeek = new Date(startOfMonth)
    startOfWeek.setDate(startOfMonth.getDate() - startOfMonth.getDay())

    const days = []
    const current = new Date(startOfWeek)

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
        days.push(new Date(current))
        current.setDate(current.getDate() + 1)
    }

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    return (
        <div className="grid grid-cols-7 gap-0 border-b border-border">
            {/* Week day headers */}
            {weekDays.map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-b border-border">
                    {day}
                </div>
            ))}

            {/* Calendar days */}
            {days.map((day, index) => {
                const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                const isToday = day.toDateString() === new Date().toDateString()
                const dayEvents = getEventsForDate(events, day)

                return (
                    <div
                        key={index}
                        className={`min-h-[100px] p-2 border-b border-r border-border cursor-pointer hover:bg-muted/50 ${!isCurrentMonth ? "text-muted-foreground bg-muted/20" : ""
                            } ${isToday ? "bg-primary/10" : ""}`}
                        onClick={() => onDateClick(undefined, day)}
                    >
                        <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary" : ""}`}>{day.getDate()}</div>
                        <div className="space-y-1">
                            {dayEvents.slice(0, 2).map((event) => (
                                <div
                                    key={event.id}
                                    className="text-xs p-1 rounded bg-primary/20 text-primary cursor-pointer hover:bg-primary/30 truncate"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onEventClick(event)
                                    }}
                                >
                                    {event.title}
                                </div>
                            ))}
                            {dayEvents.length > 2 && (
                                <div className="text-xs text-muted-foreground">+{dayEvents.length - 2} more</div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// Week View Component
function WeekView({
    currentDate,
    events,
    onEventClick,
    onDateClick,
}: {
    currentDate: Date
    events: Event[]
    onEventClick: (event: Event) => void
    onDateClick: (event?: Event, date?: Date) => void
}) {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

    // redefine weekDays to be array of Date objects
    const weekDays: Date[] = []
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek)
        day.setDate(startOfWeek.getDate() + i)
        weekDays.push(day)
    }

    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
        <div className="grid grid-cols-8 gap-0">
            {/* Time column header */}
            <div className="p-3 border-b border-r border-border"></div>

            {/* Day headers */}
            {weekDays.map((day) => {
                const isToday = day.toDateString() === new Date().toDateString()
                return (
                    <div
                        key={day.toISOString()}
                        className={`p-3 text-center border-b border-r border-border cursor-pointer hover:bg-muted/50 ${isToday ? "bg-primary/10 text-primary font-medium" : ""
                            }`}
                        onClick={() => onDateClick(undefined, day)}
                    >
                        <div className="text-sm font-medium">{day.toLocaleDateString("en-US", { weekday: "short" })}</div>
                        <div className="text-lg">{day.getDate()}</div>
                    </div>
                )
            })}

            {/* Time slots */}
            {hours.map((hour) => (
                <div key={hour} className="contents">
                    {/* Time label */}
                    <div className="p-2 text-xs text-muted-foreground border-b border-r border-border text-right">
                        {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                    </div>

                    {/* Day columns */}
                    {weekDays.map((day) => {
                        const dayEvents = getEventsForDate(events, day).filter(
                            (event) => new Date(event.startDate).getHours() === hour
                        )

                        return (
                            <div
                                key={`${day.toISOString()}-${hour}`}
                                className="min-h-[60px] p-1 border-b border-r border-border cursor-pointer hover:bg-muted/50"
                                onClick={() => {
                                    const selectedDateTime = new Date(day)
                                    selectedDateTime.setHours(hour, 0, 0, 0)
                                    onDateClick(undefined, selectedDateTime)
                                }}
                            >
                                {dayEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        className="text-xs p-1 rounded bg-primary/20 text-primary cursor-pointer hover:bg-primary/30 mb-1"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onEventClick(event)
                                        }}
                                    >
                                        {event.title}
                                    </div>
                                ))}
                            </div>
                        )
                    })}
                </div>
            ))}
        </div>
    )
}

// Day View Component
function DayView({
    currentDate,
    events,
    onEventClick,
}: {
    currentDate: Date
    events: Event[]
    onEventClick: (event: Event) => void
}) {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const dayEvents = getEventsForDate(events, currentDate)


    return (
        <div className="space-y-0">
            {hours.map((hour) => {
                const hourEvents = dayEvents.filter((event) => {
                    const eventDate = new Date(event.startDate)
                    return eventDate.getHours() === hour
                })

                return (
                    <div key={hour} className="flex border-b border-border min-h-[80px]">
                        <div className="w-20 p-3 text-sm text-muted-foreground text-right border-r border-border">
                            {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                        </div>
                        <div className="flex-1 p-3 space-y-2">
                            {hourEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className="p-3 rounded-lg bg-primary/20 text-primary cursor-pointer hover:bg-primary/30 border-l-4 border-primary"
                                    onClick={() => onEventClick(event)}
                                >
                                    <div className="font-medium">{event.title}</div>
                                    {event.description && <div className="text-sm text-muted-foreground mt-1">{event.description}</div>}
                                    <div className="text-xs text-muted-foreground mt-2">
                                        {new Date(event.startDate).toLocaleTimeString("en-US", {
                                            hour: "numeric",
                                            minute: "2-digit",
                                        })}
                                        {event.endDate && (
                                            <span>
                                                {" - "}
                                                {new Date(event.endDate).toLocaleTimeString("en-US", {
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
