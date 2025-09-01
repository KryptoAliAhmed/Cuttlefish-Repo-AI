"use client"

import React, { useRef, useState, useMemo, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { 
  OrbitControls, 
  Stars, 
  Text, 
  MeshDistortMaterial,
  Float,
  Sparkles,
  Torus,
  Cylinder,
  Box,
  Icosahedron,
  Sphere
} from "@react-three/drei"
import { Suspense } from "react"
import * as THREE from "three"
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing"

interface AdvancedVisualizationProps {
  activeEffects?: string[]
  intensity?: number
  onEffectChange?: (effect: string) => void
}

// Simple Particle System
function ParticleSystem({ count = 200, intensity = 1 }) {
  const particles = useMemo(() => {
    const particles = []
    for (let i = 0; i < count; i++) {
      particles.push({
        position: [
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        ],
        speed: Math.random() * 2 + 1
      })
    }
    return particles
  }, [count])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    particles.forEach((particle, i) => {
      particle.position[0] += Math.sin(time + i) * 0.01
      particle.position[1] += Math.cos(time + i) * 0.01
      particle.position[2] += Math.sin(time * 0.5 + i) * 0.01
    })
  })

  return (
    <group>
      {particles.map((particle, i) => (
        <Float key={i} speed={particle.speed} rotationIntensity={1} floatIntensity={0.5}>
          <Sphere args={[0.05, 8, 8]} position={particle.position as [number, number, number]}>
            <meshStandardMaterial 
              color="#00ffff" 
              emissive="#004444"
              emissiveIntensity={intensity}
            />
          </Sphere>
        </Float>
      ))}
    </group>
  )
}

// DNA Helix Visualization
function DNAHelix({ intensity = 1 }) {
  const groupRef = useRef<THREE.Group>(null)
  const spheres = useMemo(() => {
    const spheres = []
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 4
      const radius = 1
      const x = Math.cos(angle) * radius
      const y = (i / 20) * 4 - 2
      const z = Math.sin(angle) * radius
      spheres.push({ position: [x, y, z], color: i % 2 === 0 ? "#ff4444" : "#4444ff" })
    }
    return spheres
  }, [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.5
    }
  })

  return (
    <group ref={groupRef}>
      {spheres.map((sphere, i) => (
        <Float key={i} speed={2} rotationIntensity={1} floatIntensity={2}>
          <Sphere args={[0.1, 8, 8]} position={sphere.position as [number, number, number]}>
            <meshStandardMaterial 
              color={sphere.color} 
              emissive={sphere.color}
              emissiveIntensity={intensity * 0.5}
            />
          </Sphere>
        </Float>
      ))}
    </group>
  )
}

// Quantum Field Effects
function QuantumField({ intensity = 1 }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (meshRef.current) {
      meshRef.current.rotation.x = time * 0.5
      meshRef.current.rotation.y = time * 0.3
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 32, 32]} />
      <MeshDistortMaterial
        color="#8800ff"
        speed={intensity * 2}
        distort={intensity * 0.4}
        radius={intensity * 1}
        emissive="#220044"
        emissiveIntensity={intensity * 0.3}
      />
    </mesh>
  )
}

// Neural Network 3D
function NeuralNetwork({ intensity = 1 }) {
  const nodes = useMemo(() => {
    const nodes = []
    for (let i = 0; i < 10; i++) {
      nodes.push({
        position: [
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6
        ]
      })
    }
    return nodes
  }, [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    nodes.forEach((node, i) => {
      node.position[1] += Math.sin(time + i) * 0.01
    })
  })

  return (
    <group>
      {nodes.map((node, i) => (
        <Float key={i} speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
          <Sphere args={[0.1, 8, 8]} position={node.position as [number, number, number]}>
            <meshStandardMaterial 
              color="#00ff88" 
              emissive="#004422"
              emissiveIntensity={intensity * 0.5}
            />
          </Sphere>
        </Float>
      ))}
    </group>
  )
}

// Holographic Interface
function HolographicInterface({ intensity = 1 }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.2
    }
  })

  return (
    <group ref={groupRef}>
      <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
        <Text
          position={[0, 1, 0]}
          fontSize={0.5}
          color="#00ffff"
          anchorX="center"
          anchorY="middle"
        >
          CUTTLEFISH
        </Text>
      </Float>
      
      {[0, 1, 2].map((i) => (
        <Torus
          key={i}
          args={[1 + i * 0.5, 0.05, 16, 32]}
          position={[0, 0, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial
            color="#00ffff"
            transparent
            opacity={0.3 - i * 0.1}
            emissive="#004444"
            emissiveIntensity={intensity * 0.5}
          />
        </Torus>
      ))}
    </group>
  )
}

// Energy Vortex
function EnergyVortex({ intensity = 1 }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 2
      groupRef.current.rotation.z = time * 0.5
    }
  })

  return (
    <group ref={groupRef}>
      {[0, 1, 2, 3].map((i) => (
        <Cylinder
          key={i}
          args={[0.1, 0.1, 3, 8]}
          position={[0, 0, 0]}
          rotation={[0, 0, (i * Math.PI) / 2]}
        >
          <meshStandardMaterial
            color="#ff8800"
            emissive="#442200"
            emissiveIntensity={intensity * 0.8}
            transparent
            opacity={0.7}
          />
        </Cylinder>
      ))}
    </group>
  )
}

