import { Component, Suspense, useRef, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { Group, Shape } from "three";

const shield = new Shape();
shield.moveTo(-1.2, 1.5);
shield.lineTo(0, 1.8);
shield.lineTo(1.2, 1.5);
shield.lineTo(1.1, -0.1);
shield.quadraticCurveTo(0.8, -1.05, 0, -1.65);
shield.quadraticCurveTo(-0.8, -1.05, -1.1, -0.1);
shield.closePath();
const crown = new Shape();
crown.moveTo(-0.8, 0.4);
crown.lineTo(-0.45, 0.12);
crown.lineTo(0, 0.75);
crown.lineTo(0.45, 0.12);
crown.lineTo(0.8, 0.4);
crown.lineTo(0.62, -0.35);
crown.lineTo(-0.62, -0.35);
crown.closePath();
function Emblem() {
  const ref = useRef<Group>(null);
  useFrame(({ pointer, clock }, delta) => {
    if (ref.current) {
      ref.current.rotation.y +=
        (pointer.x * 0.25 - ref.current.rotation.y) * Math.min(delta * 3, 1);
      ref.current.rotation.x =
        Math.sin(clock.elapsedTime * 0.35) * 0.06 - pointer.y * 0.1;
    }
  });
  return (
    <Float speed={1.3} rotationIntensity={0.05} floatIntensity={0.4}>
      <group ref={ref} rotation={[0, 0, -0.07]}>
        <mesh>
          <extrudeGeometry
            args={[
              shield,
              {
                depth: 0.18,
                bevelEnabled: true,
                bevelSegments: 3,
                bevelSize: 0.07,
                bevelThickness: 0.06,
                steps: 1,
              },
            ]}
          />
          <meshStandardMaterial
            color="#b89857"
            metalness={0.9}
            roughness={0.25}
          />
        </mesh>
        <mesh position={[0, 0.03, 0.25]} scale={[0.91, 0.91, 1]}>
          <shapeGeometry args={[shield]} />
          <meshStandardMaterial
            color="#0a372b"
            metalness={0.6}
            roughness={0.38}
          />
        </mesh>
        <mesh position={[0, 0.23, 0.32]}>
          <extrudeGeometry
            args={[
              crown,
              {
                depth: 0.08,
                bevelEnabled: true,
                bevelSize: 0.04,
                bevelThickness: 0.04,
                bevelSegments: 2,
              },
            ]}
          />
          <meshStandardMaterial
            color="#dfbc70"
            metalness={0.8}
            roughness={0.25}
          />
        </mesh>
        <mesh position={[0, -0.55, 0.38]}>
          <boxGeometry args={[1.14, 0.09, 0.1]} />
          <meshStandardMaterial
            color="#d8ba75"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, -0.97, 0.36]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.21, 0.21, 0.1]} />
          <meshStandardMaterial
            color="#d8ba75"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
        {[-1, 1].map((side) => (
          <group
            key={side}
            rotation={[0, 0, side * 0.57]}
            position={[side * 0.6, -0.2, -0.18]}
          >
            <mesh position={[0, 0.6, 0]}>
              <boxGeometry args={[0.09, 3.2, 0.08]} />
              <meshStandardMaterial
                color="#a9b9ac"
                metalness={0.9}
                roughness={0.28}
              />
            </mesh>
            <mesh position={[0, -1.1, 0]}>
              <boxGeometry args={[0.7, 0.09, 0.15]} />
              <meshStandardMaterial
                color="#ad8a45"
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
            <mesh position={[0, -1.4, 0]}>
              <boxGeometry args={[0.15, 0.5, 0.14]} />
              <meshStandardMaterial color="#332f25" />
            </mesh>
          </group>
        ))}
      </group>
    </Float>
  );
}
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export default function KingdomScene() {
  return (
    <SceneBoundary>
      <Canvas
        aria-hidden="true"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 7], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={1.4} />
        <directionalLight position={[4, 5, 4]} intensity={4} color="#ffe1a0" />
        <pointLight position={[-3, 1, 3]} intensity={18} color="#56b493" />
        <Suspense fallback={null}>
          <Emblem />
          <Sparkles
            count={65}
            scale={[8, 6, 5]}
            size={1.5}
            speed={0.3}
            color="#d0ba82"
          />
        </Suspense>
      </Canvas>
    </SceneBoundary>
  );
}
