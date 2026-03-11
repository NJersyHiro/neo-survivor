import * as THREE from 'three';

function NeonGrid() {
  return (
    <gridHelper
      args={[50, 50, new THREE.Color('#00ffff'), new THREE.Color('#1a1a3e')]}
      position={[0, 0.01, 0]}
      material-opacity={0.3}
      material-transparent={true}
    />
  );
}

function StageBoundary() {
  const walls: { position: [number, number, number]; scale: [number, number, number] }[] = [
    { position: [0, 1.5, 25], scale: [50, 3, 0.2] },
    { position: [0, 1.5, -25], scale: [50, 3, 0.2] },
    { position: [25, 1.5, 0], scale: [0.2, 3, 50] },
    { position: [-25, 1.5, 0], scale: [0.2, 3, 50] },
  ];

  return (
    <>
      {walls.map((wall, i) => (
        <mesh key={i} position={wall.position} scale={wall.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#ff00ff"
            emissive="#ff00ff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.3}
          />
        </mesh>
      ))}
    </>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#0a0a1a" />
    </mesh>
  );
}

export default function Stage() {
  return (
    <>
      <Ground />
      <NeonGrid />
      <StageBoundary />
    </>
  );
}
