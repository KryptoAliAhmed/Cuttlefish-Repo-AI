// app/dashboard/SwarmDashboard.jsx

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gauge, Cpu, Server, Brain, AlertTriangle, Globe, MessageSquare, Gavel } from "lucide-react";
import Link from "next/link";

const agents = [
  {
    name: "FusionPredictiveAgent",
    icon: <Gauge className="w-5 h-5 mr-1" />,
    status: "Online",
    href: "/agents/fusion",
  },
  {
    name: "YieldRiskAgent",
    icon: <AlertTriangle className="w-5 h-5 mr-1" />,
    status: "Online",
    href: "/agents/yield-risk",
  },
  {
    name: "ESGAgent",
    icon: <Globe className="w-5 h-5 mr-1" />,
    status: "Online",
    href: "/agents/esg",
  },
  {
    name: "SentimentAgent",
    icon: <MessageSquare className="w-5 h-5 mr-1" />,
    status: "Online",
    href: "/agents/sentiment",
  },
  {
    name: "ResolutionAgent",
    icon: <Gavel className="w-5 h-5 mr-1" />,
    status: "Online",
    href: "/agents/resolution",
  },
];

const predictions = [
  "Will CFS SPARC reach Q>10 by 2026?",
  "Will fusion yield offset carbon in under 3 years?",
  "Will ETH cross $4500 before Solana reclaims ATH?",
];

export default function SwarmDashboard() {
  return (
    <div className="grid gap-6 p-6 dark:bg-[#0e0e1a] min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">🐙 Cuttlefish Labs Swarm Deployment</h1>
        <Button>Launch Swarm</Button>
      </div>

      <Card className="bg-[#1a1a2b]">
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
          <div>
            <h2 className="text-white font-semibold mb-2">Agent Status</h2>
            <ul className="space-y-2">
              {agents.map((agent) => (
                <li key={agent.name}>
                  <Link href={agent.href}>
                    <Button variant="outline" className="w-full flex justify-start items-center">
                      {agent.icon}
                      {agent.name}
                      <Badge className="ml-auto" variant="default">
                        {agent.status}
                      </Badge>
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-white font-semibold mb-2">Infra Metrics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-white">
                <span>MCP Uptime</span>
                <span>74 hrs</span>
              </div>
              <div className="flex justify-between items-center text-white">
                <span>Memory Usage</span>
                <Progress value={58} className="w-2/3" />
                <span>58%</span>
              </div>
              <div className="flex justify-between items-center text-white">
                <span>Strategy Count</span>
                <span>1,285</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-white font-semibold mb-2">FutureBench Predictions</h2>
            <ul className="space-y-2">
              {predictions.map((q, idx) => (
                <li key={idx} className="bg-[#22223a] rounded p-3 text-sm text-white">
                  {q}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
