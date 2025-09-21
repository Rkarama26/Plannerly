import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { MoodEntry } from "@/lib/types"

interface MoodChartProps {
  entries: MoodEntry[]
}

export function MoodChart({ entries }: MoodChartProps) {
  const moodValues = {
    "very-sad": 1,
    sad: 2,
    neutral: 3,
    happy: 4,
    "very-happy": 5,
  }

  const moodLabels = {
    1: "😢",
    2: "😔",
    3: "😐",
    4: "😊",
    5: "😄",
  }

  // Get last 30 days of data
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentEntries = entries
    .filter((entry) => new Date(entry.date) >= thirtyDaysAgo)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const chartData = recentEntries.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    mood: moodValues[entry.mood],
    fullDate: entry.date,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const moodValue = payload[0].value
      const emoji = moodLabels[moodValue as keyof typeof moodLabels]
      const moodText = Object.keys(moodValues).find((key) => moodValues[key as keyof typeof moodValues] === moodValue)

      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm">
            {emoji} {moodText?.replace("-", " ")}
          </p>
        </div>
      )
    }
    return null
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mood Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Log more mood entries to see your trends over time</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mood Trends (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis
              domain={[1, 5]}
              tickFormatter={(value) => moodLabels[value as keyof typeof moodLabels]}
              className="text-xs"
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
