import { Canvas } from '@react-three/fiber';
import { useEffect } from 'react';
import Stage from './components/Stage';
import Camera from './components/Camera';
import Player from './components/Player';
import Enemies from './components/Enemies';
import Projectiles from './components/Projectiles';
import XPGemRenderer from './components/XPGems';
import GameLoop from './components/GameLoop';
import PostProcessing from './components/PostProcessing';
import HUD from './ui/HUD';
import LevelUpScreen from './ui/LevelUpScreen';
import ResultsScreen from './ui/ResultsScreen';
import { useGameStore } from './stores/useGameStore';

function GameScene() {
  return (
    <>
      <Camera />
      <ambientLight intensity={0.15} color="#4444ff" />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#00ffff" />
      <Stage />
      <Player />
      <Enemies />
      <Projectiles />
      <XPGemRenderer />
      <GameLoop />
      <PostProcessing />
    </>
  );
}

export default function App() {
  const phase = useGameStore((s) => s.phase);

  useEffect(() => {
    if (phase === 'menu') {
      useGameStore.getState().startRun();
    }
  }, [phase]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#0a0a0f' }}
      >
        <GameScene />
      </Canvas>
      <HUD />
      <LevelUpScreen />
      <ResultsScreen />
    </div>
  );
}
