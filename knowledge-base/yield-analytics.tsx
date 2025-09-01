"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Sprout, Target, TrendingUp } from "lucide-react"
import { Progress } from "@/components/ui/progress"

const yieldData = [
  { month: "Jan", actual: 12.5, projected: 12.0, openField: 8.2 },
  { month: "Feb", actual: 13.2, projected: 12.5, openField: 8.5 },
  { month: "Mar", actual: 14.8, projected: 13.0, openField: 9.1 },
  { month: "Apr", actual: 16.5, projected: 14.0, openField: 9.8 },
  { month: "May", actual: 17.8, projected: 15.0, openField: 10.2 },
  { month: "Jun", actual: 19.5, projected: 16.0, openField: 10.8 },
]

const comparisonData = [
  { method: "Open Field", yield: 10.8, efficiency: 45 },
  { method: "Modern Greenhouse", yield: 15.2, efficiency: 75 },
  { method: "Integrated Vertical", yield: 19.5, efficiency: 95 },
]

export function YieldAnalytics() {
  const currentYield = 19.5
  const projectedYield = 16.0
  const performanceRatio = (currentYield / projectedYield) * 100

  return (
    <div id="yield" className="space-y-6">
      <h2 className="text-2xl font-bold">Yield & Crop Analytics</h2>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Yield</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentYield} tons/acre</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" /> +9.6% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">vs. Projection</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceRatio.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" /> Exceeding projections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Gain</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+80.6%</div>
            <p className="text-xs text-muted-foreground">vs. traditional farming</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Yield Performance Tracking</CardTitle>
            <CardDescription>Actual vs projected yield over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                actual: {
                  label: "Actual Yield",
                  color: "hsl(var(--chart-1))",
                },
                projected: {
                  label: "Projected Yield",
                  color: "hsl(var(--chart-2))",
                },
                openField: {
                  label: "Open Field",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yieldData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="actual" stroke="hsl(var(--chart-1))" strokeWidth={3} />
                  <Line
                    type="monotone"
                    dataKey="projected"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Line type="monotone" dataKey="openField" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Farming Method Comparison</CardTitle>
            <CardDescription>Yield comparison across different methods</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                yield: {
                  label: "Yield (tons/acre)",
                  color: "hsl(var(--chart-4))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <XAxis dataKey="method" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="yield" fill="hsl(var(--chart-4))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Efficiency Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Efficiency Metrics</CardTitle>
          <CardDescription>Performance comparison across farming methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comparisonData.map((item) => (
              <div key={item.method} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{item.method}</span>
                  <span>
                    {item.yield} tons/acre ({item.efficiency}% efficiency)
                  </span>
                </div>
                <Progress value={item.efficiency} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
