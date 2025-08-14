import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useLoader, useThree, ThreeEvent } from '@react-three/fiber'
import type { RaycasterParameters } from 'three'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import StarField from './StarField'
import Loader from './Loader'

type Edge = [number, number]

/** EXR を読み込んで背景＆環境にセットする */
function ExrBackground({ file }: { file: string }) {
  const { scene } = useThree()
  const tex = useLoader(EXRLoader, file)
  useEffect(() => {
    tex.mapping = THREE.EquirectangularReflectionMapping
    scene.background = tex
    scene.environment = tex
    return () => {
      scene.background = null
      scene.environment = null
      tex.dispose()
    }
  }, [scene, tex])
  return null
}

export default function App() {
  // ---- 状態 ----
  const [selected, setSelected] = useState<number | null>(null) // 1点目
  const [edges, setEdges] = useState<Edge[]>([])                // 結んだ線たち
  const [name, setName] = useState('My Constellation')

  // ---- LineSegments 準備 ----
  const linesRef = useRef<THREE.LineSegments>(null!)
  const [lineGeo] = useState(() => new THREE.BufferGeometry())
  const [linePosAttr] = useState(
    () => new THREE.BufferAttribute(new Float32Array(6 * 2000), 3) // 最大2000本
  )
  const rootRef = useRef<THREE.Group>(null)
  const positionsRef = useRef<Float32Array | null>(null)

  useEffect(() => {
    lineGeo.setAttribute('position', linePosAttr)
  }, [lineGeo, linePosAttr])

  const updateLines = (root: THREE.Object3D | null) => {
    if (!root) return
    let positions: Float32Array | null = positionsRef.current
    if (!positions) {
      root.traverse(obj => {
        if ((obj as any).isPoints) {
          const attr = (obj as THREE.Points).geometry.getAttribute('position') as THREE.BufferAttribute
          positions = attr.array as Float32Array
        }
      })
      positionsRef.current = positions
    }
    if (!positions) return

    let offset = 0
    const arr = linePosAttr.array as Float32Array
    for (let i = 0; i < edges.length; i++) {
      const [a, b] = edges[i]
      const a3 = a * 3, b3 = b * 3
      arr[offset++] = positions[a3]
      arr[offset++] = positions[a3 + 1]
      arr[offset++] = positions[a3 + 2]
      arr[offset++] = positions[b3]
      arr[offset++] = positions[b3 + 1]
      arr[offset++] = positions[b3 + 2]
    }
    linePosAttr.needsUpdate = true
    lineGeo.setDrawRange(0, edges.length * 2)
  }

  useEffect(() => {
    updateLines(rootRef.current)
  }, [edges])

  // 星クリック → 2点で結線
  const handlePick = (idx: number) => {
    setSelected(prev => {
      if (prev == null) return idx
      if (prev !== idx) setEdges(e => [...e, [prev, idx]])
      return null
    })
  }

  // ---- UI（簡易）----
  const Ui = (
    <div style={{ position: 'fixed', inset: 16, pointerEvents: 'none' }}>
      <div
        style={{
          pointerEvents: 'auto',
          maxWidth: 520,
          padding: 12,
          background: 'rgba(0,0,0,0.5)',
          color: 'white',
          borderRadius: 12,
          fontFamily: 'system-ui'
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ flex: 1, padding: 6, borderRadius: 8, border: '1px solid #555', background: '#111', color: 'white' }}
            placeholder="Constellation name"
          />
          {/* 保存などは後で */}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ opacity: 0.8 }}>Selected: {selected ?? '-'}</span>
          <span style={{ opacity: 0.8 }}>Lines: {edges.length}</span>
        </div>
      </div>
    </div>
  )

  // ---- Canvas ----
  const raycasterConfig = useMemo<Partial<THREE.Raycaster>>(
    () => ({
      params: { Points: { threshold: 60 } } as RaycasterParameters
    }),
    []
  )

  return (
    <>
      <Canvas
        camera={{ fov: 60, position: [0, 0, 0.1] }}
        style={{ position: 'fixed', inset: 0, background: '#000' }}
        raycaster={raycasterConfig}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
          gl.domElement.style.cursor = 'crosshair'
        }}
        onPointerMissed={(e: any) => {
            console.log('miss', e.pointerType, e.clientX, e.clientY)
            setSelected(null)
        }}
      >
        <ExrBackground file="/starmap_2020_4k.exr" />

        <group ref={rootRef}>
          <StarField selectedIndex={selected} onPick={handlePick} />
          <lineSegments ref={linesRef} geometry={lineGeo}>
            <lineBasicMaterial color="#00ccff" />
          </lineSegments>
        </group>

        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
        />

        <Loader /> {/* Canvasの内側に置く（pointerEvents: 'none'にしてある） */}
      </Canvas>

      {Ui}
    </>
  )
}
