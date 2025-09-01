import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

const dreams = [
  {
    id: 1,
    title: "🌌 Dream: Terraforming Europa",
    summary: "I imagined converting Europa’s subsurface ocean into a geothermal biosphere."
  },
  {
    id: 2,
    title: "🔮 Forecast: Carbon-negative RWA surge",
    summary: "Fusion-driven real-world assets will dominate the 2030 sustainability market."
  },
  {
    id: 3,
    title: "🪐 Speculation: Dyson Swarm via decentralized solar nodes",
    summary: "What if fusion-subsidized solar nodes could bootstrap Dyson shell arrays?"
  }
];

export default function DreamPanel() {
  return (
    <Card className="h-full w-full rounded-2xl shadow-lg">
      <CardContent className="p-4">
        <h2 className="text-xl font-semibold mb-4">Cuttlefish Daydreams</h2>
        <ScrollArea className="h-[300px]">
          <ul className="space-y-4">
            {dreams.map((dream) => (
              <motion.li
                key={dream.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl"
              >
                <h3 className="font-medium text-lg">{dream.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{dream.summary}</p>
              </motion.li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
