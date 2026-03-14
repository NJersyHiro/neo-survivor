import { Canvas } from '@react-three/fiber';
import Stage from './components/Stage';
import Camera from './components/Camera';
import Player from './components/Player';
import Enemies from './components/Enemies';
import EnemyProjectiles from './components/EnemyProjectiles';
import Projectiles from './components/Projectiles';
import XPGemRenderer from './components/XPGems';
import Chests from './components/Chests';
import FloorItemRenderer from './components/FloorItems';
import GameLoop from './components/GameLoop';
import PostProcessing from './components/PostProcessing';
import HUD from './ui/HUD';
import LevelUpScreen from './ui/LevelUpScreen';
import AugmentScreen from './ui/AugmentScreen';
import PauseScreen from './ui/PauseScreen';
import ResultsScreen from './ui/ResultsScreen';
import MainMenu from './ui/MainMenu';

function GameScene() {
  return (
    <>
      <Camera />
      <ambientLight intensity={0.15} color="#4444ff" />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#00ffff" />
      <Stage />
      <Player />
      <Enemies />
      <EnemyProjectiles />
      <Projectiles />
      <XPGemRenderer />
      <Chests />
      <FloorItemRenderer />
      <GameLoop />
      <PostProcessing />
    </>
  );
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#0a0a0f', touchAction: 'none' }}
      >
        <GameScene />
      </Canvas>
      <HUD />
      <LevelUpScreen />
      <AugmentScreen />
      <PauseScreen />
      <ResultsScreen />
      <MainMenu />
    </div>
  );
}
