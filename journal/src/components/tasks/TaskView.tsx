"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

import { firebaseService } from "@/lib/firebase"
import type { Task } from "@/lib/types"
import { Plus, Filter, Search, MoreVertical } from "lucide-react"

import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/AuthContext"
import { TaskFilters } from "./TaskFilters"
import { TaskModal } from "./TaskModal"

export default function TaskView() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState({
    category: "all",
    priority: "all",
    status: "all",
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (user) {
      loadTasks()
    }
  }, [user])

  useEffect(() => {
    filterTasks()
  }, [tasks, searchQuery, activeFilters])

  const loadTasks = async () => {
    if (!user) return
    const userTasks = await firebaseService.getUserTasks(user.id)
    setTasks(userTasks || [])
  }

  const filterTasks = () => {
    let filtered = [...tasks]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Category filter
    if (activeFilters.category !== "all") {
      filtered = filtered.filter((task) => task.category === activeFilters.category)
    }

    // Priority filter
    if (activeFilters.priority !== "all") {
      filtered = filtered.filter((task) => task.priority === activeFilters.priority)
    }

    // Status filter
    if (activeFilters.status !== "all") {
      if (activeFilters.status === "completed") {
        filtered = filtered.filter((task) => task.completed)
      } else if (activeFilters.status === "pending") {
        filtered = filtered.filter((task) => !task.completed)
      }
    }

    // Sort by priority and creation date
    filtered.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    setFilteredTasks(filtered)
  }

  const handleTaskSave = async (taskData: Partial<Task>) => {
    if (!user) return

    if (selectedTask) {
      // Update existing task
      const updatedTask = { ...selectedTask, ...taskData, updatedAt: new Date().toISOString() }
      await firebaseService.updateTask(selectedTask.id, updatedTask)
    } else {
      // Create new task
      const newTask = {
        ...taskData,
        userId: user.id,
        id: Date.now().toString(),
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await firebaseService.createTask(newTask)
    }

    await loadTasks()
    setIsModalOpen(false)
    setSelectedTask(null)
  }

  const handleTaskDelete = async (taskId: string) => {
    await firebaseService.deleteTask(taskId)
    await loadTasks()
    setIsModalOpen(false)
    setSelectedTask(null)
  }

  const handleTaskToggle = async (task: Task) => {
    const updatedTask = {
      ...task,
      completed: !task.completed,
      updatedAt: new Date().toISOString(),
    }
    await firebaseService.updateTask(task.id, updatedTask)
    await loadTasks()
  }

  const openTaskModal = (task?: Task) => {
    setSelectedTask(task || null)
    setIsModalOpen(true)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "work":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "personal":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "hobbies":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const groupedTasks = {
    high: filteredTasks.filter((task) => task.priority === "high" && !task.completed),
    medium: filteredTasks.filter((task) => task.priority === "medium" && !task.completed),
    low: filteredTasks.filter((task) => task.priority === "low" && !task.completed),
    completed: filteredTasks.filter((task) => task.completed),
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
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
        <Button onClick={() => openTaskModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      {showFilters && <TaskFilters activeFilters={activeFilters} onFiltersChange={setActiveFilters} />}

      {/* Task Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{groupedTasks.high.length}</div>
            <div className="text-sm text-muted-foreground">High Priority</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{groupedTasks.medium.length}</div>
            <div className="text-sm text-muted-foreground">Medium Priority</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{groupedTasks.low.length}</div>
            <div className="text-sm text-muted-foreground">Low Priority</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{groupedTasks.completed.length}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Task Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* High Priority Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              High Priority
              <Badge variant="secondary">{groupedTasks.high.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {groupedTasks.high.length === 0 ? (
              <p className="text-muted-foreground text-sm">No high priority tasks</p>
            ) : (
              groupedTasks.high.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleTaskToggle}
                  onEdit={openTaskModal}
                  onDelete={handleTaskDelete}
                  getPriorityColor={getPriorityColor}
                  getCategoryColor={getCategoryColor}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Medium Priority Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              Medium Priority
              <Badge variant="secondary">{groupedTasks.medium.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {groupedTasks.medium.length === 0 ? (
              <p className="text-muted-foreground text-sm">No medium priority tasks</p>
            ) : (
              groupedTasks.medium.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleTaskToggle}
                  onEdit={openTaskModal}
                  onDelete={handleTaskDelete}
                  getPriorityColor={getPriorityColor}
                  getCategoryColor={getCategoryColor}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Low Priority Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              Low Priority
              <Badge variant="secondary">{groupedTasks.low.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {groupedTasks.low.length === 0 ? (
              <p className="text-muted-foreground text-sm">No low priority tasks</p>
            ) : (
              groupedTasks.low.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleTaskToggle}
                  onEdit={openTaskModal}
                  onDelete={handleTaskDelete}
                  getPriorityColor={getPriorityColor}
                  getCategoryColor={getCategoryColor}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completed Tasks */}
      {groupedTasks.completed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              Completed Tasks
              <Badge variant="secondary">{groupedTasks.completed.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {groupedTasks.completed.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleTaskToggle}
                  onEdit={openTaskModal}
                  onDelete={handleTaskDelete}
                  getPriorityColor={getPriorityColor}
                  getCategoryColor={getCategoryColor}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedTask(null)
        }}
        task={selectedTask}
        onSave={handleTaskSave}
        onDelete={selectedTask ? () => handleTaskDelete(selectedTask.id) : undefined}
      />
    </div>
  )
}

// Task Card Component
interface TaskCardProps {
  task: Task
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  getPriorityColor: (priority: string) => string
  getCategoryColor: (category: string) => string
}

function TaskCard({ task, onToggle, onEdit, onDelete, getPriorityColor, getCategoryColor }: TaskCardProps) {
  return (
    <div
      className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
        task.completed ? "bg-muted/50 opacity-75" : "bg-card"
      }`}
    >
      <div className="flex items-start gap-3">
        <Checkbox checked={task.completed} onCheckedChange={() => onToggle(task)} className="mt-1" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`font-medium text-sm leading-tight ${
                task.completed ? "line-through text-muted-foreground" : ""
              }`}
            >
              {task.title}
            </h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.description && (
            <p className={`text-xs text-muted-foreground mt-1 line-clamp-2 ${task.completed ? "line-through" : ""}`}>
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </Badge>
            <Badge variant="outline" className={`text-xs ${getCategoryColor(task.category)}`}>
              {task.category}
            </Badge>
          </div>

          {task.dueDate && (
            <div className="text-xs text-muted-foreground mt-1">Due: {new Date(task.dueDate).toLocaleDateString()}</div>
          )}
        </div>
      </div>
    </div>
  )
}
