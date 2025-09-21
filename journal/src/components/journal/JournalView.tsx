"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { firebaseService } from "@/lib/firebase"
import type { JournalEntry } from "@/lib/types"
import { Plus, Search, Filter, BookOpen } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { JournalFilters } from "./JournalFilter"
import { JournalModal } from "./JournalModal"

export function JournalView() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedMood, setSelectedMood] = useState("all")
  const [selectedTag, setSelectedTag] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (user) {
      loadEntries()
    }
  }, [user])

  useEffect(() => {
    filterEntries()
  }, [entries, searchQuery, selectedDate, selectedMood, selectedTag])

  const loadEntries = async () => {
    if (!user) return
    const userEntries = await firebaseService.getUserJournalEntries(user.id)
    setEntries(userEntries || [])
  }

  const filterEntries = () => {
    let filtered = [...entries]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (entry) =>
          entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Date filter
    if (selectedDate) {
      filtered = filtered.filter((entry) => entry.date.startsWith(selectedDate))
    }

    // Mood filter
    if (selectedMood !== "all") {
      filtered = filtered.filter((entry) => entry.mood === selectedMood)
    }

    // Tag filter
    if (selectedTag) {
      filtered = filtered.filter((entry) =>
        entry.tags.some((tag) => tag.toLowerCase().includes(selectedTag.toLowerCase())),
      )
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setFilteredEntries(filtered)
  }

  const handleEntrySave = async (entryData: Partial<JournalEntry>) => {
    if (!user) return

    if (selectedEntry) {
      // Update existing entry
      const updatedEntry = { ...selectedEntry, ...entryData, updatedAt: new Date().toISOString() }
      await firebaseService.put(`journal-entries/${selectedEntry.id}`, updatedEntry)
    } else {
      // Create new entry
      const newEntry = {
        ...entryData,
        userId: user.id,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await firebaseService.createJournalEntry(newEntry)
    }

    await loadEntries()
    setIsModalOpen(false)
    setSelectedEntry(null)
  }

  const handleEntryDelete = async (entryId: string) => {
    await firebaseService.delete(`journal-entries/${entryId}`)
    await loadEntries()
    setIsModalOpen(false)
    setSelectedEntry(null)
  }

  const openEntryModal = (entry?: JournalEntry) => {
    setSelectedEntry(entry || null)
    setIsModalOpen(true)
  }

  const getMoodEmoji = (mood?: string) => {
    switch (mood) {
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
        return "📝"
    }
  }

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case "very-happy":
        return "bg-green-100 text-green-800 border-green-200"
      case "happy":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "neutral":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "sad":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "very-sad":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-purple-100 text-purple-800 border-purple-200"
    }
  }

  const getAllTags = () => {
    const allTags = entries.flatMap((entry) => entry.tags)
    return [...new Set(allTags)].sort()
  }

  const getEntriesThisWeek = () => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    return entries.filter((entry) => new Date(entry.date) >= oneWeekAgo).length
  }

  const getEntriesThisMonth = () => {
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    return entries.filter((entry) => new Date(entry.date) >= oneMonthAgo).length
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entries..."
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
        <Button onClick={() => openEntryModal()}>
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <JournalFilters
          selectedDate={selectedDate}
          selectedMood={selectedMood}
          selectedTag={selectedTag}
          availableTags={getAllTags()}
          onDateChange={setSelectedDate}
          onMoodChange={setSelectedMood}
          onTagChange={setSelectedTag}
          onClearFilters={() => {
            setSelectedDate("")
            setSelectedMood("all")
            setSelectedTag("")
          }}
        />
      )}

      {/* Journal Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{entries.length}</div>
            <div className="text-sm text-muted-foreground">Total Entries</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{getEntriesThisWeek()}</div>
            <div className="text-sm text-muted-foreground">This Week</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{getEntriesThisMonth()}</div>
            <div className="text-sm text-muted-foreground">This Month</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{getAllTags().length}</div>
            <div className="text-sm text-muted-foreground">Unique Tags</div>
          </CardContent>
        </Card>
      </div>

      {/* Journal Entries */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No journal entries found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedDate || selectedMood !== "all" || selectedTag
                  ? "Try adjusting your filters or search terms"
                  : "Start writing your first journal entry to capture your thoughts and experiences"}
              </p>
              {!searchQuery && !selectedDate && selectedMood === "all" && !selectedTag && (
                <Button onClick={() => openEntryModal()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Write First Entry
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntries.map((entry) => (
              <Card key={entry.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getMoodEmoji(entry.mood)}</span>
                      <div>
                        <CardTitle className="text-lg line-clamp-1">{entry.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    {entry.mood && (
                      <Badge variant="outline" className={`text-xs ${getMoodColor(entry.mood)}`}>
                        {entry.mood.replace("-", " ")}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0" onClick={() => openEntryModal(entry)}>
                  <div
                    className="text-sm text-muted-foreground line-clamp-3 mb-3"
                    dangerouslySetInnerHTML={{
                      __html: entry.content.replace(/<[^>]*>/g, "").substring(0, 150) + "...",
                    }}
                  />
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                      {entry.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{entry.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Journal Entry Modal */}
      <JournalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedEntry(null)
        }}
        entry={selectedEntry}
        onSave={handleEntrySave}
        onDelete={selectedEntry ? () => handleEntryDelete(selectedEntry.id) : undefined}
      />
    </div>
  )
}
