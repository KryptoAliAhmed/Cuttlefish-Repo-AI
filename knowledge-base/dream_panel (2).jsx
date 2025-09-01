import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import MessageConsole from "./MessageConsole";
import PredictionCard from "./PredictionCard";
import MemoryTimeline from "./MemoryTimeline";

export default function DashboardLayout() {
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Column 1: Message Console */}
      <div className="md:col-span-1">
        <Card className="h-full">
          <CardHeader className="text-xl font-semibold">Cuttlefish Chat</CardHeader>
          <CardContent className="h-[500px] overflow-y-scroll">
            <MessageConsole />
          </CardContent>
        </Card>
      </div>

      {/* Column 2: Predictions */}
      <div className="md:col-span-1">
        <Card className="h-full">
          <CardHeader className="text-xl font-semibold">Recent Predictions</CardHeader>
          <CardContent className="grid gap-4">
            <PredictionCard
              id={1}
              predictedValue={4200}
              confidence={92}
              reasoning="Q3 tokenized yield models indicate sustainable liquidity inflows."
            />
            <PredictionCard
              id={2}
              predictedValue={3800}
              confidence={75}
              reasoning="Social momentum declining post-FOMC."
            />
          </CardContent>
        </Card>
      </div>

      {/* Column 3: Memory Timeline */}
      <div className="md:col-span-1">
        <Card className="h-full">
          <CardHeader className="text-xl font-semibold">Long-Term Memory</CardHeader>
          <CardContent className="h-[500px] overflow-y-scroll">
            <MemoryTimeline />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
