"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { firebaseService } from "@/lib/firebase"
import type { MoodEntry, Habit } from "@/lib/types"
import { Heart, Plus, TrendingUp, Calendar, Flame } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { MoodChart } from "./MoodChart"
import { HabitModal } from "./HabitModal"


export function MoodView() {
  const { user } = useAuth()
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false)
  const [todayMood, setTodayMood] = useState<"very-happy" | "happy" | "neutral" | "sad" | "very-sad" | null>(null)
  const [moodNotes, setMoodNotes] = useState("")
  const [isLoggingMood, setIsLoggingMood] = useState(false)

  useEffect(() => {
    if (user) {
      loadMoodEntries()
      loadHabits()
    }
  }, [user])

  const loadMoodEntries = async () => {
    if (!user) return
    const userMoods = await firebaseService.getUserMoodEntries(user.id)
    setMoodEntries(userMoods || [])

    // Check if mood is already logged today
    const today = new Date().toISOString().split("T")[0]
    const todayEntry = userMoods?.find((entry) => entry.date.startsWith(today))
    if (todayEntry) {
      setTodayMood(todayEntry.mood)
      setMoodNotes(todayEntry.notes || "")
    }
  }

  const loadHabits = async () => {
    if (!user) return
    const userHabits = await firebaseService.getUserHabits(user.id)
    setHabits(userHabits || [])
  }

  const handleMoodSave = async () => {
    if (!user || !todayMood) return

    const today = new Date().toISOString().split("T")[0]
    const existingEntry = moodEntries.find((entry) => entry.date.startsWith(today))

    const moodData = {
      userId: user.id,
      mood: todayMood,
      notes: moodNotes.trim() || undefined,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }

    if (existingEntry) {
      await firebaseService.put(`mood-entries/${existingEntry.id}`, { ...existingEntry, ...moodData })
    } else {
      await firebaseService.createMoodEntry({ ...moodData, id: Date.now().toString() })
    }

    await loadMoodEntries()
    setIsLoggingMood(false)
  }

  const handleHabitSave = async (habitData: Partial<Habit>) => {
    if (!user) return

    if (selectedHabit) {
      const updatedHabit = { ...selectedHabit, ...habitData, updatedAt: new Date().toISOString() }
      await firebaseService.put(`habits/${selectedHabit.id}`, updatedHabit)
    } else {
      const newHabit = {
        ...habitData,
        userId: user.id,
        id: Date.now().toString(),
        streak: 0,
        completedDates: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await firebaseService.createHabit(newHabit)
    }

    await loadHabits()
    setIsHabitModalOpen(false)
    setSelectedHabit(null)
  }

  const handleHabitDelete = async (habitId: string) => {
    await firebaseService.delete(`habits/${habitId}`)
    await loadHabits()
    setIsHabitModalOpen(false)
    setSelectedHabit(null)
  }

  const handleHabitToggle = async (habit: Habit) => {
    const today = new Date().toISOString().split("T")[0]
    const isCompletedToday = habit.completedDates.includes(today)

    let newCompletedDates: string[]
    let newStreak = habit.streak

    if (isCompletedToday) {
      // Remove today's completion
      newCompletedDates = habit.completedDates.filter((date) => date !== today)
      newStreak = Math.max(0, habit.streak - 1)
    } else {
      // Add today's completion
      newCompletedDates = [...habit.completedDates, today].sort()

      // Calculate new streak
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split("T")[0]

      if (habit.completedDates.includes(yesterdayStr) || habit.streak === 0) {
        newStreak = habit.streak + 1
      } else {
        newStreak = 1 // Reset streak if there was a gap
      }
    }

    const updatedHabit = {
      ...habit,
      completedDates: newCompletedDates,
      streak: newStreak,
      updatedAt: new Date().toISOString(),
    }

    await firebaseService.put(`habits/${habit.id}`, updatedHabit)
    await loadHabits()
  }

  const openHabitModal = (habit?: Habit) => {
    setSelectedHabit(habit || null)
    setIsHabitModalOpen(true)
  }

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case "very-happy":
        return "😄"
      case "happy":
        return "😊"
      case "neutral":
        return "😐"
      case "sad":
        return "😔"
      case "very-sad":
        return "😢"
      default:
        return "😐"
    }
  }

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case "very-happy":
        return "bg-green-100 text-green-800 border-green-200"
      case "happy":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "neutral":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "sad":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "very-sad":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getHabitStats = () => {
    const totalHabits = habits.length
    const activeStreaks = habits.filter((h) => h.streak > 0).length
    const completedToday = habits.filter((h) => {
      const today = new Date().toISOString().split("T")[0]
      return h.completedDates.includes(today)
    }).length
    const longestStreak = Math.max(...habits.map((h) => h.streak), 0)

    return { totalHabits, activeStreaks, completedToday, longestStreak }
  }

  const getMoodStats = () => {
    const totalEntries = moodEntries.length
    const thisWeek = moodEntries.filter((entry) => {
      const entryDate = new Date(entry.date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return entryDate >= weekAgo
    }).length

    const moodCounts = moodEntries.reduce(
      (acc, entry) => {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const dominantMood = Object.entries(moodCounts).reduce(
      (a, b) => (moodCounts[a[0]] > moodCounts[b[0]] ? a : b),
      ["neutral", 0],
    )[0]

    return { totalEntries, thisWeek, dominantMood }
  }

  const habitStats = getHabitStats()
  const moodStats = getMoodStats()

  const today = new Date().toISOString().split("T")[0]
  const hasMoodToday = moodEntries.some((entry) => entry.date.startsWith(today))

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-500">{moodStats.totalEntries}</div>
                <div className="text-sm text-muted-foreground">Mood Entries</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-500">{habitStats.totalHabits}</div>
                <div className="text-sm text-muted-foreground">Total Habits</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-orange-500">{habitStats.longestStreak}</div>
                <div className="text-sm text-muted-foreground">Longest Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-500">{habitStats.completedToday}</div>
                <div className="text-sm text-muted-foreground">Done Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood Tracking */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Daily Mood</h3>
            {moodStats.dominantMood && (
              <Badge variant="outline" className={getMoodColor(moodStats.dominantMood)}>
                Most Common: {getMoodEmoji(moodStats.dominantMood)} {moodStats.dominantMood.replace("-", " ")}
              </Badge>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">How are you feeling today?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hasMoodToday || isLoggingMood ? (
                <>
                  <div className="grid grid-cols-5 gap-2">
                    {(["very-sad", "sad", "neutral", "happy", "very-happy"] as const).map((mood) => (
                      <Button
                        key={mood}
                        variant={todayMood === mood ? "default" : "outline"}
                        className="h-16 flex flex-col gap-1"
                        onClick={() => setTodayMood(mood)}
                      >
                        <span className="text-2xl">{getMoodEmoji(mood)}</span>
                        <span className="text-xs capitalize">{mood.replace("-", " ")}</span>
                      </Button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Any notes about your mood today? (optional)"
                    value={moodNotes}
                    onChange={(e) => setMoodNotes(e.target.value)}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleMoodSave} disabled={!todayMood}>
                      Save Mood
                    </Button>
                    {isLoggingMood && (
                      <Button variant="outline" onClick={() => setIsLoggingMood(false)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">{getMoodEmoji(todayMood!)}</div>
                  <div className="text-lg font-medium capitalize mb-2">{todayMood!.replace("-", " ")}</div>
                  {moodNotes && <p className="text-sm text-muted-foreground mb-4">"{moodNotes}"</p>}
                  <Button variant="outline" size="sm" onClick={() => setIsLoggingMood(true)}>
                    Update Mood
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mood Chart */}
          {moodEntries.length > 0 && <MoodChart entries={moodEntries} />}
        </div>

        {/* Habit Tracking */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Habits</h3>
            <Button onClick={() => openHabitModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Habit
            </Button>
          </div>

          <div className="space-y-3">
            {habits.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">No habits yet</h4>
                  <p className="text-muted-foreground mb-4">
                    Start building positive daily habits to improve your life
                  </p>
                  <Button onClick={() => openHabitModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Habit
                  </Button>
                </CardContent>
              </Card>
            ) : (
              habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onToggle={handleHabitToggle}
                  onEdit={openHabitModal}
                  onDelete={handleHabitDelete}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Habit Modal */}
      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={() => {
          setIsHabitModalOpen(false)
          setSelectedHabit(null)
        }}
        habit={selectedHabit}
        onSave={handleHabitSave}
        onDelete={selectedHabit ? () => handleHabitDelete(selectedHabit.id) : undefined}
      />
    </div>
  )
}

// Habit Card Component
interface HabitCardProps {
  habit: Habit
  onToggle: (habit: Habit) => void
  onEdit: (habit: Habit) => void
  onDelete: (habitId: string) => void
}

function HabitCard({ habit, onToggle, onEdit, onDelete }: HabitCardProps) {
  const today = new Date().toISOString().split("T")[0]
  const isCompletedToday = habit.completedDates.includes(today)

  const getLastSevenDays = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push(date.toISOString().split("T")[0])
    }
    return days
  }

  const lastSevenDays = getLastSevenDays()

  return (
    <Card className={`transition-all hover:shadow-md ${isCompletedToday ? "bg-green-50 border-green-200" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium flex items-center gap-2">
              {habit.name}
              {habit.streak > 0 && (
                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                  <Flame className="h-3 w-3 mr-1" />
                  {habit.streak}
                </Badge>
              )}
            </h4>
            {habit.description && <p className="text-sm text-muted-foreground mt-1">{habit.description}</p>}
            <div className="text-xs text-muted-foreground mt-1 capitalize">{habit.frequency}</div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(habit)}>
              Edit
            </Button>
          </div>
        </div>

        {/* Last 7 days visualization */}
        <div className="flex items-center gap-1 mb-3">
          <span className="text-xs text-muted-foreground mr-2">Last 7 days:</span>
          {lastSevenDays.map((date) => {
            const isCompleted = habit.completedDates.includes(date)
            const isToday = date === today
            return (
              <div
                key={date}
                className={`w-6 h-6 rounded-sm border-2 flex items-center justify-center text-xs ${
                  isCompleted
                    ? "bg-green-500 border-green-500 text-white"
                    : isToday
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 bg-gray-50"
                }`}
              >
                {isCompleted && "✓"}
              </div>
            )
          })}
        </div>

        <Button
          onClick={() => onToggle(habit)}
          variant={isCompletedToday ? "default" : "outline"}
          size="sm"
          className="w-full"
        >
          {isCompletedToday ? "✓ Completed Today" : "Mark as Done"}
        </Button>
      </CardContent>
    </Card>
  )
}
