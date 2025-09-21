"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { firebaseService } from "@/lib/firebase"
import type { Goal } from "@/lib/types"
import { Plus, Search, Filter, Target, TrendingUp, Calendar, Award } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { GoalFilters } from "./GoalFilters"
import { GoalModal } from "./GoalModal"

export function GoalsView() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [filteredGoals, setFilteredGoals] = useState<Goal[]>([])
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState({
    category: "all",
    status: "all",
    deadline: "all",
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (user) {
      loadGoals()
    }
  }, [user])

  useEffect(() => {
    filterGoals()
  }, [goals, searchQuery, activeFilters])

  const loadGoals = async () => {
    if (!user) return
    const userGoals = await firebaseService.getUserGoals(user.id)
    setGoals(userGoals || [])
  }

  const filterGoals = () => {
    let filtered = [...goals]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (goal) =>
          goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          goal.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          goal.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Category filter
    if (activeFilters.category !== "all") {
      filtered = filtered.filter((goal) => goal.category === activeFilters.category)
    }

    // Status filter
    if (activeFilters.status !== "all") {
      if (activeFilters.status === "completed") {
        filtered = filtered.filter((goal) => goal.completed)
      } else if (activeFilters.status === "in-progress") {
        filtered = filtered.filter((goal) => !goal.completed && goal.currentValue > 0)
      } else if (activeFilters.status === "not-started") {
        filtered = filtered.filter((goal) => !goal.completed && goal.currentValue === 0)
      }
    }

    // Deadline filter
    if (activeFilters.deadline !== "all") {
      const now = new Date()
      const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      filtered = filtered.filter((goal) => {
        if (!goal.deadline) return activeFilters.deadline === "no-deadline"
        const deadline = new Date(goal.deadline)

        switch (activeFilters.deadline) {
          case "overdue":
            return deadline < now && !goal.completed
          case "this-week":
            return deadline <= oneWeek && deadline >= now
          case "this-month":
            return deadline <= oneMonth && deadline >= now
          case "future":
            return deadline > oneMonth
          case "no-deadline":
            return false
          default:
            return true
        }
      })
    }

    // Sort by progress (incomplete first, then by progress percentage)
    filtered.sort((a, b) => {
      if (a.completed && !b.completed) return 1
      if (!a.completed && b.completed) return -1

      const aProgress = (a.currentValue / a.targetValue) * 100
      const bProgress = (b.currentValue / b.targetValue) * 100
      return bProgress - aProgress
    })

    setFilteredGoals(filtered)
  }

  const handleGoalSave = async (goalData: Partial<Goal>) => {
    if (!user) return

    if (selectedGoal) {
      // Update existing goal
      const updatedGoal = { ...selectedGoal, ...goalData, updatedAt: new Date().toISOString() }
      await firebaseService.put(`goals/${selectedGoal.id}`, updatedGoal)
    } else {
      // Create new goal
      const newGoal = {
        ...goalData,
        userId: user.id,
        id: Date.now().toString(),
        currentValue: 0,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await firebaseService.createGoal(newGoal)
    }

    await loadGoals()
    setIsModalOpen(false)
    setSelectedGoal(null)
  }

  const handleGoalDelete = async (goalId: string) => {
    await firebaseService.delete(`goals/${goalId}`)
    await loadGoals()
    setIsModalOpen(false)
    setSelectedGoal(null)
  }

  const handleProgressUpdate = async (goal: Goal, newValue: number) => {
    const updatedGoal = {
      ...goal,
      currentValue: Math.max(0, Math.min(newValue, goal.targetValue)),
      completed: newValue >= goal.targetValue,
      updatedAt: new Date().toISOString(),
    }
    await firebaseService.put(`goals/${goal.id}`, updatedGoal)
    await loadGoals()
  }

  const openGoalModal = (goal?: Goal) => {
    setSelectedGoal(goal || null)
    setIsModalOpen(true)
  }

  const getProgressPercentage = (goal: Goal) => {
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-green-500"
    if (percentage >= 75) return "bg-blue-500"
    if (percentage >= 50) return "bg-yellow-500"
    if (percentage >= 25) return "bg-orange-500"
    return "bg-red-500"
  }

  const getDeadlineStatus = (goal: Goal) => {
    if (!goal.deadline) return null

    const now = new Date()
    const deadline = new Date(goal.deadline)
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (goal.completed) return { status: "completed", color: "bg-green-100 text-green-800", text: "Completed" }
    if (daysUntil < 0)
      return { status: "overdue", color: "bg-red-100 text-red-800", text: `${Math.abs(daysUntil)} days overdue` }
    if (daysUntil === 0) return { status: "today", color: "bg-orange-100 text-orange-800", text: "Due today" }
    if (daysUntil <= 7)
      return { status: "soon", color: "bg-yellow-100 text-yellow-800", text: `${daysUntil} days left` }
    return { status: "future", color: "bg-blue-100 text-blue-800", text: `${daysUntil} days left` }
  }

  const getGoalStats = () => {
    const total = goals.length
    const completed = goals.filter((g) => g.completed).length
    const inProgress = goals.filter((g) => !g.completed && g.currentValue > 0).length
    const overdue = goals.filter((g) => {
      if (!g.deadline || g.completed) return false
      return new Date(g.deadline) < new Date()
    }).length

    return { total, completed, inProgress, overdue }
  }

  const stats = getGoalStats()

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="shrink-0">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
        <Button onClick={() => openGoalModal()}>
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <GoalFilters
          activeFilters={activeFilters}
          onFiltersChange={setActiveFilters}
          availableCategories={[...new Set(goals.map((g) => g.category))]}
        />
      )}

      {/* Goal Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold text-primary">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Goals</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                <div className="text-sm text-muted-foreground">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {filteredGoals.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No goals found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ||
                activeFilters.category !== "all" ||
                activeFilters.status !== "all" ||
                activeFilters.deadline !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Set your first goal to start tracking your progress and achievements"}
              </p>
              {!searchQuery &&
                activeFilters.category === "all" &&
                activeFilters.status === "all" &&
                activeFilters.deadline === "all" && (
                  <Button onClick={() => openGoalModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Goal
                  </Button>
                )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={openGoalModal}
                onDelete={handleGoalDelete}
                onProgressUpdate={handleProgressUpdate}
                getProgressPercentage={getProgressPercentage}
                getProgressColor={getProgressColor}
                getDeadlineStatus={getDeadlineStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* Goal Modal */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedGoal(null)
        }}
        goal={selectedGoal}
        onSave={handleGoalSave}
        onDelete={selectedGoal ? () => handleGoalDelete(selectedGoal.id) : undefined}
      />
    </div>
  )
}