// Data Stream
function DataStream({ intensity = 1 }) {
  const boxes = useMemo(() => {
    const boxes = []
    for (let i = 0; i < 20; i++) {
      boxes.push({
        position: [
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        ],
        scale: Math.random() * 0.5 + 0.1,
        speed: Math.random() * 2 + 1
      })
    }
    return boxes
  }, [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    boxes.forEach((box, i) => {
      box.position[1] += box.speed * 0.01
      if (box.position[1] > 5) {
        box.position[1] = -5
      }
    })
  })

  return (
    <group>
      {boxes.map((box, i) => (
        <Float key={i} speed={box.speed} rotationIntensity={1} floatIntensity={0.5}>
          <Box args={[box.scale, box.scale, box.scale]} position={box.position as [number, number, number]}>
            <meshStandardMaterial
              color="#88ff00"
              emissive="#224400"
              emissiveIntensity={intensity * 0.6}
            />
          </Box>
        </Float>
      ))}
    </group>
  )
}

// Floating Islands
function FloatingIslands({ intensity = 1 }) {
  const islands = useMemo(() => {
    const islands = []
    for (let i = 0; i < 5; i++) {
      islands.push({
        position: [
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 4 + 2,
          (Math.random() - 0.5) * 8
        ],
        scale: Math.random() * 0.5 + 0.5
      })
    }
    return islands
  }, [])

  return (
    <group>
      {islands.map((island, i) => (
        <group key={i} position={island.position as [number, number, number]}>
          <Float speed={1} rotationIntensity={0.5} floatIntensity={1}>
            <Icosahedron args={[island.scale, 1]}>
              <meshStandardMaterial
                color="#884400"
                emissive="#221100"
                emissiveIntensity={intensity * 0.3}
              />
            </Icosahedron>
            <Sparkles
              count={20}
              scale={island.scale * 2}
              size={2}
              speed={0.3}
              color="#ffff00"
            />
          </Float>
        </group>
      ))}
    </group>
  )
}

// Portal Effects
function PortalEffects({ intensity = 1 }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.5
      groupRef.current.rotation.z = time * 0.2
    }
  })

  return (
    <group ref={groupRef}>
      {[0, 1, 2, 3].map((i) => (
        <Torus
          key={i}
          args={[2 - i * 0.3, 0.1, 16, 32]}
          position={[0, 0, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial
            color={`hsl(${240 + i * 30}, 100%, 50%)`}
            transparent
            opacity={0.8 - i * 0.2}
            emissive={`hsl(${240 + i * 30}, 100%, 20%)`}
            emissiveIntensity={intensity * 0.6}
          />
        </Torus>
      ))}
    </group>
  )
}

// Main Scene Component
function Scene({ activeEffects = [], intensity = 1 }: AdvancedVisualizationProps) {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(0, 0, 8)
  }, [camera])

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#0044ff" />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {activeEffects.includes('particles') && (
        <ParticleSystem count={200} intensity={intensity} />
      )}
      
      {activeEffects.includes('dna') && (
        <DNAHelix intensity={intensity} />
      )}
      
      {activeEffects.includes('quantum') && (
        <QuantumField intensity={intensity} />
      )}
      
      {activeEffects.includes('neural') && (
        <NeuralNetwork intensity={intensity} />
      )}
      
      {activeEffects.includes('holographic') && (
        <HolographicInterface intensity={intensity} />
      )}
      
      {activeEffects.includes('vortex') && (
        <EnergyVortex intensity={intensity} />
      )}
      
      {activeEffects.includes('datastream') && (
        <DataStream intensity={intensity} />
      )}
      
      {activeEffects.includes('islands') && (
        <FloatingIslands intensity={intensity} />
      )}
      
      {activeEffects.includes('portal') && (
        <PortalEffects intensity={intensity} />
      )}
      
      <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
    </>
  )
}

// Main Component
export default function AdvancedVisualizationSystem({ 
  activeEffects = ['particles', 'dna', 'quantum', 'neural', 'holographic', 'vortex', 'datastream', 'islands', 'portal'],
  intensity = 1,
  onEffectChange
}: AdvancedVisualizationProps) {
  const [currentIntensity, setCurrentIntensity] = useState(intensity)
  const [currentEffects, setCurrentEffects] = useState(activeEffects)

  const effectOptions = [
    { key: 'particles', label: 'Particle System' },
    { key: 'dna', label: 'DNA Helix' },
    { key: 'quantum', label: 'Quantum Field' },
    { key: 'neural', label: 'Neural Network' },
    { key: 'holographic', label: 'Holographic Interface' },
    { key: 'vortex', label: 'Energy Vortex' },
    { key: 'datastream', label: 'Data Stream' },
    { key: 'islands', label: 'Floating Islands' },
    { key: 'portal', label: 'Portal Effects' }
  ]

  const toggleEffect = (effect: string) => {
    const newEffects = currentEffects.includes(effect)
      ? currentEffects.filter(e => e !== effect)
      : [...currentEffects, effect]
    setCurrentEffects(newEffects)
    onEffectChange?.(effect)
  }

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
        <h3 className="text-lg font-bold mb-2">3D Visualizations</h3>
        <div className="space-y-2">
          {effectOptions.map((effect) => (
            <label key={effect.key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={currentEffects.includes(effect.key)}
                onChange={() => toggleEffect(effect.key)}
                className="w-4 h-4"
              />
              <span className="text-sm">{effect.label}</span>
            </label>
          ))}
        </div>
        <div className="mt-4">
          <label className="block text-sm mb-1">Intensity</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={currentIntensity}
            onChange={(e) => setCurrentIntensity(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
      
      <Canvas
        camera={{ position: [0, 0, 8], fov: 75 }}
        style={{ background: 'linear-gradient(to bottom, #000011, #000033)' }}
      >
        <Suspense fallback={null}>
          <Scene activeEffects={currentEffects} intensity={currentIntensity} />
        </Suspense>
        
        <EffectComposer>
          <Bloom intensity={currentIntensity * 0.5} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
