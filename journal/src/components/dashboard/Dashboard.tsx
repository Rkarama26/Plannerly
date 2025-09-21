import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, CheckCircle, Target, BookOpen, TrendingUp, Flame, Clock, Plus, ArrowRight } from "lucide-react"
import { format, isToday, isTomorrow, addDays, startOfWeek, endOfWeek } from "date-fns"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { useAuth } from "@/context/AuthContext"
import { firebaseService } from "@/lib/firebase"
import { useNavigate } from "react-router"

interface DashboardStats {
    tasksCompleted: number
    totalTasks: number
    upcomingEvents: number
    journalEntries: number
    goalsProgress: number
    currentStreak: number
    weeklyMood: number[]
}

export function Dashboard() {
    const { user } = useAuth()
    const [stats, setStats] = useState<DashboardStats>({
        tasksCompleted: 0,
        totalTasks: 0,
        upcomingEvents: 0,
        journalEntries: 0,
        goalsProgress: 0,
        currentStreak: 0,
        weeklyMood: [],
    })

    console.log("User:", user)
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
    const [recentTasks, setRecentTasks] = useState<any[]>([])
    const [activeGoals, setActiveGoals] = useState<any[]>([])
    const navigate = useNavigate()
    const handleNavigate = (path: string) => {
        navigate(`/${path}`)
    }


    useEffect(() => {
        if (user) {
            loadDashboardData()
        }
    }, [user])

    const loadDashboardData = async () => {
        try {
            // Load data from localStorage (simulating Firebase data)
            const tasks = await firebaseService.getUserTasks(user?.id || "")
            //  console.log("Loaded tasks:", tasks)
            const events = await firebaseService.getUserEvents(user?.id || "")
            console.log("Loaded events:", events)
            const journals = await firebaseService.getUserJournalEntries(user?.id || "")
            // console.log("Loaded journals:", journals)
            const goals = await firebaseService.getUserGoals(user?.id || "")
            // console.log("Loaded goals:", goals)
            const habits = await firebaseService.getUserHabits(user?.id || "")
            // console.log("Loaded habits:", habits)
            const moods = await firebaseService.getUserMoodEntries(user?.id || "")
            // console.log("Loaded moods:", moods)

            // Calculate stats
            const completedTasks = tasks.filter((task: any) => task.completed).length
            const today = new Date()
            // normalize to midnight
            today.setHours(0, 0, 0, 0)
            const weekStart = startOfWeek(today)
            const weekEnd = endOfWeek(today)

            const upcomingEventsCount = events.filter((event: any) => {
                const eventDate = new Date(event.startDate)
                return eventDate >= today && eventDate <= addDays(today, 7)
            }).length

            const thisWeekJournals = journals.filter((journal: any) => {
                const journalDate = new Date(journal.date)
                return journalDate >= weekStart && journalDate <= weekEnd
            }).length

            const activeGoalsProgress =
                goals.length > 0
                    ? goals.reduce((acc: number, goal: any) => acc + (goal.currentValue / goal.targetValue) * 100, 0) /
                    goals.length
                    : 0

            // Calculate habit streak
            const sortedHabits = habits.sort(
                (a: any, b: any) => new Date(b.lastCompleted).getTime() - new Date(a.lastCompleted).getTime(),
            )
            const currentStreak = sortedHabits.length > 0 ? sortedHabits[0].streak || 0 : 0

            // Get weekly mood data
            const weeklyMoodData = []
            for (let i = 6; i >= 0; i--) {
                const date = addDays(today, -i)
                const dayMood = moods.find(
                    (mood: any) => format(new Date(mood.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd"),
                )
                weeklyMoodData.push(dayMood ? dayMood.rating : 3)
            }

            setStats({
                tasksCompleted: completedTasks,
                totalTasks: tasks.length,
                upcomingEvents: upcomingEventsCount,
                journalEntries: thisWeekJournals,
                goalsProgress: activeGoalsProgress,
                currentStreak,
                weeklyMood: weeklyMoodData,
            })

            // Set upcoming events
            const nextEvents = events
                .filter((event: any) => new Date(event.endDate) >= today) // ✅ include ongoing & future
                .sort(
                    (a: any, b: any) =>
                        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                )
                .slice(0, 3)
            setUpcomingEvents(nextEvents)
            console.log("Upcoming events set:", nextEvents)

            // Set recent tasks
            const recentTasksList = tasks
                .filter((task: any) => !task.completed)
                .sort((a: any, b: any) => {
                    if (a.priority === "high" && b.priority !== "high") return -1
                    if (b.priority === "high" && a.priority !== "high") return 1
                    return new Date(a.dueDate || "9999-12-31").getTime() - new Date(b.dueDate || "9999-12-31").getTime()
                })
                .slice(0, 4)
            setRecentTasks(recentTasksList)

            // Set active goals
            const activeGoalsList = goals
                .filter((goal: any) => goal.currentValue < goal.targetValue)
                .sort((a: any, b: any) => {
                    const aProgress = (a.currentValue / a.targetValue) * 100
                    const bProgress = (b.currentValue / b.targetValue) * 100
                    return bProgress - aProgress
                })
                .slice(0, 3)
            setActiveGoals(activeGoalsList)
        } catch (error) {
            console.error("Error loading dashboard data:", error)
        }
    }

    const moodChartData = stats.weeklyMood.map((mood, index) => ({
        day: format(addDays(new Date(), -6 + index), "EEE"),
        mood,
    }))

    const getEventDateLabel = (date: string) => {
        const eventDate = new Date(date)
        if (isToday(eventDate)) return "Today"
        if (isTomorrow(eventDate)) return "Tomorrow"
        return format(eventDate, "MMM d")
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            case "medium":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            case "low":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
        }
    }

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg border border-border">
                <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.email?.split("@")[0]}!</h1>
                <p className="text-muted-foreground">Here's your productivity overview for today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.tasksCompleted}</div>
                        <p className="text-xs text-muted-foreground">of {stats.totalTasks} total tasks</p>
                        <Progress
                            value={stats.totalTasks > 0 ? (stats.tasksCompleted / stats.totalTasks) * 100 : 0}
                            className="mt-2"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
                        <p className="text-xs text-muted-foreground">in the next 7 days</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Journal Entries</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.journalEntries}</div>
                        <p className="text-xs text-muted-foreground">this week</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                        <Flame className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.currentStreak}</div>
                        <p className="text-xs text-muted-foreground">days in a row</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Mood Trend Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Weekly Mood Trend
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={moodChartData}>
                                    <XAxis dataKey="day" />
                                    <YAxis domain={[1, 5]} />
                                    <Line
                                        type="monotone"
                                        dataKey="mood"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        dot={{ fill: "hsl(var(--primary))" }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Recent Tasks */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5" />
                                Priority Tasks
                            </CardTitle>
                            <Button variant="ghost" size="sm"
                                onClick={() => handleNavigate("tasks")}>
                                View All <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recentTasks.length > 0 ? (
                                    recentTasks.map((task) => (
                                        <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-medium">{task.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="secondary" className={getPriorityColor(task.priority)}>
                                                        {task.priority}
                                                    </Badge>
                                                    {task.dueDate && (
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {format(new Date(task.dueDate), "MMM d")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">No pending tasks</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Upcoming Events */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Upcoming Events
                            </CardTitle>
                            <Button variant="ghost" size="sm"
                                onClick={() => handleNavigate("calendar")}>
                                View All <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {upcomingEvents.length > 0 ? (
                                    upcomingEvents.map((event) => (
                                        <div key={event.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{event.title}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {getEventDateLabel(event.startDate)}
                                                    {event.time && ` at ${event.time}`}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">No upcoming events</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Active Goals */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Active Goals
                            </CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => handleNavigate("goals")}>
                                View All <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {activeGoals.length > 0 ? (
                                    activeGoals.map((goal) => {
                                        const progress = (goal.currentValue / goal.targetValue) * 100
                                        return (
                                            <div key={goal.id} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium text-sm">{goal.title}</p>
                                                    <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                                                </div>
                                                <Progress value={progress} className="h-2" />
                                                <p className="text-xs text-muted-foreground">
                                                    {goal.currentValue} / {goal.targetValue} {goal.unit}
                                                </p>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">No active goals</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col gap-1 bg-transparent"
                                    onClick={() => handleNavigate("tasks")}>
                                    <Plus className="h-4 w-4" />
                                    <span className="text-xs">Add Task</span>
                                </Button>
                                <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col gap-1 bg-transparent"
                                    onClick={() => handleNavigate("calendar")}>
                                    <Calendar className="h-4 w-4" />
                                    <span className="text-xs">New Event</span>
                                </Button>
                                <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col gap-1 bg-transparent"
                                    onClick={() => handleNavigate("journal")}>
                                    <BookOpen className="h-4 w-4" />
                                    <span className="text-xs">Write Journal</span>
                                </Button>
                                <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col gap-1 bg-transparent"
                                    onClick={() => handleNavigate("goals")}>
                                    <Target className="h-4 w-4" />
                                    <span className="text-xs">Set Goal</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
