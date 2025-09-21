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
import type { Task } from "@/lib/types"
import { Trash2 } from "lucide-react"

interface TaskModalProps {
    isOpen: boolean
    onClose: () => void
    task?: Task | null
    onSave: (task: Partial<Task>) => void
    onDelete?: () => void
}

export function TaskModal({ isOpen, onClose, task, onSave, onDelete }: TaskModalProps) {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
    const [category, setCategory] = useState<"work" | "personal" | "hobbies">("personal")
    const [dueDate, setDueDate] = useState("")

    useEffect(() => {
        if (task) {
            setTitle(task.title)
            setDescription(task.description || "")
            setPriority(task.priority)
            setCategory(task.category)
            setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "")
        } else {
            setTitle("")
            setDescription("")
            setPriority("medium")
            setCategory("personal")
            setDueDate("")
        }
    }, [task, isOpen])

    const handleSave = () => {
        if (!title.trim()) return

        const taskData: Partial<Task> = {
            title: title.trim(),
            description: description.trim() || undefined,
            priority,
            category,
            dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        }

        onSave(taskData)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
                    <DialogDescription>{task ? "Update your task details" : "Add a new task to your list"}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Task description (optional)"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select value={category} onValueChange={(value: "work" | "personal" | "hobbies") => setCategory(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="work">Work</SelectItem>
                                    <SelectItem value="personal">Personal</SelectItem>
                                    <SelectItem value="hobbies">Hobbies</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="due-date">Due Date (Optional)</Label>
                        <Input id="due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </div>
                </div>

                <DialogFooter className="flex justify-between">
                    <div>
                        {task && onDelete && (
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
                            {task ? "Update" : "Create"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