// Goal Card Component
interface GoalCardProps {
  goal: Goal
  onEdit: (goal: Goal) => void
  onDelete: (goalId: string) => void
  onProgressUpdate: (goal: Goal, newValue: number) => void
  getProgressPercentage: (goal: Goal) => number
  getProgressColor: (percentage: number) => string
  getDeadlineStatus: (goal: Goal) => { status: string; color: string; text: string } | null
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
  onProgressUpdate,
  getProgressPercentage,
  getProgressColor,
  getDeadlineStatus,
}: GoalCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [newValue, setNewValue] = useState(goal.currentValue.toString())

  const percentage = getProgressPercentage(goal)
  const deadlineStatus = getDeadlineStatus(goal)

  const handleQuickUpdate = (increment: number) => {
    const updatedValue = goal.currentValue + increment
    onProgressUpdate(goal, updatedValue)
  }

  const handleValueSubmit = () => {
    const value = Number.parseFloat(newValue)
    if (!isNaN(value)) {
      onProgressUpdate(goal, value)
    }
    setIsUpdating(false)
  }

  return (
    <Card className={`transition-all hover:shadow-md ${goal.completed ? "bg-green-50 border-green-200" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {goal.completed && <Award className="h-5 w-5 text-green-600" />}
              {goal.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {goal.category}
              </Badge>
              {deadlineStatus && (
                <Badge variant="outline" className={`text-xs ${deadlineStatus.color}`}>
                  {deadlineStatus.text}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(goal)}>
              Edit
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">
              {goal.currentValue} / {goal.targetValue} {goal.unit}
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="text-xs text-muted-foreground text-right">{percentage.toFixed(1)}% complete</div>
        </div>

        {/* Progress Update Controls */}
        {!goal.completed && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickUpdate(-1)}
                disabled={goal.currentValue <= 0}
              >
                -1
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickUpdate(1)}
                disabled={goal.currentValue >= goal.targetValue}
              >
                +1
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsUpdating(!isUpdating)}>
                Update
              </Button>
            </div>

            {isUpdating && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="flex-1"
                  placeholder="Enter new value"
                />
                <Button size="sm" onClick={handleValueSubmit}>
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsUpdating(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {goal.deadline && (
          <div className="text-xs text-muted-foreground">Deadline: {new Date(goal.deadline).toLocaleDateString()}</div>
        )}
      </CardContent>
    </Card>
  )
}
