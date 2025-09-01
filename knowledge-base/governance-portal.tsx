"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Vote, Users, CheckCircle, Clock, XCircle } from "lucide-react"

const proposals = [
  {
    id: 1,
    title: "Expand Vertical Farming Operations",
    description: "Proposal to invest $2M in additional vertical farming infrastructure",
    status: "active",
    votesFor: 1250,
    votesAgainst: 320,
    totalVotes: 1570,
    endDate: "2024-02-15",
    category: "Investment",
  },
  {
    id: 2,
    title: "Implement AI-Driven Crop Monitoring",
    description: "Integration of Cuttlefish AI for predictive crop analytics",
    status: "active",
    votesFor: 980,
    votesAgainst: 180,
    totalVotes: 1160,
    endDate: "2024-02-20",
    category: "Technology",
  },
  {
    id: 3,
    title: "Quarterly Dividend Distribution",
    description: "Approve Q1 2024 dividend distribution of $0.15 per token",
    status: "passed",
    votesFor: 2100,
    votesAgainst: 150,
    totalVotes: 2250,
    endDate: "2024-01-30",
    category: "Financial",
  },
  {
    id: 4,
    title: "Partnership with Local Food Banks",
    description: "Donate 5% of surplus produce to local food banks",
    status: "failed",
    votesFor: 450,
    votesAgainst: 890,
    totalVotes: 1340,
    endDate: "2024-01-25",
    category: "Social Impact",
  },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return <Clock className="h-4 w-4" />
    case "passed":
      return <CheckCircle className="h-4 w-4" />
    case "failed":
      return <XCircle className="h-4 w-4" />
    default:
      return <Vote className="h-4 w-4" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-blue-500"
    case "passed":
      return "bg-green-500"
    case "failed":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

export function GovernancePortal() {
  const totalTokens = 10000
  const activeProposals = proposals.filter((p) => p.status === "active").length
  const userVotingPower = 250 // user's tokens

  return (
    <div id="governance" className="space-y-6">
      <h2 className="text-2xl font-bold">DAO Governance Portal</h2>

      {/* Governance Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Voting Power</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userVotingPower}</div>
            <p className="text-xs text-muted-foreground">
              {((userVotingPower / totalTokens) * 100).toFixed(1)}% of total votes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProposals}</div>
            <p className="text-xs text-muted-foreground">requiring your vote</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">DAO token holders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participation Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">73.2%</div>
            <p className="text-xs text-muted-foreground">average voting participation</p>
          </CardContent>
        </Card>
      </div>

      {/* Proposals */}
      <Card>
        <CardHeader>
          <CardTitle>Governance Proposals</CardTitle>
          <CardDescription>Vote on important decisions affecting the DAO</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {proposals.map((proposal) => (
              <div key={proposal.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{proposal.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {proposal.category}
                      </Badge>
                      <Badge variant="outline" className={`text-xs text-white ${getStatusColor(proposal.status)}`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(proposal.status)}
                          <span className="capitalize">{proposal.status}</span>
                        </div>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{proposal.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Voting ends: {new Date(proposal.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  {proposal.status === "active" && (
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="text-green-600 border-green-600 bg-transparent">
                        Vote For
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-600 bg-transparent">
                        Vote Against
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>For: {proposal.votesFor} votes</span>
                    <span>Against: {proposal.votesAgainst} votes</span>
                  </div>
                  <div className="flex space-x-2">
                    <Progress value={(proposal.votesFor / proposal.totalVotes) * 100} className="flex-1 h-2" />
                    <Progress value={(proposal.votesAgainst / proposal.totalVotes) * 100} className="flex-1 h-2" />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{((proposal.votesFor / proposal.totalVotes) * 100).toFixed(1)}% For</span>
                    <span>{((proposal.votesAgainst / proposal.totalVotes) * 100).toFixed(1)}% Against</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Transparency */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Transparency</CardTitle>
          <CardDescription>On-chain financial data and smart contract interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold">Treasury Balance</h4>
              <div className="text-2xl font-bold">$3,247,892</div>
              <p className="text-sm text-muted-foreground">Multi-sig wallet: 0x742d...8f3a</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Smart Contracts</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Token Contract:</span>
                  <span className="font-mono text-xs">0x1234...5678</span>
                </div>
                <div className="flex justify-between">
                  <span>Governance Contract:</span>
                  <span className="font-mono text-xs">0xabcd...ef90</span>
                </div>
                <div className="flex justify-between">
                  <span>Treasury Contract:</span>
                  <span className="font-mono text-xs">0x9876...5432</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
