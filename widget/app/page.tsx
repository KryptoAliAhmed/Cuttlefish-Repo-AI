"use client"

import React, { useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment } from "@react-three/drei"
import { Suspense } from "react"
import CuttlefishModel from "@/components/cuttlefish-model"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function CuttlefishWidget() {
  const [state, setState] = useState("idle")
  const mouse = useRef({ x: 0, y: 0 })

  // Mouse tracking similar to your original code
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // 5 states: idle, curious, thinking, excited, cautious
  const states = [
    { key: "idle", label: "Idle", description: "Gentle rainbow glow with slow rotation" },
    { key: "curious", label: "Curious", description: "Brighter colors with bobbing motion" },
    { key: "thinking", label: "Thinking", description: "Slow pulsing with muted rainbow" },
    { key: "excited", label: "Excited", description: "Intense rainbow with rapid movement" },
    { key: "cautious", label: "Cautious", description: "Fast color cycling with defensive posture" },
  ]

  const currentState = states.find((s) => s.key === state)

  return (
    <div className="w-full h-screen bg-black relative">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          {/* Lighting setup similar to your HTML version */}
          <pointLight position={[10, 10, 10]} intensity={1} />
          <ambientLight intensity={0.3} />

          <CuttlefishModel mouse={mouse.current} globalState={state} />

          <Environment preset="night" />
          <OrbitControls enablePan={false} enableZoom={true} enableRotate={true} />
        </Suspense>
      </Canvas>

      {/* Control Panel */}
      <Card className="absolute top-4 left-4 w-80 bg-black/90 border-purple-500/50">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 text-purple-400">Cuttlefish Labs Widget</h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {states.map((stateOption) => (
              <Button
                key={stateOption.key}
                onClick={() => setState(stateOption.key)}
                variant={state === stateOption.key ? "default" : "outline"}
                className={
                  state === stateOption.key
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "border-purple-500 text-purple-400 hover:bg-purple-500/20"
                }
              >
                {stateOption.label}
              </Button>
            ))}
          </div>
          <p className="text-sm text-purple-400/70">Move your mouse to interact!</p>
        </CardContent>
      </Card>

      {/* Info Panel */}
      <Card className="absolute top-4 right-4 w-72 bg-black/90 border-purple-500/50">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2 text-purple-400">Current State</h3>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 animate-pulse" />
            <span className="capitalize font-medium text-white">{state}</span>
          </div>
          <p className="text-sm text-purple-400/70">{currentState?.description}</p>
          <div className="mt-3 text-xs text-purple-400/50">
            <p>Rainbow Shader Active</p>
            <p>
              Mouse: {mouse.current.x.toFixed(2)}, {mouse.current.y.toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <div className="absolute bottom-4 left-4">
        <Card className="bg-black/90 border-purple-500/50">
          <CardContent className="p-3">
            <p className="text-sm font-semibold text-purple-400">Cuttlefish Labs</p>
            <p className="text-xs text-purple-400/70">Rainbow Shader Widget</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
