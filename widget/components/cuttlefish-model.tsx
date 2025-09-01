"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"

interface CuttlefishModelProps {
  mouse: { x: number; y: number }
  globalState?: string
}

export default function CuttlefishModel({ mouse, globalState = "idle" }: CuttlefishModelProps) {
  const group = useRef<THREE.Group>(null)

  // Load your actual model - trying both models with fallback
  const { nodes: nodes1, materials: materials1 } = useGLTF("/models/cuttlefish.glb")
  const { nodes: nodes2, materials: materials2 } = useGLTF(
    "/models/tripo_convert_1e7baa8c-08a0-441f-8378-457c82fd5154.glb",
  )

  // Rainbow shader material based on your HTML code
  const rainbowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        intensity: { value: 1.0 },
        speed: { value: 1.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float intensity;
        uniform float speed;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          // Rainbow color cycling based on time and position
          float glow = sin(vUv.y * 10.0 + time * speed * 5.0) * 0.5 + 0.5;
          
          // Enhanced rainbow colors with emotional state influence
          vec3 color = vec3(
            0.5 + 0.5 * sin(time * speed + 0.0),
            0.5 + 0.5 * sin(time * speed + 2.0),
            0.5 + 0.5 * sin(time * speed + 4.0)
          ) * glow * intensity;
          
          // Add some depth-based variation
          float depth = (vPosition.z + 1.0) * 0.5;
          color *= (0.8 + 0.4 * depth);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    })
  }, [])

  // State-based parameters for the shader
  const stateParams = {
    idle: { intensity: 0.8, speed: 1.0 },
    excited: { intensity: 2.0, speed: 3.0 },
    curious: { intensity: 1.2, speed: 1.5 },
    thinking: { intensity: 0.6, speed: 0.5 },
    cautious: { intensity: 1.5, speed: 2.0 },
  }

  useFrame((frameState) => {
    if (!group.current) return

    const time = frameState.clock.getElapsedTime()
    const params = stateParams[globalState as keyof typeof stateParams] || stateParams.idle

    // Update shader uniforms
    rainbowMaterial.uniforms.time.value = time
    rainbowMaterial.uniforms.intensity.value = params.intensity
    rainbowMaterial.uniforms.speed.value = params.speed

    // State-based animations
    switch (globalState) {
      case "excited":
        // Rapid movement and rotation
        group.current.position.y = Math.sin(time * 6) * 0.2
        group.current.rotation.z = Math.sin(time * 4) * 0.1
        group.current.scale.setScalar(1.1 + Math.sin(time * 8) * 0.05)
        break
      case "curious":
        // Gentle bobbing and tilting
        group.current.position.y = Math.sin(time * 3) * 0.1
        group.current.rotation.z = Math.sin(time * 2) * 0.05
        break
      case "thinking":
        // Slow pulsing scale
        const thinkingScale = 1 + Math.sin(time * 1.5) * 0.05
        group.current.scale.setScalar(thinkingScale)
        group.current.rotation.y += 0.002 // Slow rotation
        break
      case "cautious":
        // Shrink and move carefully
        group.current.scale.setScalar(0.9)
        group.current.position.y = Math.sin(time * 1) * 0.05
        break
      default: // idle
        // Reset transformations with gentle floating
        group.current.position.y = Math.sin(time * 1.5) * 0.05
        group.current.scale.setScalar(1)
        group.current.rotation.z = 0
        group.current.rotation.y += 0.005 // Gentle rotation like in your HTML
    }

    // Mouse tracking - smooth interpolation
    const targetX = (mouse.y * Math.PI) / 8
    const targetY = (mouse.x * Math.PI) / 4
    group.current.rotation.x += (targetX - group.current.rotation.x) * 0.1
    group.current.rotation.y += (targetY - group.current.rotation.y) * 0.1

    // Add subtle floating motion
    group.current.position.x = Math.sin(time * 0.5) * 0.1
    group.current.position.z = Math.cos(time * 0.7) * 0.1
  })

  // Try to find the mesh in either model
  let meshGeometry = null
  let meshToRender = null

  // Check first model
  if (nodes1) {
    const meshNames = Object.keys(nodes1)
    for (const name of meshNames) {
      if (nodes1[name]?.geometry) {
        meshGeometry = nodes1[name].geometry
        meshToRender = nodes1[name]
        break
      }
    }
  }

  // Check second model if first didn't work
  if (!meshGeometry && nodes2) {
    const meshNames = Object.keys(nodes2)
    for (const name of meshNames) {
      if (nodes2[name]?.geometry) {
        meshGeometry = nodes2[name].geometry
        meshToRender = nodes2[name]
        break
      }
    }
  }

  if (!meshGeometry) {
    // Fallback geometry if models don't load
    return (
      <group ref={group} dispose={null}>
        <mesh material={rainbowMaterial}>
          <capsuleGeometry args={[0.3, 1.2, 4, 8]} />
        </mesh>
      </group>
    )
  }

  return (
    <group ref={group} dispose={null}>
      <mesh geometry={meshGeometry} material={rainbowMaterial} />
    </group>
  )
}

// Preload both models
useGLTF.preload("/models/cuttlefish.glb")
useGLTF.preload("/models/tripo_convert_1e7baa8c-08a0-441f-8378-457c82fd5154.glb")
