// SwarmDashboard.jsx – Refactored using Chainlift Liftkit

import React from "react";
import { Button, Card, CardContent, Badge, Progress, Avatar } from "@chainlift/liftkit";
import { CheckCircle, AlertTriangle, Zap, Globe, MessageCircle, Gavel } from "lucide-react";

const agents = [
  { name: "FusionPredictiveAgent", icon: <Zap />, status: "online" },
  { name: "YieldRiskAgent", icon: <AlertTriangle />, status: "online" },
  { name: "ESGAgent", icon: <Globe />, status: "online" },
  { name: "SentimentAgent", icon: <MessageCircle />, status: "online" },
  { name: "ResolutionAgent", icon: <Gavel />, status: "online" }
];

const predictions = [
  "Will CFS SPARC reach Q>10 by 2026?",
  "Will fusion yield offset carbon in under 3 years?",
  "Will ETH cross $4500 before Solana reclaims ATH?"
];

export default function SwarmDashboard() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Avatar size="sm" src="/cuttlefish-icon.svg" /> Cuttlefish Labs: Swarm Deployment
        </h1>
        <Button variant="default">Launch Swarm</Button>
      </div>

      {/* Agent Status */}
      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">Agent Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent, i) => (
              <div key={i} className="flex items-center gap-3">
                <Badge variant="secondary" size="lg">
                  {agent.icon} {agent.name}
                </Badge>
                <Badge variant="success" className="ml-auto">Online</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Infra Metrics */}
      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-xl font-semibold">Infra Metrics</h2>
          <div className="grid grid-cols-3 gap-4">
            <Metric label="MCP Uptime" value="74 hrs" />
            <Metric label="Memory Usage" value={<Progress value={58} />} />
            <Metric label="Strategy Count" value="1,285" />
          </div>
        </CardContent>
      </Card>

      {/* FutureBench Predictions */}
      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">FutureBench Predictions</h2>
          <ul className="space-y-2">
            {predictions.map((text, i) => (
              <li key={i} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                {text}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-white rounded-md shadow p-4 text-center">
      <p className="text-sm text-gray-500">{label}</p>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
