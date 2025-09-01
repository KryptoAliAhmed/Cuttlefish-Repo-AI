"use client"

import React, { useState } from "react"
import AdvancedVisualizationSystem from "./advanced-visualization-system"

interface VisualizationBackgroundProps {
  children: React.ReactNode
  activeEffects?: string[]
  intensity?: number
  showControls?: boolean
}

export default function VisualizationBackground({ 
  children, 
  activeEffects = ['particles', 'quantum', 'neural'],
  intensity = 0.5,
  showControls = false
}: VisualizationBackgroundProps) {
  const [currentEffects, setCurrentEffects] = useState(activeEffects)
  const [currentIntensity, setCurrentIntensity] = useState(intensity)

  return (
    <div className="relative w-full h-full">
      {/* Background Visualization */}
      <div className="absolute inset-0 z-0">
        <AdvancedVisualizationSystem 
          activeEffects={currentEffects}
          intensity={currentIntensity}
          onEffectChange={(effect) => {
            console.log(`Background effect toggled: ${effect}`)
          }}
        />
      </div>
      
      {/* Content Overlay */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
      
      {/* Optional Controls */}
      {showControls && (
        <div className="absolute bottom-4 right-4 z-20 bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
          <h4 className="text-sm font-bold mb-2">Background Effects</h4>
          <div className="space-y-1">
            {['particles', 'dna', 'quantum', 'neural', 'holographic', 'vortex', 'datastream', 'islands', 'portal'].map((effect) => (
              <label key={effect} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={currentEffects.includes(effect)}
                  onChange={() => {
                    const newEffects = currentEffects.includes(effect)
                      ? currentEffects.filter(e => e !== effect)
                      : [...currentEffects, effect]
                    setCurrentEffects(newEffects)
                  }}
                  className="w-3 h-3"
                />
                <span className="text-xs capitalize">{effect}</span>
              </label>
            ))}
          </div>
          <div className="mt-2">
            <label className="block text-xs mb-1">Intensity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={currentIntensity}
              onChange={(e) => setCurrentIntensity(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}
