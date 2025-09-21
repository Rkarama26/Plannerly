import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Habit } from "@/lib/types"
import { Trash2 } from "lucide-react"

interface HabitModalProps {
  isOpen: boolean
  onClose: () => void
  habit?: Habit | null
  onSave: (habit: Partial<Habit>) => void
  onDelete?: () => void
}

export function HabitModal({ isOpen, onClose, habit, onSave, onDelete }: HabitModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily")

  useEffect(() => {
    if (habit) {
      setName(habit.name)
      setDescription(habit.description || "")
      setFrequency(habit.frequency)
    } else {
      setName("")
      setDescription("")
      setFrequency("daily")
    }
  }, [habit, isOpen])

  const handleSave = () => {
    if (!name.trim()) return

    const habitData: Partial<Habit> = {
      name: name.trim(),
      description: description.trim() || undefined,
      frequency,
    }

    onSave(habitData)
  }

  const commonHabits = [
    "Drink 8 glasses of water",
    "Exercise for 30 minutes",
    "Read for 20 minutes",
    "Meditate for 10 minutes",
    "Write in journal",
    "Take vitamins",
    "Go to bed by 10 PM",
    "No social media before noon",
    "Practice gratitude",
    "Learn something new",
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{habit ? "Edit Habit" : "Create Habit"}</DialogTitle>
          <DialogDescription>
            {habit ? "Update your habit details" : "Create a new habit to track daily"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Habit Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Drink 8 glasses of water"
              list="common-habits"
            />
            <datalist id="common-habits">
              {commonHabits.map((habitName) => (
                <option key={habitName} value={habitName} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why is this habit important to you?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select value={frequency} onValueChange={(value: "daily" | "weekly" | "monthly") => setFrequency(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {habit && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium mb-2">Current Progress</div>
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-2xl font-bold text-orange-500">{habit.streak}</div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{habit.completedDates.length}</div>
                  <div className="text-sm text-muted-foreground">Total Completions</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {habit && onDelete && (
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
            <Button onClick={handleSave} disabled={!name.trim()}>
              {habit ? "Update" : "Create Habit"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
