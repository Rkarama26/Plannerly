import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface JournalFiltersProps {
  selectedDate: string
  selectedMood: string
  selectedTag: string
  availableTags: string[]
  onDateChange: (date: string) => void
  onMoodChange: (mood: string) => void
  onTagChange: (tag: string) => void
  onClearFilters: () => void
}

export function JournalFilters({
  selectedDate,
  selectedMood,
  selectedTag,
  availableTags,
  onDateChange,
  onMoodChange,
  onTagChange,
  onClearFilters,
}: JournalFiltersProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-[160px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mood</label>
              <Select value={selectedMood} onValueChange={onMoodChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Moods</SelectItem>
                  <SelectItem value="very-happy">😄 Very Happy</SelectItem>
                  <SelectItem value="happy">😊 Happy</SelectItem>
                  <SelectItem value="neutral">😐 Neutral</SelectItem>
                  <SelectItem value="sad">😔 Sad</SelectItem>
                  <SelectItem value="very-sad">😢 Very Sad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tag</label>
              <Input
                placeholder="Filter by tag..."
                value={selectedTag}
                onChange={(e) => onTagChange(e.target.value)}
                className="w-[160px]"
              />
            </div>
          </div>

          <Button variant="outline" onClick={onClearFilters}>
            Clear Filters
          </Button>
        </div>

        {availableTags.length > 0 && (
          <div className="mt-4">
            <label className="text-sm font-medium mb-2 block">Popular Tags</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.slice(0, 8).map((tag) => (
                <Button key={tag} variant="outline" size="sm" onClick={() => onTagChange(tag)} className="h-7 text-xs">
                  #{tag}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
