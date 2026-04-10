import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Stars } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../context/ThemeContext';

function AnimatedSphere() {
  const { theme } = useTheme();
  const sphereRef = useRef<THREE.Mesh>(null);

  const color = theme === 'neon' ? '#00ff00' : theme === 'dark' ? '#3b82f6' : '#60a5fa';

  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      sphereRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1}>
      <Sphere ref={sphereRef} args={[1, 100, 100]} scale={2}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.5}
          speed={2}
          roughness={0}
        />
      </Sphere>
    </Float>
  );
}

export default function Scene() {
  const { theme } = useTheme();

  return (
    <div className="three-container">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Stars 
          radius={100} 
          depth={50} 
          count={5000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={1} 
        />
        <AnimatedSphere />
      </Canvas>
    </div>
  );
}
