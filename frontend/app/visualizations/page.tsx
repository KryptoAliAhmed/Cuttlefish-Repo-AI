"use client"

import React from "react"
import AdvancedVisualizationSystem from "../../components/advanced-visualization-system"

export default function VisualizationDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-blue-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            CuttleFish Advanced 3D Visualizations
          </h1>
          <p className="text-xl text-gray-300">
            Interactive 3D effects for enhanced user experience
          </p>
        </div>
        
        <div className="h-[80vh] rounded-lg overflow-hidden border border-purple-500/30">
          <AdvancedVisualizationSystem 
            activeEffects={[
              'particles', 
              'dna', 
              'quantum', 
              'neural', 
              'holographic', 
              'vortex', 
              'datastream', 
              'islands', 
              'portal'
            ]}
            intensity={1}
            onEffectChange={(effect) => {
              console.log(`Effect toggled: ${effect}`)
            }}
          />
        </div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/30">
            <h3 className="text-xl font-bold text-white mb-3">Particle System</h3>
            <p className="text-gray-300">
              Advanced particle system with floating spheres
            </p>
          </div>
          
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/30">
            <h3 className="text-xl font-bold text-white mb-3">DNA Helix</h3>
            <p className="text-gray-300">
              Animated DNA helix visualization with floating spheres
            </p>
          </div>
          
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/30">
            <h3 className="text-xl font-bold text-white mb-3">Quantum Field</h3>
            <p className="text-gray-300">
              Quantum field effects with distortion materials and wave patterns
            </p>
          </div>
          
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/30">
            <h3 className="text-xl font-bold text-white mb-3">Neural Network</h3>
            <p className="text-gray-300">
              3D neural network visualization with floating nodes
            </p>
          </div>
          
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/30">
            <h3 className="text-xl font-bold text-white mb-3">Holographic Interface</h3>
            <p className="text-gray-300">
              Floating text and holographic rings with sci-fi aesthetics
            </p>
          </div>
          
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/30">
            <h3 className="text-xl font-bold text-white mb-3">Energy Vortex</h3>
            <p className="text-gray-300">
              Rotating cylinders creating dynamic energy vortex effects
            </p>
          </div>
          
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/30">
            <h3 className="text-xl font-bold text-white mb-3">Data Stream</h3>
            <p className="text-gray-300">
              Animated boxes representing data flow and information streams
            </p>
          </div>
          
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/30">
            <h3 className="text-xl font-bold text-white mb-3">Floating Islands</h3>
            <p className="text-gray-300">
              Icosahedron islands with sparkles and floating animations
            </p>
          </div>
          
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/30">
            <h3 className="text-xl font-bold text-white mb-3">Portal Effects</h3>
            <p className="text-gray-300">
              Multi-layered torus creating portal and gateway visualizations
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
