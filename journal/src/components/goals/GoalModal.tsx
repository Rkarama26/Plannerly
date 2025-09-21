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
import type { Goal } from "@/lib/types"
import { Trash2 } from "lucide-react"

interface GoalModalProps {
    isOpen: boolean
    onClose: () => void
    goal?: Goal | null
    onSave: (goal: Partial<Goal>) => void
    onDelete?: () => void
}

export function GoalModal({ isOpen, onClose, goal, onSave, onDelete }: GoalModalProps) {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [targetValue, setTargetValue] = useState("")
    const [unit, setUnit] = useState("")
    const [category, setCategory] = useState("")
    const [deadline, setDeadline] = useState("")

    useEffect(() => {
        if (goal) {
            setTitle(goal.title)
            setDescription(goal.description || "")
            setTargetValue(goal.targetValue.toString())
            setUnit(goal.unit)
            setCategory(goal.category)
            setDeadline(goal.deadline ? goal.deadline.split("T")[0] : "")
        } else {
            setTitle("")
            setDescription("")
            setTargetValue("")
            setUnit("")
            setCategory("")
            setDeadline("")
        }
    }, [goal, isOpen])

    const handleSave = () => {
        if (!title.trim() || !targetValue || !unit.trim() || !category.trim()) return

        const goalData: Partial<Goal> = {
            title: title.trim(),
            description: description.trim() || undefined,
            targetValue: Number.parseFloat(targetValue),
            unit: unit.trim(),
            category: category.trim(),
            deadline: deadline ? new Date(deadline).toISOString() : undefined,
        }

        onSave(goalData)
    }

    const commonCategories = [
        "Health & Fitness",
        "Career",
        "Education",
        "Finance",
        "Personal Development",
        "Relationships",
        "Hobbies",
        "Travel",
    ]

    const commonUnits = [
        "times",
        "hours",
        "days",
        "weeks",
        "months",
        "kg",
        "lbs",
        "miles",
        "km",
        "pages",
        "books",
        "courses",
        "dollars",
        "euros",
    ]

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{goal ? "Edit Goal" : "Create Goal"}</DialogTitle>
                    <DialogDescription>
                        {goal ? "Update your goal details and progress tracking" : "Set a new goal to track your progress"}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Goal Title *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Read 12 books this year"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your goal and why it's important to you"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="target">Target Value *</Label>
                            <Input
                                id="target"
                                type="number"
                                value={targetValue}
                                onChange={(e) => setTargetValue(e.target.value)}
                                placeholder="12"
                                min="0"
                                step="0.1"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit">Unit *</Label>
                            <Input
                                id="unit"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                placeholder="books"
                                list="units"
                            />
                            <datalist id="units">
                                {commonUnits.map((u) => (
                                    <option key={u} value={u} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Input
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Health & Fitness"
                            list="categories"
                        />
                        <datalist id="categories">
                            {commonCategories.map((cat) => (
                                <option key={cat} value={cat} />
                            ))}
                        </datalist>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="deadline">Deadline (Optional)</Label>
                        <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                    </div>

                    {goal && (
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="text-sm font-medium mb-2">Current Progress</div>
                            <div className="text-2xl font-bold text-primary">
                                {goal.currentValue} / {goal.targetValue} {goal.unit}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {((goal.currentValue / goal.targetValue) * 100).toFixed(1)}% complete
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between">
                    <div>
                        {goal && onDelete && (
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
                        <Button onClick={handleSave} disabled={!title.trim() || !targetValue || !unit.trim() || !category.trim()}>
                            {goal ? "Update" : "Create Goal"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
