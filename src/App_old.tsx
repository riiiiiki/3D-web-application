import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'

export default function App() {
  const bg = '/starmap_2020_4k.exr' // まずは4KでOK（重い場合はJPGに差し替え可）

  return (
    <Canvas camera={{ fov: 60, position: [0, 0, 0.1] }}>
      {/* 360°背景（EXR/HDRI） */}
      <Environment files={bg} background />

      {/* 視点操作（トラックパッド/マウス/タッチ） */}
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
      />
    </Canvas>
  )
}