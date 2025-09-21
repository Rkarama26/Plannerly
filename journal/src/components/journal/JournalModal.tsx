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
import type { JournalEntry } from "@/lib/types"
import { Trash2, Bold, Italic, List, Quote } from "lucide-react"

interface JournalEntryModalProps {
    isOpen: boolean
    onClose: () => void
    entry?: JournalEntry | null
    onSave: (entry: Partial<JournalEntry>) => void
    onDelete?: () => void
}

export function JournalModal({ isOpen, onClose, entry, onSave, onDelete }: JournalEntryModalProps) {
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [mood, setMood] = useState<"very-happy" | "happy" | "neutral" | "sad" | "very-sad" | undefined>(undefined)
    const [tags, setTags] = useState("")
    const [date, setDate] = useState("")

    useEffect(() => {
        if (entry) {
            setTitle(entry.title)
            setContent(entry.content)
            setMood(entry.mood)
            setTags(entry.tags.join(", "))
            setDate(entry.date.split("T")[0])
        } else {
            setTitle("")
            setContent("")
            setMood(undefined)
            setTags("")
            setDate(new Date().toISOString().split("T")[0])
        }
    }, [entry, isOpen])

    const handleSave = () => {
        if (!title.trim() || !content.trim()) return

        const entryData: Partial<JournalEntry> = {
            title: title.trim(),
            content: content.trim(),
            mood,
            tags: tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0),
            date: new Date(date).toISOString(),
        }

        onSave(entryData)
    }

    const insertFormatting = (format: string) => {
        const textarea = document.getElementById("content") as HTMLTextAreaElement
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selectedText = content.substring(start, end)

        let formattedText = ""
        switch (format) {
            case "bold":
                formattedText = `**${selectedText || "bold text"}**`
                break
            case "italic":
                formattedText = `*${selectedText || "italic text"}*`
                break
            case "list":
                formattedText = `\n- ${selectedText || "list item"}`
                break
            case "quote":
                formattedText = `\n> ${selectedText || "quote"}`
                break
        }

        const newContent = content.substring(0, start) + formattedText + content.substring(end)
        setContent(newContent)

        // Focus back to textarea
        setTimeout(() => {
            textarea.focus()
            const newPosition = start + formattedText.length
            textarea.setSelectionRange(newPosition, newPosition)
        }, 0)
    }

    const getMoodEmoji = (moodValue?: string) => {
        switch (moodValue) {
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
                return ""
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{entry ? "Edit Journal Entry" : "New Journal Entry"}</DialogTitle>
                    <DialogDescription>
                        {entry ? "Update your journal entry" : "Capture your thoughts and experiences"}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Entry title" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="mood">Mood (Optional)</Label>
                            <Select value={mood || "none"} onValueChange={(value: any) => setMood(value || undefined)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select mood">
                                        {mood && (
                                            <span className="flex items-center gap-2">
                                                {getMoodEmoji(mood)} {mood.replace("-", " ")}
                                            </span>
                                        )}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No mood</SelectItem>
                                    <SelectItem value="very-happy">😄 Very Happy</SelectItem>
                                    <SelectItem value="happy">😊 Happy</SelectItem>
                                    <SelectItem value="neutral">😐 Neutral</SelectItem>
                                    <SelectItem value="sad">😔 Sad</SelectItem>
                                    <SelectItem value="very-sad">😢 Very Sad</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags (Optional)</Label>
                            <Input
                                id="tags"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="work, personal, travel (comma separated)"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content">Content *</Label>

                        {/* Rich Text Toolbar */}
                        <div className="flex items-center gap-2 p-2 border border-border rounded-t-md bg-muted/50">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => insertFormatting("bold")}
                                className="h-8 w-8 p-0"
                            >
                                <Bold className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => insertFormatting("italic")}
                                className="h-8 w-8 p-0"
                            >
                                <Italic className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => insertFormatting("list")}
                                className="h-8 w-8 p-0"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => insertFormatting("quote")}
                                className="h-8 w-8 p-0"
                            >
                                <Quote className="h-4 w-4" />
                            </Button>
                            <div className="text-xs text-muted-foreground ml-auto">Markdown supported</div>
                        </div>

                        <Textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your journal entry here... You can use **bold**, *italic*, lists, and > quotes"
                            rows={12}
                            className="rounded-t-none border-t-0 resize-none"
                        />
                    </div>

                    {/* Preview */}
                    {content && (
                        <div className="space-y-2">
                            <Label>Preview</Label>
                            <div className="p-4 border border-border rounded-md bg-muted/20 max-h-40 overflow-y-auto">
                                <div
                                    className="prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{
                                        __html: content
                                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                            .replace(/\*(.*?)\*/g, "<em>$1</em>")
                                            .replace(/^- (.+)$/gm, "<li>$1</li>")
                                            .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
                                            .replace(/\n/g, "<br>"),
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between">
                    <div>
                        {entry && onDelete && (
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
                        <Button onClick={handleSave} disabled={!title.trim() || !content.trim()}>
                            {entry ? "Update" : "Save Entry"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
