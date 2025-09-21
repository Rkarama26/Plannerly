const FIREBASE_BASE_URL = "https://auth-d2bdd-default-rtdb.firebaseio.com"

export class FirebaseService {
    private baseUrl: string

    constructor(baseUrl: string = FIREBASE_BASE_URL) {
        this.baseUrl = baseUrl
    }

    // Generic CRUD operations
    async get<T>(path: string): Promise<T | null> {
        try {
            const response = await fetch(`${this.baseUrl}/${path}.json`)
            if (!response.ok) throw new Error("Failed to fetch data")
            return await response.json()
        } catch (error) {
            console.error("Firebase GET error:", error)
            return null
        }
    }

    async post<T>(path: string, data: T): Promise<{ name: string } | null> {
        try {
            const response = await fetch(`${this.baseUrl}/${path}.json`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })
            if (!response.ok) throw new Error("Failed to post data")
            return await response.json()
        } catch (error) {
            console.error("Firebase POST error:", error)
            return null
        }
    }

    async put<T>(path: string, data: T): Promise<T | null> {
        try {
            const response = await fetch(`${this.baseUrl}/${path}.json`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })
            if (!response.ok) throw new Error("Failed to update data")
            return await response.json()
        } catch (error) {
            console.error("Firebase PUT error:", error)
            return null
        }
    }
    async delete(path: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/${path}.json`, {
                method: "DELETE",
            })
            return response.ok
        } catch (error) {
            console.error("Firebase DELETE error:", error)
            return false
        }
    }
    // User-specific operations
    async getUsers() {
        return this.get("users")
    }

    async createUser(user: any) {
        return this.post("users", user)
    }

    async getUserTasks(userId: string) {
        const tasks = await this.get("tasks")
        if (!tasks) return []
        return Object.entries(tasks)
            .filter(([_, task]: [string, any]) => task.userId === userId)
            .map(([id, task]) => ({ id, ...task }))
    }

    async createTask(task: any) {
        return this.post("tasks", task)
    }

    async updateTask(taskId: string, task: any) {
        return this.put(`tasks/${taskId}`, task)
    }

    async deleteTask(taskId: string) {
        return this.delete(`tasks/${taskId}`)

    }


    // Similar methods for events, journal entries, goals, habits, and moods
    async getUserEvents(userId: string) {
        const events = await this.get("events")
        if (!events) return []
        return Object.entries(events)
            .filter(([_, event]: [string, any]) => event.userId === userId)
            .map(([id, event]) => ({ id, ...event }))
    }

    async createEvent(event: any) {
        return this.post("events", event)
    }

    async getUserJournalEntries(userId: string) {
        const entries = await this.get("journal-entries")
        if (!entries) return []
        return Object.entries(entries)
            .filter(([_, entry]: [string, any]) => entry.userId === userId)
            .map(([id, entry]) => ({ id, ...entry }))
    }

    async createJournalEntry(entry: any) {
        return this.post("journal-entries", entry)
    }

    async getUserGoals(userId: string) {
        const goals = await this.get("goals")
        if (!goals) return []
        return Object.entries(goals)
            .filter(([_, goal]: [string, any]) => goal.userId === userId)
            .map(([id, goal]) => ({ id, ...goal }))
    }

    async createGoal(goal: any) {
        return this.post("goals", goal)
    }

    async getUserHabits(userId: string) {
        const habits = await this.get("habits")
        if (!habits) return []
        return Object.entries(habits)
            .filter(([_, habit]: [string, any]) => habit.userId === userId)
            .map(([id, habit]) => ({ id, ...habit }))
    }

    async createHabit(habit: any) {
        return this.post("habits", habit)
    }

    async getUserMoodEntries(userId: string) {
        const moods = await this.get("mood-entries")
        if (!moods) return []
        return Object.entries(moods)
            .filter(([_, mood]: [string, any]) => mood.userId === userId)
            .map(([id, mood]) => ({ id, ...mood }))
    }

    async createMoodEntry(mood: any) {
        return this.post("mood-entries", mood)
    }

}

export const firebaseService = new FirebaseService()
