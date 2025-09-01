// MVP Prototype for Earth 2.0 Platform
// Developer Lead: The Elephant

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Earth2MVP() {
  const [mode, setMode] = useState("welcome");

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
  };

  const renderMode = () => {
    switch (mode) {
      case "text":
        return <p className="text-base">Welcome to Text Mode. Information will be provided via simple text and TTS support.</p>;
      case "visual":
        return <p className="text-base">Welcome to Visual Story Mode. Here you’ll see animated scenes representing your future community.</p>;
      case "voice":
        return <p className="text-base">Voice Mode activated. Speak your questions aloud for interactive responses.</p>;
      default:
        return (
          <div className="space-y-4">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <p className="text-xl font-bold">Hi there! I'm Cuttle, your guide. Want help exploring your new neighborhood plan?</p>
            </motion.div>
            <div className="grid grid-cols-3 gap-4">
              <Button onClick={() => handleModeSelect("text")} className="rounded-2xl shadow-md">Text Mode</Button>
              <Button onClick={() => handleModeSelect("visual")} className="rounded-2xl shadow-md">Visual Story Mode</Button>
              <Button onClick={() => handleModeSelect("voice")} className="rounded-2xl shadow-md">Voice Mode</Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card className="rounded-2xl shadow-lg">
        <CardContent className="p-6">
          {renderMode()}
        </CardContent>
      </Card>
    </div>
  );
}
