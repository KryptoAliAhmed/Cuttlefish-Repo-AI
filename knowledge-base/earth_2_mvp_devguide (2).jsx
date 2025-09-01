// MVP Prototype for Earth 2.0 Platform
// Developer Lead: The Elephant

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion } from "framer-motion";
import { useSpeechSynthesis } from "react-speech-kit";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

const sites = [
  { name: "West Texas Campus", energyType: "Wind", pue: 1.2, incentives: ["IRA Tax Credits", "Opportunity Zone Benefits"] },
  { name: "Navajo Solar Hub", energyType: "Solar", pue: 1.15, incentives: ["Tribal Tax Abatements", "DOE Grants"] },
];

function TextMode() {
  const { speak } = useSpeechSynthesis();
  return (
    <div className="space-y-4">
      <p className="text-base">Welcome to Text Mode. Explore sustainable community plans.</p>
      {sites.map((site) => (
        <div key={site.name}>
          <p><strong>{site.name}</strong>: Powered by {site.energyType} (PUE: {site.pue})</p>
          <p>Incentives: {site.incentives.join(", ")}</p>
          <Button
            onClick={() => speak({ text: `${site.name} is powered by ${site.energyType} with a PUE of ${site.pue}.` })}
            aria-label={`Read aloud about ${site.name}`}
          >
            Read Aloud
          </Button>
        </div>
      ))}
    </div>
  );
}

function VisualMode() {
  return (
    <div className="space-y-4">
      <p className="text-base">Visual Story Mode: See your sustainable community in action.</p>
      <div className="h-64 bg-gray-200 flex items-center justify-center">
        <p>3D Model of {sites[0].name} (Wind-Powered Data Center)</p>
      </div>
    </div>
  );
}

function VoiceMode() {
  const { transcript, listening, startListening, stopListening } = useSpeechRecognition();
  return (
    <div className="space-y-4">
      <p className="text-base">{listening ? "Listening..." : "Voice Mode: Ask about your community."}</p>
      <Button
        onClick={listening ? stopListening : startListening}
        aria-label={listening ? "Stop voice input" : "Start voice input"}
      >
        {listening ? "Stop Speaking" : "Start Speaking"}
      </Button>
      <p>Query: {transcript}</p>
      <p>Response: Ask about sustainability or incentives!</p>
    </div>
  );
}

function WelcomeScreen({ onSelectMode }) {
  return (
    <div className="space-y-4">
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
        <p className="text-xl font-bold">Hi there! I'm Cuttle, your guide. Want help exploring your new neighborhood plan?</p>
      </motion.div>
      <div className="grid grid-cols-3 gap-4">
        <Button
          onClick={() => onSelectMode("text")}
          className="rounded-2xl shadow-md"
          aria-label="Select Text Mode for text-based information and text-to-speech"
        >
          Text Mode
        </Button>
        <Button
          onClick={() => onSelectMode("visual")}
          className="rounded-2xl shadow-md"
          aria-label="Select Visual Story Mode for animated community scenes"
        >
          Visual Story Mode
        </Button>
        <Button
          onClick={() => onSelectMode("voice")}
          className="rounded-2xl shadow-md"
          aria-label="Select Voice Mode for interactive voice responses"
        >
          Voice Mode
        </Button>
      </div>
    </div>
  );
}

export default function Earth2MVP() {
  const [mode, setMode] = useState("welcome");

  const renderMode = () => {
    switch (mode) {
      case "text":
        return <TextMode />;
      case "visual":
        return <VisualMode />;
      case "voice":
        return <VoiceMode />;
      default:
        return <WelcomeScreen onSelectMode={setMode} />;
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
