// src/Loader.tsx
import { Html, useProgress } from '@react-three/drei'

export default function Loader() {
  const { progress, active } = useProgress()
  if (!active) return null // 読み込み完了後はDOMから消す
  return (
    <Html
      center
      style={{
        pointerEvents: 'none',    // ★クリックを透過
        color: 'white',
        fontFamily: 'system-ui'
      }}
    >
      {Math.round(progress)}%
    </Html>
  )
}
