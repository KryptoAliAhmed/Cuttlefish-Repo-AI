"use client"

import { useRef, useState, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { EffectComposer, Bloom } from "@react-three/postprocessing"
import type { JSX } from "react/jsx-runtime"

interface CuttlefishModelProps {
  mouse: { x: number; y: number }
}

function useCuttlefishState() {
  const [state, setState] = useState("idle") // idle, curious, thinking, cautious, excited

  // Auto-cycle through states for demo
  useFrame((frameState) => {
    const time = frameState.clock.getElapsedTime()
    const cycle = Math.floor(time / 4) % 5
    const states = ["idle", "curious", "thinking", "cautious", "excited"]
    setState(states[cycle])
  })

  return { state, setState }
}

function BubbleTrail({ position, opacity = 0.6 }: { position: [number, number, number]; opacity?: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((frameState) => {
    if (!meshRef.current) return
    const time = frameState.clock.getElapsedTime()

    // Animate bubbles floating upward
    meshRef.current.position.y += 0.02
    meshRef.current.position.x += Math.sin(time * 3) * 0.005
    meshRef.current.scale.setScalar(1 + Math.sin(time * 4) * 0.1)

    // Fade out over time
    if (meshRef.current.material instanceof THREE.Material) {
      meshRef.current.material.opacity = Math.max(0, opacity - (meshRef.current.position.y - position[1]) * 0.1)
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.02, 8, 8]} />
      <meshStandardMaterial color="skyblue" emissive="skyblue" emissiveIntensity={0.5} transparent opacity={opacity} />
    </mesh>
  )
}

export default function EnhancedCuttlefishModel({ mouse }: CuttlefishModelProps) {
  const group = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Mesh>(null)
  const tentacleRefs = useRef<THREE.Mesh[]>([])
  const { state } = useCuttlefishState()
  const [bubbles, setBubbles] = useState<JSX.Element[]>([])
  const bubbleCounter = useRef(0)

  // Create cuttlefish geometry
  const { bodyGeometry, tentacleGeometry } = useMemo(() => {
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8)
    const tentacleGeometry = new THREE.CylinderGeometry(0.05, 0.02, 0.8, 8)
    return { bodyGeometry, tentacleGeometry }
  }, [])

  useFrame((frameState) => {
    if (!group.current) return

    const time = frameState.clock.getElapsedTime()

    // Cursor follow
    const targetX = (mouse.x * Math.PI) / 8
    const targetY = (mouse.y * Math.PI) / 8
    group.current.rotation.y += (targetX - group.current.rotation.y) * 0.1
    group.current.rotation.x += (targetY - group.current.rotation.x) * 0.1

    // Tentacle idle sways
    tentacleRefs.current.forEach((tentacle, i) => {
      if (tentacle) {
        tentacle.rotation.z = Math.sin(time * 2 + i) * 0.15
        tentacle.rotation.x = Math.cos(time * 1.5 + i * 0.5) * 0.1
      }
    })

    // State-based animations and effects
    switch (state) {
      case "thinking":
        // Pulsing and bubble generation
        const thinkingScale = 1 + Math.sin(time * 3) * 0.03
        group.current.scale.setScalar(thinkingScale)

        // Generate bubbles periodically
        if (Math.floor(time * 4) > bubbleCounter.current) {
          bubbleCounter.current = Math.floor(time * 4)
          const newBubble = (
            <BubbleTrail
              key={`bubble-${bubbleCounter.current}`}
              position={[(Math.random() - 0.5) * 0.5, 0.5, (Math.random() - 0.5) * 0.5]}
            />
          )
          setBubbles((prev) => [...prev.slice(-10), newBubble]) // Keep only last 10 bubbles
        }
        break

      case "curious":
        group.current.position.y = Math.sin(time * 4) * 0.15
        group.current.rotation.z = Math.sin(time * 2) * 0.1
        group.current.scale.setScalar(1.05)
        break

      case "cautious":
        // Shrink and move slowly
        group.current.scale.setScalar(0.9)
        group.current.position.y = Math.sin(time * 1) * 0.05
        break

      case "excited":
        // Rapid movement and scaling
        group.current.position.y = Math.sin(time * 6) * 0.2
        group.current.rotation.z = Math.sin(time * 4) * 0.15
        group.current.scale.setScalar(1.1 + Math.sin(time * 8) * 0.05)
        break

      default: // idle
        group.current.position.y = Math.sin(time * 1.5) * 0.05
        group.current.scale.setScalar(1)
        group.current.rotation.z = 0
    }
  })

  // Get materials based on state
  const getBodyMaterial = () => {
    const stateColors = {
      thinking: "#FF6B6B",
      curious: "#4ECDC4",
      cautious: "#F39C12",
      excited: "#9B59B6",
      idle: "#95A5A6",
    }

    const emissiveIntensity = state === "thinking" ? 0.3 : state === "excited" ? 0.2 : 0.1

    return new THREE.MeshStandardMaterial({
      color: stateColors[state as keyof typeof stateColors] || stateColors.idle,
      emissive: stateColors[state as keyof typeof stateColors] || stateColors.idle,
      emissiveIntensity,
      metalness: 0.3,
      roughness: 0.4,
      transparent: true,
      opacity: 0.9,
    })
  }

  const getTentacleMaterial = () => {
    return new THREE.MeshStandardMaterial({
      color: "#7F8C8D",
      metalness: 0.2,
      roughness: 0.6,
    })
  }

  return (
    <>
      <group ref={group} dispose={null}>
        {/* Main body */}
        <mesh ref={bodyRef} geometry={bodyGeometry} material={getBodyMaterial()} position={[0, 0, 0]} />

        {/* Tentacles */}
        {Array.from({ length: 8 }).map((_, index) => {
          const angle = (index / 8) * Math.PI * 2
          const radius = 0.4
          const x = Math.cos(angle) * radius
          const z = Math.sin(angle) * radius

          return (
            <mesh
              key={index}
              ref={(el) => {
                if (el) tentacleRefs.current[index] = el
              }}
              geometry={tentacleGeometry}
              material={getTentacleMaterial()}
              position={[x, -0.8, z]}
              rotation={[Math.PI / 6, angle, 0]}
            />
          )
        })}

        {/* Eyes */}
        <mesh position={[0.15, 0.3, 0.25]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#2C3E50" />
        </mesh>
        <mesh position={[-0.15, 0.3, 0.25]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#2C3E50" />
        </mesh>

        {/* Eye pupils */}
        <mesh position={[0.15, 0.3, 0.32]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        <mesh position={[-0.15, 0.3, 0.32]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      </group>

      {/* Render bubbles */}
      {bubbles}

      {/* Post-processing effects */}
      <EffectComposer>
        <Bloom
          intensity={state === "thinking" ? 1.5 : state === "excited" ? 1.2 : 0.8}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
        />
      </EffectComposer>
    </>
  )
}
