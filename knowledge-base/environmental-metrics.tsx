"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Leaf, Droplets, Zap, TreePine } from "lucide-react"
import { Progress } from "@/components/ui/progress"

const environmentalData = [
  { month: "Jan", carbon: 125, water: 85, energy: 95 },
  { month: "Feb", carbon: 132, water: 88, energy: 98 },
  { month: "Mar", carbon: 148, water: 92, energy: 102 },
  { month: "Apr", carbon: 165, water: 95, energy: 105 },
  { month: "May", carbon: 178, water: 98, energy: 108 },
  { month: "Jun", carbon: 195, water: 102, energy: 112 },
]

export function EnvironmentalMetrics() {
  return (
    <div id="environmental" className="space-y-6">
      <h2 className="text-2xl font-bold">Environmental & Sustainability Metrics</h2>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carbon Sequestered</CardTitle>
            <TreePine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">195 tons</div>
            <p className="text-xs text-muted-foreground">+12.3% this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Water Savings</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65%</div>
            <p className="text-xs text-muted-foreground">vs. open-field farming</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renewable Energy</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">of total energy usage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sustainability Score</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">9.2/10</div>
            <p className="text-xs text-muted-foreground">ESG rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Environmental Impact Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Environmental Impact Over Time</CardTitle>
          <CardDescription>Carbon sequestration, water savings, and renewable energy production</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              carbon: {
                label: "Carbon Sequestered (tons)",
                color: "hsl(var(--chart-1))",
              },
              water: {
                label: "Water Saved (thousands of gallons)",
                color: "hsl(var(--chart-2))",
              },
              energy: {
                label: "Renewable Energy (MWh)",
                color: "hsl(var(--chart-3))",
              },
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={environmentalData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="carbon"
                  stackId="1"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="water"
                  stackId="2"
                  stroke="hsl(var(--chart-2))"
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="energy"
                  stackId="3"
                  stroke="hsl(var(--chart-3))"
                  fill="hsl(var(--chart-3))"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Sustainability Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Energy Sources</CardTitle>
            <CardDescription>Renewable energy breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Solar Power</span>
                <span>45%</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Waste-to-Energy</span>
                <span>25%</span>
              </div>
              <Progress value={25} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Geothermal</span>
                <span>17%</span>
              </div>
              <Progress value={17} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Grid (Non-renewable)</span>
                <span>13%</span>
              </div>
              <Progress value={13} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Impact Metrics</CardTitle>
            <CardDescription>Environmental benefits vs. traditional farming</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Water Usage Reduction</span>
              </div>
              <span className="text-lg font-semibold text-green-600">-65%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TreePine className="h-4 w-4 text-green-500" />
                <span className="text-sm">Carbon Footprint</span>
              </div>
              <span className="text-lg font-semibold text-green-600">-78%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Leaf className="h-4 w-4 text-emerald-500" />
                <span className="text-sm">Pesticide Usage</span>
              </div>
              <span className="text-lg font-semibold text-green-600">-95%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Energy Efficiency</span>
              </div>
              <span className="text-lg font-semibold text-green-600">+120%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
