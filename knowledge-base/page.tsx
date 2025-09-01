import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, DollarSign, Leaf, Droplets, Zap, Users, Clock } from "lucide-react"

export default function Dashboard() {
  const revenueData = [
    { month: "Jan", revenue: 125000, costs: 85000, profit: 40000 },
    { month: "Feb", revenue: 132000, costs: 88000, profit: 44000 },
    { month: "Mar", revenue: 148000, costs: 92000, profit: 56000 },
    { month: "Apr", revenue: 165000, costs: 95000, profit: 70000 },
    { month: "May", revenue: 178000, costs: 98000, profit: 80000 },
    { month: "Jun", revenue: 195000, costs: 102000, profit: 93000 },
  ]

  const yieldData = [
    { crop: "Tomatoes", traditional: 8, current: 248, improvement: 3000 },
    { crop: "Leafy Greens", traditional: 6, current: 222, improvement: 3600 },
    { crop: "Strawberries", traditional: 5, current: 165, improvement: 3200 },
    { crop: "Herbs", traditional: 4, current: 128, improvement: 3100 },
  ]

  const environmentalData = [
    { month: "Jan", carbon: 125, water: 85, energy: 95 },
    { month: "Feb", carbon: 132, water: 88, energy: 98 },
    { month: "Mar", carbon: 148, water: 92, energy: 102 },
    { month: "Apr", carbon: 165, water: 95, energy: 105 },
    { month: "May", carbon: 178, water: 98, energy: 108 },
    { month: "Jun", carbon: 195, water: 102, energy: 112 },
  ]

  const proposals = [
    {
      id: 1,
      title: "Expand Vertical Farming Operations",
      status: "active",
      votesFor: 1250,
      votesAgainst: 320,
      endDate: "2024-02-15",
    },
    {
      id: 2,
      title: "Implement AI-Driven Crop Monitoring",
      status: "active",
      votesFor: 980,
      votesAgainst: 180,
      endDate: "2024-02-20",
    },
  ]

  const currentRevenue = 195000
  const currentCosts = 102000
  const ebitda = currentRevenue - currentCosts
  const tokenOwnership = 2.5
  const monthlyDividend = 4200

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">DAO-REIT Investor Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time insights for agricultural investments</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live Data</span>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentRevenue.toLocaleString()}</div>
            <p className="text-xs text-gray-600">
              <TrendingUp className="inline h-3 w-3 text-green-500" /> +12.3% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EBITDA</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${ebitda.toLocaleString()}</div>
            <p className="text-xs text-gray-600">
              <TrendingUp className="inline h-3 w-3 text-green-500" /> +18.7% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Ownership</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokenOwnership}%</div>
            <p className="text-xs text-gray-600">of total DAO tokens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Dividend</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlyDividend.toLocaleString()}</div>
            <p className="text-xs text-gray-600">
              <TrendingUp className="inline h-3 w-3 text-green-500" /> +7.7% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Enhanced Financial Overview */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stackId="1" stroke="#4caf50" fill="#4caf50" fillOpacity={0.6} />
                <Area type="monotone" dataKey="costs" stackId="2" stroke="#f44336" fill="#f44336" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Enhanced Yield Improvement */}
        <Card>
          <CardHeader>
            <CardTitle>Yield Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {yieldData.map((crop) => (
                <div key={crop.crop} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{crop.crop}</span>
                    <span className="text-green-600 font-semibold">+{crop.improvement}%</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {crop.traditional} → {crop.current} tons/acre
                  </div>
                  <Progress value={Math.min(crop.improvement / 40, 100)} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Environmental and Sustainability */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Sustainability Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Water Saved</span>
                </div>
                <span className="text-lg font-semibold text-green-600">70%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Leaf className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Carbon Sequestered</span>
                </div>
                <span className="text-lg font-semibold">1,200 tons/yr</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Renewable Energy</span>
                </div>
                <span className="text-lg font-semibold text-green-600">95%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environmental Impact Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={environmentalData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="carbon" stroke="#4caf50" strokeWidth={2} />
                <Line type="monotone" dataKey="water" stroke="#2196f3" strokeWidth={2} />
                <Line type="monotone" dataKey="energy" stroke="#ff9800" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced DAO Governance */}
      <Card>
        <CardHeader>
          <CardTitle>DAO Governance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button className="mr-4">Vote on Proposals</Button>
              <Button variant="secondary">View Past Votes</Button>
              <Button variant="outline">Submit Proposal</Button>
            </div>

            {/* Active Proposals */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Active Proposals</h3>
              {proposals.map((proposal) => (
                <div key={proposal.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{proposal.title}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                        <span className="text-xs text-gray-600">
                          Ends: {new Date(proposal.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="text-green-600 border-green-600 bg-transparent">
                        Vote For
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-600 bg-transparent">
                        Vote Against
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>For: {proposal.votesFor} votes</span>
                      <span>Against: {proposal.votesAgainst} votes</span>
                    </div>
                    <Progress
                      value={(proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100}
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Governance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold">250</div>
                <p className="text-sm text-gray-600">Your Voting Power</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">2,847</div>
                <p className="text-sm text-gray-600">Total Members</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">73.2%</div>
                <p className="text-sm text-gray-600">Participation Rate</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
