"use client"

import { Card, CardContent } from "@/components/ui/card"

interface StateIndicatorProps {
  currentState: string
}

export default function StateIndicator({ currentState }: StateIndicatorProps) {
  const stateDescriptions = {
    idle: "Floating peacefully",
    curious: "Investigating surroundings",
    thinking: "Deep in thought (bubbles!)",
    cautious: "Being careful",
    excited: "Full of energy!",
  }

  const stateColors = {
    idle: "bg-gray-500",
    curious: "bg-teal-500",
    thinking: "bg-red-500",
    cautious: "bg-orange-500",
    excited: "bg-purple-500",
  }

  return (
    <Card className="absolute top-4 right-4 w-64">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2">Cuttlefish State</h3>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${stateColors[currentState as keyof typeof stateColors]}`} />
          <span className="capitalize font-medium">{currentState}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {stateDescriptions[currentState as keyof typeof stateDescriptions]}
        </p>
        <p className="text-xs text-muted-foreground mt-2">States auto-cycle every 4 seconds</p>
      </CardContent>
    </Card>
  )
}
