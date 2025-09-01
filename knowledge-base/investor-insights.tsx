"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Wallet, TrendingUp, Coins, PieChart } from "lucide-react"
import { Progress } from "@/components/ui/progress"

const dividendData = [
  { month: "Jan", dividend: 2.5, cumulative: 2.5 },
  { month: "Feb", dividend: 2.8, cumulative: 5.3 },
  { month: "Mar", dividend: 3.2, cumulative: 8.5 },
  { month: "Apr", dividend: 3.6, cumulative: 12.1 },
  { month: "May", dividend: 3.9, cumulative: 16.0 },
  { month: "Jun", dividend: 4.2, cumulative: 20.2 },
]

export function InvestorInsights() {
  const tokenOwnership = 2.5 // percentage
  const totalInvestment = 50000
  const currentValue = 62500
  const totalDividends = 4200
  const monthlyDividend = 4.2

  return (
    <div id="investor" className="space-y-6">
      <h2 className="text-2xl font-bold">Investor Insights</h2>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Ownership</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokenOwnership}%</div>
            <p className="text-xs text-muted-foreground">of total DAO tokens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investment Value</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" /> +
              {(((currentValue - totalInvestment) / totalInvestment) * 100).toFixed(1)}% total return
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Dividend</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlyDividend.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" /> +7.7% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dividends</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalDividends.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">lifetime earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Investment Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Investment Breakdown</CardTitle>
            <CardDescription>Your portfolio composition</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Initial Investment</span>
                <span>${totalInvestment.toLocaleString()}</span>
              </div>
              <Progress value={80} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Capital Appreciation</span>
                <span>${(currentValue - totalInvestment).toLocaleString()}</span>
              </div>
              <Progress value={20} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Dividend Earnings</span>
                <span>${totalDividends.toLocaleString()}</span>
              </div>
              <Progress value={8.4} className="h-2" />
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between font-semibold">
                <span>Total Value</span>
                <span>${(currentValue + totalDividends).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dividend Performance</CardTitle>
            <CardDescription>Monthly dividend payments and cumulative earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                dividend: {
                  label: "Monthly Dividend",
                  color: "hsl(var(--chart-1))",
                },
                cumulative: {
                  label: "Cumulative Dividends",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dividendData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="dividend" stroke="hsl(var(--chart-1))" strokeWidth={3} />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Key investment performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(((currentValue - totalInvestment) / totalInvestment) * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Capital Appreciation</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {((totalDividends / totalInvestment) * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Dividend Yield</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(((currentValue + totalDividends - totalInvestment) / totalInvestment) * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Total Return</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
