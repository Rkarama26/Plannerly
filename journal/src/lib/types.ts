export interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

export interface Task {
  id: string
  userId: string
  title: string
  description?: string
  completed: boolean
  priority: "low" | "medium" | "high"
  category: "work" | "personal" | "hobbies"
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export interface Event {
  id: string
  userId: string
  title: string
  description?: string
  startDate: string
  endDate: string
  allDay: boolean
  color?: string
  createdAt: string
  updatedAt: string
}

export interface JournalEntry {
  id: string
  userId: string
  title: string
  content: string
  mood?: "very-happy" | "happy" | "neutral" | "sad" | "very-sad"
  tags: string[]
  date: string
  createdAt: string
  updatedAt: string
}

export interface Goal {
  id: string
  userId: string
  title: string
  description?: string
  targetValue: number
  currentValue: number
  unit: string
  category: string
  deadline?: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

export interface Habit {
  id: string
  userId: string
  name: string
  description?: string
  frequency: "daily" | "weekly" | "monthly"
  streak: number
  completedDates: string[]
  createdAt: string
  updatedAt: string
}

export interface MoodEntry {
  id: string
  userId: string
  mood: "very-happy" | "happy" | "neutral" | "sad" | "very-sad"
  notes?: string
  date: string
  createdAt: string
}
