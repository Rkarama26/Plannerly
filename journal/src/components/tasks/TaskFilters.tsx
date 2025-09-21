import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TaskFiltersProps {
    activeFilters: {
        category: string
        priority: string
        status: string
    }
    onFiltersChange: (filters: { category: string; priority: string; status: string }) => void
}

export function TaskFilters({ activeFilters, onFiltersChange }: TaskFiltersProps) {
    const handleFilterChange = (key: string, value: string) => {
        onFiltersChange({
            ...activeFilters,
            [key]: value,
        })
    }

    const clearFilters = () => {
        onFiltersChange({
            category: "all",
            priority: "all",
            status: "all",
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
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="work">Work</SelectItem>
                                    <SelectItem value="personal">Personal</SelectItem>
                                    <SelectItem value="hobbies">Hobbies</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Priority</label>
                            <Select value={activeFilters.priority} onValueChange={(value) => handleFilterChange("priority", value)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Priorities</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
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
                                    <SelectItem value="all">All Tasks</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
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
