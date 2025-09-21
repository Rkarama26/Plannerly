import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface GoalFiltersProps {
  activeFilters: {
    category: string
    status: string
    deadline: string
  }
  onFiltersChange: (filters: { category: string; status: string; deadline: string }) => void
  availableCategories: string[]
}

export function GoalFilters({ activeFilters, onFiltersChange, availableCategories }: GoalFiltersProps) {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...activeFilters,
      [key]: value,
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      category: "all",
      status: "all",
      deadline: "all",
    })
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={activeFilters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={activeFilters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Goals</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="not-started">Not Started</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Deadline</label>
              <Select value={activeFilters.deadline} onValueChange={(value) => handleFilterChange("deadline", value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Deadlines</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="future">Future</SelectItem>
                  <SelectItem value="no-deadline">No Deadline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
