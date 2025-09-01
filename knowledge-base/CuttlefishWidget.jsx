// components/CuttlefishWidget.jsx
import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import useCuttlefishDAOData from '../hooks/useCuttlefishDAOData';
import CuttlefishParticles from './CuttlefishParticles';

function CuttlefishModel({ daoState, mouse }) {
  const group = useRef();
  const { nodes } = useGLTF('/models/cuttlefish.glb');

  const neonMaterial = useRef(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('black'),
      emissive: new THREE.Color('cyan'),
      emissiveIntensity: 1,
      metalness: 0.6,
      roughness: 0.3
    })
  );

  const stateColors = {
    excited: 'gold',
    curious: 'magenta',
    thinking: 'cyan',
    idle: 'white'
  };

  useFrame((stateFrame) => {
    if (!group.current) return;
    const time = stateFrame.clock.getElapsedTime();
    let pulse = 1;

    if (daoState === 'excited') pulse = 1.5 + Math.sin(time * 10) * 0.5;
    else if (daoState === 'curious') pulse = 1 + Math.sin(time * 4) * 0.3;
    else if (daoState === 'thinking') pulse = 1 + Math.sin(time * 2) * 0.2;

    neonMaterial.current.emissive = new THREE.Color(stateColors[daoState]);
    neonMaterial.current.emissiveIntensity = pulse;

    const targetX = (mouse.x * Math.PI) / 8;
    const targetY = (mouse.y * Math.PI) / 8;
    group.current.rotation.y += (targetX - group.current.rotation.y) * 0.1;
    group.current.rotation.x += (targetY - group.current.rotation.x) * 0.1;
  });

  return (
    <group ref={group} dispose={null}>
      <mesh
        geometry={nodes.cuttlefish_mesh.geometry}
        material={neonMaterial.current}
      />
      {daoState === 'excited' && <CuttlefishParticles />}
    </group>
  );
}

export default function CuttlefishWidget() {
  const { daoState, metrics } = useCuttlefishDAOData();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  return (
    <div
      className="relative w-full h-full"
      onMouseMove={(e) =>
        setMouse({
          x: (e.clientX / window.innerWidth) * 2 - 1,
          y: -(e.clientY / window.innerHeight) * 2 + 1
        })
      }
    >
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <CuttlefishModel daoState={daoState} mouse={mouse} />
      </Canvas>
      <Html position={[0, -1.5, 0]}>
        <div className="bg-black/70 text-white p-2 rounded-lg text-sm">
          <p>{daoState.toUpperCase()} Mode</p>
          <p>{metrics.treasury} E2R Treasury</p>
          <p>{metrics.mwCompute} MW Compute</p>
          <p>{metrics.carbonOffset} t CO₂ Offset</p>
        </div>
      </Html>
    </div>
  );
}
