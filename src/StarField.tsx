import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useThree, ThreeEvent } from '@react-three/fiber'

type StarFieldProps = {
  count?: number
  radius?: number
  selectedIndex: number | null
  onPick: (index: number) => void
}

export default function StarField({
  count = 5000,
  radius = 1000,
  selectedIndex,
  onPick
}: StarFieldProps) {
  // 星座標を生成
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const u = Math.random(), v = Math.random()
      const theta = 2 * Math.PI * u, phi = Math.acos(2 * v - 1)
      const r = radius
      arr[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [count, radius])

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [positions])

  const pointsRef = useRef<THREE.Points>(null!)
  const { camera, gl } = useThree()

  // Raycaster（Pointsの閾値を上げて当たりやすく）
  const ray = useMemo(() => {
    const r = new THREE.Raycaster()
    ;(r.params.Points as any).threshold = 15
    return r
  }, [])

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    // r3fのショートカット（当たった点のindex）
    if (typeof (e as any).index === 'number') {
      onPick((e as any).index as number)
      e.stopPropagation()
      return
    }
    // 念のため手動レイキャスト
    const rect = gl.domElement.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    )
    ray.setFromCamera(mouse, camera)
    const hits = ray.intersectObject(pointsRef.current!)
    if (hits.length) {
      onPick((hits[0] as any).index as number)
      e.stopPropagation()
    }
  }

  // 選択中の星ハイライト
  const selectedPos =
    selectedIndex != null
      ? new THREE.Vector3(
          positions[selectedIndex * 3 + 0],
          positions[selectedIndex * 3 + 1],
          positions[selectedIndex * 3 + 2]
        )
      : null

  return (
    <>
      <points ref={pointsRef} geometry={geo} onPointerDown={handlePointerDown}>
        <pointsMaterial size={2.5} sizeAttenuation color="#ffffff" />
      </points>

      {selectedPos && (
        <mesh position={selectedPos}>
          <sphereGeometry args={[6, 16, 16]} />
          <meshBasicMaterial color="#00ccff" />
        </mesh>
      )}
    </>
  )
}
