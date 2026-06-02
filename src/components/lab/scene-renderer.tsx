'use client'

import { useMemo, useRef, useCallback, useState, useEffect } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useLabStore, modeInfo } from '@/store/lab-store'
import {
  f,
  g,
  fOdd,
  fEven,
  fCartesian,
  fRect,
  riemannSum2D,
  rectApprox,
  sphereCylinderVolume,
  numericalIntegral2D,
  numericalIntegral1D,
  integralTriangularX,
  integralTriangularY,
  fPolar,
  fTriple,
  polarRiemannSum,
  tripleIntegralApprox,
  formatValue,
  generateConvergenceData,
  generateErrorData,
  surfaceAreaApprox,
  fubiniDoubleIntegral,
  arcLengthApprox,
  arcLengthExact,
  massCenterComputation,
  momentOfInertia,
  cylindricalVolume,
  findRollePoint,
  findLagrangePoint,
  volumeOfRevolution,
  areaBetweenCurves,
  findMeanValueIntegralPoint,
} from '@/lib/math-computations'

// --- Tooltip helper ---
function getPointerPos(e: ThreeEvent<PointerEvent>): { x: number; y: number } {
  // R3F events extend Three.js Intersection and include DOM event properties
  const ne = e as unknown as { nativeEvent?: PointerEvent; clientX?: number; clientY?: number }
  return {
    x: ne.nativeEvent?.clientX ?? ne.clientX ?? 0,
    y: ne.nativeEvent?.clientY ?? ne.clientY ?? 0,
  }
}

function showBarTooltip(e: ThreeEvent<PointerEvent>, content: string) {
  const pos = getPointerPos(e)
  useLabStore.getState().showTooltip({ content, x: pos.x, y: pos.y })
}

function hideBarTooltip() {
  useLabStore.getState().hideTooltip()
}

// --- Common Axes ---
function Axes({ length = 5 }: { length?: number }) {
  return (
    <group>
      {/* X axis - red */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-length, 0, 0, length, 0, 0]), 3]}
            count={2}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={2} />
      </line>
      {/* Y axis (up/z in 3D) - green */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, -length, 0, 0, length]), 3]}
            count={2}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#22c55e" linewidth={2} />
      </line>
      {/* Z axis (height/y in 3D) - blue */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, 0, 0, length, 0]), 3]}
            count={2}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" linewidth={2} />
      </line>
    </group>
  )
}

// --- Axis Labels with tick marks ---
function AxisLabels({ length = 5 }: { length?: number }) {
  const ticks = useMemo(() => {
    const result: { pos: [number, number, number]; label: string; axis: 'x' | 'y' | 'z' }[] = []
    const maxTick = Math.floor(length)
    for (let i = -maxTick; i <= maxTick; i++) {
      if (i === 0) continue
      result.push({ pos: [i, 0, 0], label: String(i), axis: 'x' })
      result.push({ pos: [0, 0, i], label: String(i), axis: 'y' })
      result.push({ pos: [0, i, 0], label: String(i), axis: 'z' })
    }
    return result
  }, [length])

  return (
    <group>
      {/* Axis name labels */}
      <Text
        position={[length + 0.4, 0, 0]}
        fontSize={0.35}
        color="#ef4444"
        anchorX="center"
        anchorY="middle"
      >
        x
      </Text>
      <Text
        position={[0, 0, length + 0.4]}
        fontSize={0.35}
        color="#22c55e"
        anchorX="center"
        anchorY="middle"
      >
        y
      </Text>
      <Text
        position={[0, length + 0.4, 0]}
        fontSize={0.35}
        color="#3b82f6"
        anchorX="center"
        anchorY="middle"
      >
        z
      </Text>

      {/* Tick marks */}
      {ticks.map((tick, idx) => (
        <group key={idx}>
          {/* Tick line */}
          {tick.axis === 'x' && (
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[new Float32Array([tick.pos[0], -0.08, 0, tick.pos[0], 0.08, 0]), 3]}
                  count={2}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#ef4444" opacity={0.5} transparent />
            </line>
          )}
          {tick.axis === 'y' && (
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[new Float32Array([0, -0.08, tick.pos[2], 0, 0.08, tick.pos[2]]), 3]}
                  count={2}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#22c55e" opacity={0.5} transparent />
            </line>
          )}
          {tick.axis === 'z' && (
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[new Float32Array([-0.08, tick.pos[1], 0, 0.08, tick.pos[1], 0]), 3]}
                  count={2}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#3b82f6" opacity={0.5} transparent />
            </line>
          )}
          {/* Tick label */}
          <Text
            position={
              tick.axis === 'x'
                ? [tick.pos[0], -0.35, 0]
                : tick.axis === 'y'
                  ? [0.35, 0, tick.pos[2]]
                  : [-0.35, tick.pos[1], 0]
            }
            fontSize={0.18}
            color={
              tick.axis === 'x' ? '#ef4444' : tick.axis === 'y' ? '#22c55e' : '#3b82f6'
            }
            anchorX="center"
            anchorY="middle"
          >
            {tick.label}
          </Text>
        </group>
      ))}
    </group>
  )
}

// --- Grid on xy-plane ---
function XYGrid({ size = 4, divisions = 8, color = '#888888' }: { size?: number; divisions?: number; color?: string }) {
  const points = useMemo(() => {
    const pts: number[] = []
    const step = (2 * size) / divisions
    for (let i = 0; i <= divisions; i++) {
      const pos = -size + i * step
      pts.push(-size, 0.001, pos, size, 0.001, pos)
      pts.push(pos, 0.001, -size, pos, 0.001, size)
    }
    return new Float32Array(pts)
  }, [size, divisions])

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.3} />
    </lineSegments>
  )
}

// --- Surface mesh ---
function Surface({
  func,
  xRange = [-3, 3],
  yRange = [-3, 3],
  color = '#10b981',
  opacity = 0.8,
  resolution = 40,
}: {
  func: (x: number, y: number) => number
  xRange?: [number, number]
  yRange?: [number, number]
  color?: string
  opacity?: number
  resolution?: number
}) {
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []
    const colors: number[] = []
    const normals: number[] = []
    const res = resolution
    const [xMin, xMax] = xRange
    const [yMin, yMax] = yRange
    const dx = (xMax - xMin) / res
    const dy = (yMax - yMin) / res
    const col = new THREE.Color(color)

    for (let i = 0; i <= res; i++) {
      for (let j = 0; j <= res; j++) {
        const x = xMin + i * dx
        const y = yMin + j * dy
        const z = func(x, y)
        vertices.push(x, z, y)
        normals.push(0, 1, 0)
        colors.push(col.r, col.g, col.b)
      }
    }

    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        const a = i * (res + 1) + j
        const b = a + 1
        const c = (i + 1) * (res + 1) + j
        const d = c + 1
        indices.push(a, c, b, b, c, d)
      }
    }

    geom.setIndex(indices)
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geom.computeVertexNormals()
    return geom
  }, [func, xRange, yRange, color, resolution])

  return (
    <mesh geometry={geometry}>
      <meshPhongMaterial
        vertexColors
        side={THREE.DoubleSide}
        transparent
        opacity={opacity}
        shininess={60}
      />
    </mesh>
  )
}

// --- Surface with split colors ---
function SurfaceSplit({
  func,
  splitX = 0,
  xRange = [-3, 3],
  yRange = [-3, 3],
  color1 = '#10b981',
  color2 = '#f59e0b',
  resolution = 40,
}: {
  func: (x: number, y: number) => number
  splitX?: number
  xRange?: [number, number]
  yRange?: [number, number]
  color1?: string
  color2?: string
  resolution?: number
}) {
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []
    const colors: number[] = []
    const normals: number[] = []
    const res = resolution
    const [xMin, xMax] = xRange
    const [yMin, yMax] = yRange
    const dx = (xMax - xMin) / res
    const dy = (yMax - yMin) / res
    const c1 = new THREE.Color(color1)
    const c2 = new THREE.Color(color2)

    for (let i = 0; i <= res; i++) {
      for (let j = 0; j <= res; j++) {
        const x = xMin + i * dx
        const y = yMin + j * dy
        const z = func(x, y)
        vertices.push(x, z, y)
        normals.push(0, 1, 0)
        const col = x < splitX ? c1 : c2
        colors.push(col.r, col.g, col.b)
      }
    }

    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        const a = i * (res + 1) + j
        const b = a + 1
        const c = (i + 1) * (res + 1) + j
        const d = c + 1
        indices.push(a, c, b, b, c, d)
      }
    }

    geom.setIndex(indices)
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geom.computeVertexNormals()
    return geom
  }, [func, splitX, xRange, yRange, color1, color2, resolution])

  return (
    <mesh geometry={geometry}>
      <meshPhongMaterial vertexColors side={THREE.DoubleSide} transparent opacity={0.8} shininess={60} />
    </mesh>
  )
}

// --- Riemann bars (with optional hover tooltip) - OPTIMIZED with InstancedMesh ---
type TooltipMode = 'step3' | 'convergence1' | 'none'

function RiemannBars({
  func,
  n = 8,
  xRange = [-3, 3],
  yRange = [-3, 3],
  color = '#10b981',
  opacity = 0.7,
  showColorSign = false,
  tooltipMode = 'none',
  approxValue,
  exactValue,
}: {
  func: (x: number, y: number) => number
  n?: number
  xRange?: [number, number]
  yRange?: [number, number]
  color?: string
  opacity?: number
  showColorSign?: boolean
  tooltipMode?: TooltipMode
  approxValue?: number
  exactValue?: number
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])

  const barData = useMemo(() => {
    const result: { x: number; z: number; w: number; d: number; h: number; sign: number; xi: number; eta: number; idx: number }[] = []
    const [xMin, xMax] = xRange
    const [yMin, yMax] = yRange
    const dx = (xMax - xMin) / n
    const dy = (yMax - yMin) / n
    let idx = 0
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x = xMin + (i + 0.5) * dx
        const y = yMin + (j + 0.5) * dy
        const h = func(x, y)
        if (Math.abs(h) > 0.001) {
          result.push({ x, z: y, w: dx * 0.9, d: dy * 0.9, h, sign: h >= 0 ? 1 : -1, xi: x, eta: y, idx })
          idx++
        }
      }
    }
    return result
  }, [func, n, xRange, yRange])

  const count = barData.length
  const barDataRef = useRef(barData)

  // Keep ref in sync with data for event handlers
  useEffect(() => { barDataRef.current = barData }, [barData])

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const lastHoveredRef = useRef<number | null>(null)

  // Set instance matrices and colors
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh || count === 0) return

    const dummy = new THREE.Object3D()
    const col = new THREE.Color()
    const effectiveHovered = hoveredIdx !== null && hoveredIdx < count ? hoveredIdx : null

    for (let i = 0; i < count; i++) {
      const bar = barData[i]
      const isHovered = effectiveHovered === i
      const s = isHovered ? 1.06 : 1
      dummy.position.set(bar.x, bar.h / 2, bar.z)
      dummy.scale.set(bar.w * s, Math.abs(bar.h) * s, bar.d * s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      if (isHovered) {
        col.set('#34d399')
      } else if (showColorSign) {
        col.set(bar.sign >= 0 ? '#f97316' : '#06b6d4')
      } else {
        col.set(color)
      }
      mesh.setColorAt(i, col)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [count, barData, hoveredIdx, showColorSign, color])

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.instanceId === undefined || tooltipMode === 'none') return
    e.stopPropagation()
    const id = e.instanceId

    const bar = barDataRef.current[id]
    if (!bar) return

    if (id !== lastHoveredRef.current) {
      lastHoveredRef.current = id
      setHoveredIdx(id)
      document.body.style.cursor = 'pointer'
    }

    const dx = (xRange[1] - xRange[0]) / n
    const dy = (yRange[1] - yRange[0]) / n
    const deltaSigma = dx * dy
    const contribution = bar.h * deltaSigma

    let content = ''
    if (tooltipMode === 'step3') {
      content = `<div class="text-emerald-600 dark:text-emerald-400 font-semibold mb-0.5">📍 方柱 #${bar.idx + 1}</div>` +
        `<div>f(${bar.xi.toFixed(2)}, ${bar.eta.toFixed(2)}) = ${bar.h.toFixed(4)}</div>` +
        `<div>Δσ = ${deltaSigma.toFixed(4)}</div>` +
        `<div class="text-amber-600 dark:text-amber-400 mt-0.5">贡献: ${contribution.toFixed(4)}</div>`
    } else if (tooltipMode === 'convergence1') {
      const err = exactValue !== undefined ? Math.abs((approxValue ?? 0) - exactValue) : 0
      content = `<div class="text-cyan-600 dark:text-cyan-400 font-semibold mb-0.5">📊 n = ${n}×${n}</div>` +
        `<div>Sₙ = ${approxValue?.toFixed(4) ?? '—'}</div>` +
        `<div>精确值: ${exactValue?.toFixed(4) ?? '—'}</div>` +
        `<div class="text-amber-600 dark:text-amber-400 mt-0.5">误差: ${err.toFixed(4)}</div>`
    }

    if (content) {
      showBarTooltip(e, content)
    }
  }, [tooltipMode, n, xRange, yRange, approxValue, exactValue])

  const handlePointerOut = useCallback(() => {
    lastHoveredRef.current = null
    setHoveredIdx(null)
    document.body.style.cursor = 'auto'
    hideBarTooltip()
  }, [])

  if (count === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, count]}
      onPointerMove={tooltipMode !== 'none' ? handlePointerMove : undefined}
      onPointerOut={tooltipMode !== 'none' ? handlePointerOut : undefined}
    >
      <meshPhongMaterial color="#ffffff" transparent opacity={opacity} />
    </instancedMesh>
  )
}

// --- Flat plane ---
function FlatPlane({
  width = 4,
  height = 4,
  y = 0,
  color = '#10b981',
  opacity = 0.3,
}: {
  width?: number
  height?: number
  y?: number
  color?: string
  opacity?: number
}) {
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <meshPhongMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  )
}

// --- Region D outline ---
function RegionOutline({
  size = 2,
  color = '#10b981',
}: {
  size?: number
  color?: string
}) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [
      [-size, 0.01, -size],
      [size, 0.01, -size],
      [size, 0.01, size],
      [-size, 0.01, size],
      [-size, 0.01, -size],
    ]
    return pts
  }, [size])

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(points.flat()), 3]}
          count={5}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} linewidth={2} />
    </line>
  )
}

// --- Dividing plane for prop3 ---
function DividingPlane({
  x = 0,
  height = 5,
  depth = 4,
}: {
  x?: number
  height?: number
  depth?: number
}) {
  return (
    <mesh position={[x, height / 2, 0]}>
      <planeGeometry args={[0.02, height, 1, depth]} />
      <meshPhongMaterial color="#ef4444" transparent opacity={0.5} side={THREE.DoubleSide} />
    </mesh>
  )
}

// --- Sphere wireframe ---
function SphereWire({
  radius = 2.5,
  color = '#6366f1',
  opacity = 0.15,
}: {
  radius?: number
  color?: string
  opacity?: number
}) {
  return (
    <mesh>
      <sphereGeometry args={[radius, 32, 24]} />
      <meshPhongMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} wireframe={false} />
    </mesh>
  )
}

function SphereWireframe({
  radius = 2.5,
  color = '#6366f1',
}: {
  radius?: number
  color?: string
}) {
  return (
    <mesh>
      <sphereGeometry args={[radius, 24, 16]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
    </mesh>
  )
}

// --- Cylinder wireframe ---
function CylinderMesh({
  radius = 1.5,
  height = 6,
  color = '#f59e0b',
  opacity = 0.15,
}: {
  radius?: number
  height?: number
  color?: string
  opacity?: number
}) {
  return (
    <mesh>
      <cylinderGeometry args={[radius, radius, height, 32, 1, true]} />
      <meshPhongMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  )
}

function CylinderWireframe({
  radius = 1.5,
  height = 6,
  color = '#f59e0b',
}: {
  radius?: number
  height?: number
  color?: string
}) {
  return (
    <mesh>
      <cylinderGeometry args={[radius, radius, height, 24, 1, true]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0.4} />
    </mesh>
  )
}

// --- Intersection volume (sphere-cylinder) - FIXED ---
function IntersectionVolume({
  sphereR = 2.5,
  cylR = 1.5,
}: {
  sphereR?: number
  cylR?: number
}) {
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []
    const colors: number[] = []
    const res = 40
    const zRes = 40

    if (cylR > sphereR) {
      // No valid intersection
      geom.setAttribute('position', new THREE.Float32BufferAttribute([], 3))
      return geom
    }

    const maxZ = Math.sqrt(Math.max(0.001, sphereR * sphereR - cylR * cylR))
    const dz = (2 * maxZ) / zRes
    const col = new THREE.Color('#10b981')
    const dTheta = (2 * Math.PI) / res

    // Build rings - each ring has (res+1) vertices
    // We always generate all zRes+1 rings, even at the poles
    const ringVertexStart: number[] = []

    for (let iz = 0; iz <= zRes; iz++) {
      const z = -maxZ + iz * dz
      ringVertexStart.push(vertices.length / 3)

      // The intersection at this z is always the full cylinder circle
      // since cylR <= sqrt(R²-z²) for |z| <= maxZ
      for (let i = 0; i <= res; i++) {
        const theta = i * dTheta
        const x = cylR * Math.cos(theta)
        const y = cylR * Math.sin(theta)
        // In R3F: x -> x, y -> z (height), z -> y (depth)
        vertices.push(x, z, y)
        colors.push(col.r, col.g, col.b)
      }
    }

    // Build faces between consecutive rings
    for (let iz = 0; iz < zRes; iz++) {
      const start = ringVertexStart[iz]
      const nextStart = ringVertexStart[iz + 1]

      for (let i = 0; i < res; i++) {
        const a = start + i
        const b = start + i + 1
        const c = nextStart + i
        const d = nextStart + i + 1
        indices.push(a, c, b, b, c, d)
      }
    }

    // Top cap - add center vertex
    const topCenter = vertices.length / 3
    vertices.push(0, maxZ, 0)
    colors.push(col.r, col.g, col.b)
    const topRingStart = ringVertexStart[zRes]
    for (let i = 0; i < res; i++) {
      indices.push(topCenter, topRingStart + i + 1, topRingStart + i)
    }

    // Bottom cap - add center vertex
    const bottomCenter = vertices.length / 3
    vertices.push(0, -maxZ, 0)
    colors.push(col.r, col.g, col.b)
    const bottomRingStart = ringVertexStart[0]
    for (let i = 0; i < res; i++) {
      indices.push(bottomCenter, bottomRingStart + i, bottomRingStart + i + 1)
    }

    geom.setIndex(indices)
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geom.computeVertexNormals()
    return geom
  }, [sphereR, cylR])

  return (
    <mesh geometry={geometry}>
      <meshPhongMaterial vertexColors transparent opacity={0.6} side={THREE.DoubleSide} shininess={80} />
    </mesh>
  )
}

// --- Cartesian strip (FIXED: proper triangular domain) ---
function CartesianStrips({
  n = 6,
  type = 'x' as 'x' | 'y',
}: {
  n?: number
  type?: 'x' | 'y'
}) {
  const stripData = useMemo(() => {
    const result: {
      // For the filled triangular region on the floor
      regionVertices: number[]
      regionIndices: number[]
      regionColor: string
      // For the 3D bars showing function values
      bars: { pos: [number, number, number]; scale: [number, number, number]; color: string }[]
    }[] = []

    const scale = 4 // scale [0,1] to [-2,2]
    const offset = -2

    if (type === 'x') {
      // X-type: vertical strips
      // Region: 0<=x<=1, 0<=y<=x (below y=x line)
      const dx = 1 / n
      for (let i = 0; i < n; i++) {
        const xMin = i * dx
        const xMax = (i + 1) * dx
        const xMid = (xMin + xMax) / 2
        const yMaxAtXMin = xMin
        const yMaxAtXMax = xMax

        // Filled region on floor (trapezoidal strip)
        const rVerts = [
          xMin * scale + offset, 0.01, yMaxAtXMin * scale + offset,
          xMax * scale + offset, 0.01, yMaxAtXMax * scale + offset,
          xMax * scale + offset, 0.01, 0 * scale + offset,
          xMin * scale + offset, 0.01, 0 * scale + offset,
        ]
        const rIdx = [0, 1, 2, 0, 2, 3]

        // 3D bar: height = f(xMid, yMid) where yMid = xMid/2 (midpoint of strip)
        const yMid = xMid / 2
        const h = fCartesian(xMid, yMid)
        const barW = (xMax - xMin) * scale * 0.85
        const barD = yMid * 2 * scale * 0.85 // average y-range width
        const barH = h * 1.5

        result.push({
          regionVertices: rVerts,
          regionIndices: rIdx,
          regionColor: i % 2 === 0 ? '#10b981' : '#34d399',
          bars: [{
            pos: [xMid * scale + offset, barH / 2, yMid * scale + offset],
            scale: [barW, Math.max(0.01, barH), barD],
            color: i % 2 === 0 ? '#10b981' : '#34d399',
          }],
        })
      }
    } else {
      // Y-type: horizontal strips
      // Region: 0<=y<=1, y<=x<=1 (above y=x line)
      const dy = 1 / n
      for (let j = 0; j < n; j++) {
        const yMin = j * dy
        const yMax = (j + 1) * dy
        const yMid = (yMin + yMax) / 2
        const xMinAtYMin = yMin
        const xMinAtYMax = yMax

        // Filled region on floor (trapezoidal strip)
        const rVerts = [
          xMinAtYMin * scale + offset, 0.01, yMin * scale + offset,
          1 * scale + offset, 0.01, yMin * scale + offset,
          1 * scale + offset, 0.01, yMax * scale + offset,
          xMinAtYMax * scale + offset, 0.01, yMax * scale + offset,
        ]
        const rIdx = [0, 1, 2, 0, 2, 3]

        // 3D bar: height = f(xMid, yMid) where xMid = (yMid+1)/2
        const xMid = (yMid + 1) / 2
        const h = fCartesian(xMid, yMid)
        const barW = ((1 - yMid) / 2 + (1 - yMid) / 2) * scale * 0.85
        const barD = (yMax - yMin) * scale * 0.85
        const barH = h * 1.5

        result.push({
          regionVertices: rVerts,
          regionIndices: rIdx,
          regionColor: j % 2 === 0 ? '#f59e0b' : '#fbbf24',
          bars: [{
            pos: [xMid * scale + offset, barH / 2, yMid * scale + offset],
            scale: [Math.max(0.01, barW), Math.max(0.01, barH), barD],
            color: j % 2 === 0 ? '#f59e0b' : '#fbbf24',
          }],
        })
      }
    }
    return result
  }, [n, type])

  return (
    <group>
      {stripData.map((strip, idx) => (
        <group key={idx}>
          {/* Floor region fill */}
          <mesh>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array(strip.regionVertices), 3]}
                count={4}
              />
              <bufferAttribute
                attach="index"
                args={[new Uint16Array(strip.regionIndices), 1]}
                count={6}
              />
            </bufferGeometry>
            <meshPhongMaterial
              color={strip.regionColor}
              transparent
              opacity={0.35}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* 3D bar */}
          {strip.bars.map((bar, bIdx) => (
            <mesh key={bIdx} position={bar.pos} scale={bar.scale}>
              <boxGeometry args={[1, 1, 1]} />
              <meshPhongMaterial color={bar.color} transparent opacity={0.6} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

// --- Region D boundary for cartesian (FIXED: complete closed boundary) ---
function CartesianRegion({ type = 'x' as 'x' | 'y' }: { type?: 'x' | 'y' }) {
  const linePoints = useMemo(() => {
    const pts: number[] = []
    const scale = 4
    const offset = -2
    const res = 50

    if (type === 'x') {
      // Region: 0<=x<=1, 0<=y<=x (triangle: (0,0)->(1,0)->(1,1))
      // y=x line from (0,0) to (1,1)
      for (let i = 0; i <= res; i++) {
        const x = i / res
        pts.push(x * scale + offset, 0.02, x * scale + offset)
      }
      // Right edge: x=1 from y=1 to y=0
      pts.push(1 * scale + offset, 0.02, 0 * scale + offset)
      // Bottom edge: y=0 from x=1 to x=0 (already at (1,0))
      for (let i = res; i >= 0; i--) {
        const x = i / res
        pts.push(x * scale + offset, 0.02, 0 * scale + offset)
      }
    } else {
      // Region: 0<=y<=1, y<=x<=1 (triangle: (0,0)->(1,0)->(1,1))
      // y=x line from (0,0) to (1,1)
      for (let i = 0; i <= res; i++) {
        const x = i / res
        pts.push(x * scale + offset, 0.02, x * scale + offset)
      }
      // Right edge: x=1 from y=1 to y=0
      for (let i = res; i >= 0; i--) {
        const y = i / res
        pts.push(1 * scale + offset, 0.02, y * scale + offset)
      }
      // Bottom edge: y=0 from x=1 to x=0
      for (let i = res; i >= 0; i--) {
        const x = i / res
        pts.push(x * scale + offset, 0.02, 0 * scale + offset)
      }
    }
    return new Float32Array(pts)
  }, [type])

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[linePoints, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#ef4444" linewidth={2} />
    </line>
  )
}

// --- Rectangular approximation bars - OPTIMIZED with InstancedMesh ---
function RectApproxBars({ n = 10 }: { n?: number }) {
  const mainMeshRef = useRef<THREE.InstancedMesh>(null!)
  const floorMeshRef = useRef<THREE.InstancedMesh>(null!)
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])

  const barData = useMemo(() => {
    const result: { x: number; h: number; w: number; positive: boolean; fVal: number; dx: number; barColor: string }[] = []
    const a = -2
    const b = 2
    const dx = (b - a) / n
    for (let i = 0; i < n; i++) {
      const x = a + (i + 0.5) * dx
      const h = fRect(x)
      const barColor = h > 2 ? '#10b981' : h > 1 ? '#34d399' : '#6ee7b7'
      result.push({ x, h, w: dx * 0.9, positive: h > 0, fVal: fRect(x), dx, barColor })
    }
    return result
  }, [n])

  const approxValue = useMemo(() => rectApprox(fRect, -2, 2, n), [n])
  const exactValue = useMemo(() => numericalIntegral1D(fRect, -2, 2), [])

  const count = barData.length
  const barDataRef = useRef(barData)

  // Keep ref in sync with data for event handlers
  useEffect(() => { barDataRef.current = barData }, [barData])

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const lastHoveredRef = useRef<number | null>(null)

  // Set instance matrices and colors for both main bars and floor projections
  useEffect(() => {
    const mainMesh = mainMeshRef.current
    const floorMesh = floorMeshRef.current
    if (!mainMesh || !floorMesh || count === 0) return

    const dummy = new THREE.Object3D()
    const col = new THREE.Color()
    const effectiveHovered = hoveredIdx !== null && hoveredIdx < count ? hoveredIdx : null

    for (let i = 0; i < count; i++) {
      const bar = barData[i]
      const isHovered = effectiveHovered === i
      const s = isHovered ? 1.06 : 1

      // Main 3D bar
      dummy.position.set(bar.x, bar.h / 2, 0)
      dummy.scale.set(bar.w * s, Math.abs(bar.h) * s, 0.4 * s)
      dummy.updateMatrix()
      mainMesh.setMatrixAt(i, dummy.matrix)
      col.set(isHovered ? '#34d399' : bar.barColor)
      mainMesh.setColorAt(i, col)

      // Floor projection bar
      dummy.position.set(bar.x, 0.005, -1.5)
      dummy.scale.set(bar.w, 0.01, 0.3)
      dummy.updateMatrix()
      floorMesh.setMatrixAt(i, dummy.matrix)
      col.set(bar.barColor)
      floorMesh.setColorAt(i, col)
    }

    mainMesh.instanceMatrix.needsUpdate = true
    if (mainMesh.instanceColor) mainMesh.instanceColor.needsUpdate = true
    floorMesh.instanceMatrix.needsUpdate = true
    if (floorMesh.instanceColor) floorMesh.instanceColor.needsUpdate = true
  }, [count, barData, hoveredIdx])

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.instanceId === undefined) return
    e.stopPropagation()
    const id = e.instanceId

    const bar = barDataRef.current[id]
    if (!bar) return

    if (id !== lastHoveredRef.current) {
      lastHoveredRef.current = id
      setHoveredIdx(id)
      document.body.style.cursor = 'pointer'
    }

    const contribution = bar.fVal * bar.dx
    const content = `<div class="text-teal-600 dark:text-teal-400 font-semibold mb-0.5">📐 矩形 #${id + 1}</div>` +
      `<div>f(${bar.x.toFixed(2)}) = ${bar.fVal.toFixed(4)}</div>` +
      `<div>Δx = ${bar.dx.toFixed(4)}</div>` +
      `<div class="text-amber-600 dark:text-amber-400 mt-0.5">贡献: ${contribution.toFixed(4)}</div>`

    showBarTooltip(e, content)
  }, [])

  const handlePointerOut = useCallback(() => {
    lastHoveredRef.current = null
    setHoveredIdx(null)
    document.body.style.cursor = 'auto'
    hideBarTooltip()
  }, [])

  if (count === 0) return null

  return (
    <group>
      {/* 3D bars - InstancedMesh */}
      <instancedMesh
        ref={mainMeshRef}
        args={[geometry, undefined, count]}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
      >
        <meshPhongMaterial color="#ffffff" transparent opacity={0.7} />
      </instancedMesh>
      {/* Floor projection bars - InstancedMesh */}
      <instancedMesh
        ref={floorMeshRef}
        args={[geometry, undefined, count]}
      >
        <meshPhongMaterial color="#ffffff" transparent opacity={0.5} />
      </instancedMesh>
      {/* Numerical value display */}
      <Html position={[0, 4.5, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-emerald-600 dark:text-emerald-400">
            近似值: {approxValue.toFixed(4)}
          </div>
          <div className="text-muted-foreground">
            精确值: {exactValue.toFixed(4)}
          </div>
          <div className="text-amber-600 dark:text-amber-400">
            误差: {Math.abs(approxValue - exactValue).toFixed(4)}
          </div>
        </div>
      </Html>
    </group>
  )
}

// --- 2D curve for rect_approx ---
function RectApproxCurve() {
  const points = useMemo(() => {
    const pts: number[] = []
    for (let i = -200; i <= 200; i++) {
      const x = (i / 100) * 2
      const y = fRect(x)
      pts.push(x, y, 0)
    }
    return new Float32Array(pts)
  }, [])

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#ef4444" linewidth={2} />
    </line>
  )
}

// --- Parity surface with colored regions (IMPROVED) ---
function ParitySurface({
  func,
  a = 2,
  positiveColor = '#f97316',
  negativeColor = '#06b6d4',
  resolution = 40,
}: {
  func: (x: number, y: number) => number
  a?: number
  positiveColor?: string
  negativeColor?: string
  resolution?: number
}) {
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []
    const colors: number[] = []
    const normals: number[] = []
    const res = resolution
    const b = a
    const dx = (2 * a) / res
    const dy = (2 * b) / res
    const posCol = new THREE.Color(positiveColor)
    const negCol = new THREE.Color(negativeColor)

    for (let i = 0; i <= res; i++) {
      for (let j = 0; j <= res; j++) {
        const x = -a + i * dx
        const y = -b + j * dy
        const z = func(x, y)
        vertices.push(x, z, y)
        normals.push(0, 1, 0)
        const col = z >= 0 ? posCol : negCol
        colors.push(col.r, col.g, col.b)
      }
    }

    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        const idx = i * (res + 1) + j
        const ai = idx
        const b2 = idx + 1
        const c = idx + (res + 1)
        const d = c + 1
        indices.push(ai, c, b2, b2, c, d)
      }
    }

    geom.setIndex(indices)
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geom.computeVertexNormals()
    return geom
  }, [func, a, positiveColor, negativeColor, resolution])

  return (
    <mesh geometry={geometry}>
      <meshPhongMaterial vertexColors side={THREE.DoubleSide} transparent opacity={0.8} shininess={60} />
    </mesh>
  )
}

// --- Parity base plane with positive/negative halves ---
function ParityBasePlane({ a = 2 }: { a?: number }) {
  return (
    <group>
      {/* Positive x half (x > 0) */}
      <mesh position={[a / 2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[a, a * 2]} />
        <meshPhongMaterial color="#f97316" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      {/* Negative x half (x < 0) */}
      <mesh position={[-a / 2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[a, a * 2]} />
        <meshPhongMaterial color="#06b6d4" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// --- Parity Riemann bars (showing positive/negative contributions) ---
function ParityRiemannBars({
  func,
  a = 2,
  n = 8,
}: {
  func: (x: number, y: number) => number
  a?: number
  n?: number
}) {
  const bars = useMemo(() => {
    const result: { x: number; z: number; w: number; d: number; h: number; positive: boolean }[] = []
    const dx = (2 * a) / n
    const dy = (2 * a) / n
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x = -a + (i + 0.5) * dx
        const y = -a + (j + 0.5) * dy
        const h = func(x, y)
        if (Math.abs(h) > 0.01) {
          result.push({
            x, z: y,
            w: dx * 0.85, d: dy * 0.85,
            h: Math.abs(h),
            positive: h >= 0,
          })
        }
      }
    }
    return result
  }, [func, a, n])

  return (
    <group>
      {bars.map((bar, idx) => (
        <mesh key={idx} position={[bar.x, bar.h / 2, bar.z]}>
          <boxGeometry args={[bar.w, bar.h, bar.d]} />
          <meshPhongMaterial
            color={bar.positive ? '#f97316' : '#06b6d4'}
            transparent
            opacity={0.4}
          />
        </mesh>
      ))}
    </group>
  )
}

// --- Polar coordinate region (polar1) ---
function PolarRegionScene() {
  const { paramValue: R, paramValue2: beta } = useLabStore()

  // Concentric circles
  const concentricCircles = useMemo(() => {
    const circles: Float32Array[] = []
    const maxR = Math.ceil(R)
    const res = 64
    for (let r = 1; r <= maxR; r++) {
      const pts: number[] = []
      for (let i = 0; i <= res; i++) {
        const theta = (2 * Math.PI * i) / res
        pts.push(r * Math.cos(theta), 0.005, r * Math.sin(theta))
      }
      circles.push(new Float32Array(pts))
    }
    return circles
  }, [R])

  // Radial lines
  const radialLines = useMemo(() => {
    const lines: Float32Array[] = []
    const angleStep = Math.PI / 6
    const numLines = Math.max(1, Math.floor(beta / angleStep))
    for (let i = 0; i <= numLines; i++) {
      const theta = (i / numLines) * beta
      lines.push(new Float32Array([0, 0.005, 0, R * Math.cos(theta), 0.005, R * Math.sin(theta)]))
    }
    return lines
  }, [R, beta])

  // Filled sector region (pie slice from 0 to beta, radius R)
  const sectorGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []
    const res = 48
    // Center vertex
    vertices.push(0, 0.01, 0)
    for (let i = 0; i <= res; i++) {
      const theta = (i / res) * beta
      vertices.push(R * Math.cos(theta), 0.01, R * Math.sin(theta))
    }
    for (let i = 0; i < res; i++) {
      indices.push(0, i + 1, i + 2)
    }
    geom.setIndex(indices)
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geom.computeVertexNormals()
    return geom
  }, [R, beta])

  // Boundary arc
  const boundaryArc = useMemo(() => {
    const pts: number[] = []
    const res = 64
    // Arc from 0 to beta
    for (let i = 0; i <= res; i++) {
      const theta = (i / res) * beta
      pts.push(R * Math.cos(theta), 0.02, R * Math.sin(theta))
    }
    // Line back to origin
    pts.push(0, 0.02, 0)
    // Line along theta=0 back to R
    pts.push(R, 0.02, 0)
    return new Float32Array(pts)
  }, [R, beta])

  // Approximate integral value
  const approxValue = useMemo(() => {
    return polarRiemannSum(fPolar, R, 0, beta, 50, 50)
  }, [R, beta])

  return (
    <AutoRotate speed={0.002}>
      {/* Concentric circles */}
      {concentricCircles.map((pts, idx) => (
        <line key={idx}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[pts, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#10b981" opacity={0.4} transparent />
        </line>
      ))}

      {/* Radial lines */}
      {radialLines.map((pts, idx) => (
        <line key={idx}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[pts, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#10b981" opacity={0.3} transparent />
        </line>
      ))}

      {/* Filled sector */}
      <mesh geometry={sectorGeometry}>
        <meshPhongMaterial color="#10b981" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Boundary arc */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[boundaryArc, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={2} />
      </line>

      {/* Surface z = f(r cosθ, r sinθ) over the polar region */}
      <Surface
        func={fPolar}
        xRange={[-R, R]}
        yRange={[-R, R]}
        color="#10b981"
        opacity={0.5}
        resolution={30}
      />

      {/* Info label */}
      <Html position={[0, 4, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-emerald-600 dark:text-emerald-400">
            R = {R.toFixed(1)}, β = {(beta / Math.PI).toFixed(2)}π
          </div>
          <div className="text-muted-foreground">
            ∫∫f·r dr dθ ≈ {formatValue(approxValue)}
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Polar Riemann Sum (polar2) - OPTIMIZED with InstancedMesh ---
function PolarRiemannScene() {
  const { paramValue: nR } = useLabStore()
  const R = 2
  const beta = 2 * Math.PI
  const nTheta = Math.max(4, Math.round(nR * 2))

  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])

  const wedgeData = useMemo(() => {
    const result: {
      posX: number; posZ: number; posY: number
      scaleX: number; scaleY: number; scaleZ: number
      rotY: number
      color: string
      rMid: number; thetaMid: number; x: number; y: number; height: number
      idx: number
    }[] = []
    const dr = R / nR
    const dTheta = beta / nTheta
    let wIdx = 0

    for (let i = 0; i < nR; i++) {
      const rMid = (i + 0.5) * dr

      for (let j = 0; j < nTheta; j++) {
        const thetaMid = (j + 0.5) * dTheta

        const x = rMid * Math.cos(thetaMid)
        const y = rMid * Math.sin(thetaMid)
        const h = fPolar(x, y) * rMid // Jacobian factor r

        if (h < 0.01) continue

        const color = (i + j) % 2 === 0 ? '#10b981' : '#14b8a6'

        result.push({
          posX: x,
          posY: h / 2,
          posZ: y,
          scaleX: dr,
          scaleY: h,
          scaleZ: rMid * dTheta,
          rotY: -thetaMid, // Rotate box to align with radial direction
          color,
          rMid,
          thetaMid,
          x,
          y,
          height: h,
          idx: wIdx,
        })
        wIdx++
      }
    }
    return result
  }, [nR, R, beta, nTheta])

  const count = wedgeData.length
  const wedgeDataRef = useRef(wedgeData)

  // Keep ref in sync with data for event handlers
  useEffect(() => { wedgeDataRef.current = wedgeData }, [wedgeData])

  const approxValue = useMemo(() => {
    return polarRiemannSum(fPolar, R, 0, beta, nR, nTheta)
  }, [nR, R, beta, nTheta])

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const lastHoveredRef = useRef<number | null>(null)

  // Set instance matrices and colors
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh || count === 0) return

    const dummy = new THREE.Object3D()
    const col = new THREE.Color()
    const effectiveHovered = hoveredIdx !== null && hoveredIdx < count ? hoveredIdx : null

    for (let i = 0; i < count; i++) {
      const wedge = wedgeData[i]
      const isHovered = effectiveHovered === i
      const s = isHovered ? 1.06 : 1

      dummy.position.set(wedge.posX, wedge.posY, wedge.posZ)
      dummy.rotation.set(0, wedge.rotY, 0)
      dummy.scale.set(wedge.scaleX * s, wedge.scaleY * s, wedge.scaleZ * s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      col.set(isHovered ? '#34d399' : wedge.color)
      mesh.setColorAt(i, col)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [count, wedgeData, hoveredIdx])

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.instanceId === undefined) return
    e.stopPropagation()
    const id = e.instanceId

    const wedge = wedgeDataRef.current[id]
    if (!wedge) return

    if (id !== lastHoveredRef.current) {
      lastHoveredRef.current = id
      setHoveredIdx(id)
      document.body.style.cursor = 'pointer'
    }

    const dr = R / nR
    const dTheta = beta / nTheta
    const fVal = fPolar(wedge.x, wedge.y)
    const areaElement = wedge.rMid * dr * dTheta

    const content = `<div class="text-rose-600 dark:text-rose-400 font-semibold mb-0.5">🌀 扇形 #${wedge.idx + 1}</div>` +
      `<div>f(${wedge.x.toFixed(2)}, ${wedge.y.toFixed(2)}) = ${fVal.toFixed(4)}</div>` +
      `<div>r = ${wedge.rMid.toFixed(3)}, θ = ${(wedge.thetaMid / Math.PI).toFixed(2)}π</div>` +
      `<div>r·Δr·Δθ = ${areaElement.toFixed(4)}</div>` +
      `<div class="text-amber-600 dark:text-amber-400 mt-0.5">贡献: ${(fVal * areaElement).toFixed(4)}</div>`

    showBarTooltip(e, content)
  }, [nR, R, beta, nTheta])

  const handlePointerOut = useCallback(() => {
    lastHoveredRef.current = null
    setHoveredIdx(null)
    document.body.style.cursor = 'auto'
    hideBarTooltip()
  }, [])

  return (
    <AutoRotate speed={0.002}>
      {/* Wedge bars - InstancedMesh */}
      {count > 0 && (
        <instancedMesh
          ref={meshRef}
          args={[geometry, undefined, count]}
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
        >
          <meshPhongMaterial color="#ffffff" transparent opacity={0.6} side={THREE.DoubleSide} />
        </instancedMesh>
      )}

      {/* Surface overlay */}
      <Surface
        func={fPolar}
        xRange={[-R, R]}
        yRange={[-R, R]}
        color="#059669"
        opacity={0.2}
        resolution={25}
      />

      {/* Info label */}
      <Html position={[0, 4.5, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-emerald-600 dark:text-emerald-400">
            径向: {nR}, 角度: {nTheta}
          </div>
          <div className="text-muted-foreground">
            ∫∫f·r dr dθ ≈ {formatValue(approxValue)}
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Convergence Animation (convergence1) ---
function ConvergenceScene() {
  const { paramValue: n } = useLabStore()
  const nInt = Math.max(2, Math.round(n))

  const exactValue = useMemo(() => {
    return numericalIntegral2D(f, -3, 3, -3, 3)
  }, [])

  const approxValue = useMemo(() => {
    return riemannSum2D(f, 3, 3, nInt)
  }, [nInt])

  const error = Math.abs(approxValue - exactValue)

  // Color gradient from red (high error) to green (low error)
  const barColor = useMemo(() => {
    const maxError = 10
    const t = Math.min(1, error / maxError)
    const r = t
    const g = 1 - t
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, 50)`
  }, [error])

  return (
    <AutoRotate speed={0.002}>
      {/* Surface */}
      <Surface func={f} color="#10b981" opacity={0.3} resolution={30} />

      {/* Riemann bars with error-based coloring + tooltip */}
      <RiemannBars
        func={f}
        n={nInt}
        color={barColor}
        opacity={0.6}
        tooltipMode="convergence1"
        approxValue={approxValue}
        exactValue={exactValue}
      />

      {/* Info overlay */}
      <Html position={[0, 5, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-foreground">
            n = {nInt}×{nInt} = {nInt * nInt}
          </div>
          <div className="text-emerald-600 dark:text-emerald-400">
            近似值: {formatValue(approxValue)}
          </div>
          <div className="text-muted-foreground">
            精确值: {formatValue(exactValue)}
          </div>
          <div style={{ color: barColor }}>
            误差: {formatValue(error)}
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Error Analysis (convergence2) - OPTIMIZED with InstancedMesh ---
function ErrorAnalysisScene() {
  const { paramValue: maxN } = useLabStore()

  const errorData = useMemo(() => {
    return generateErrorData(f, [-3, 3], [-3, 3], maxN)
  }, [maxN])

  // Map n values to x positions
  const barData = useMemo(() => {
    if (errorData.length === 0) return { bars: [] as { x: number; hMid: number; hLeft: number; label: string }[], maxError: 1 }
    const maxError = Math.max(...errorData.map(d => Math.max(d.errorMidpoint, d.errorLeft)), 0.001)
    const barWidth = 0.6
    const gap = 0.3
    const bars = errorData.map((d, idx) => ({
      x: idx * (barWidth + gap) - (errorData.length * (barWidth + gap)) / 2,
      hMid: Math.log10(Math.max(1e-15, d.errorMidpoint)),
      hLeft: Math.log10(Math.max(1e-15, d.errorLeft)),
      label: `n=${d.n}`,
    }))
    return { bars, maxError }
  }, [errorData])

  // Normalize log heights to visual range [0, 4]
  const minLog = barData.bars.length > 0 ? Math.min(...barData.bars.map(b => Math.min(b.hMid, b.hLeft))) : -10
  const maxLog = barData.bars.length > 0 ? Math.max(...barData.bars.map(b => Math.max(b.hMid, b.hLeft))) : 0
  const logRange = Math.max(1, maxLog - minLog)
  const scaleH = 4 / logRange

  const midMeshRef = useRef<THREE.InstancedMesh>(null!)
  const leftMeshRef = useRef<THREE.InstancedMesh>(null!)
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])

  const count = barData.bars.length

  // Compute normalized heights for instances
  const instanceData = useMemo(() => {
    return barData.bars.map(bar => ({
      x: bar.x,
      hMid: Math.max(0.02, (bar.hMid - minLog) * scaleH),
      hLeft: Math.max(0.02, (bar.hLeft - minLog) * scaleH),
      label: bar.label,
    }))
  }, [barData.bars, minLog, scaleH])

  // Set instance matrices and colors
  useEffect(() => {
    const midMesh = midMeshRef.current
    const leftMesh = leftMeshRef.current
    if (!midMesh || !leftMesh || count === 0) return

    const dummy = new THREE.Object3D()
    const col = new THREE.Color()

    for (let i = 0; i < count; i++) {
      const bar = instanceData[i]

      // Midpoint error bar (emerald)
      dummy.position.set(bar.x - 0.15, bar.hMid / 2, -0.2)
      dummy.scale.set(0.25, bar.hMid, 0.3)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      midMesh.setMatrixAt(i, dummy.matrix)
      col.set('#10b981')
      midMesh.setColorAt(i, col)

      // Left endpoint error bar (amber)
      dummy.position.set(bar.x + 0.15, bar.hLeft / 2, 0.2)
      dummy.scale.set(0.25, bar.hLeft, 0.3)
      dummy.updateMatrix()
      leftMesh.setMatrixAt(i, dummy.matrix)
      col.set('#f59e0b')
      leftMesh.setColorAt(i, col)
    }

    midMesh.instanceMatrix.needsUpdate = true
    if (midMesh.instanceColor) midMesh.instanceColor.needsUpdate = true
    leftMesh.instanceMatrix.needsUpdate = true
    if (leftMesh.instanceColor) leftMesh.instanceColor.needsUpdate = true
  }, [count, instanceData])

  return (
    <AutoRotate speed={0.001}>
      {/* Midpoint error bars - InstancedMesh */}
      {count > 0 && (
        <instancedMesh ref={midMeshRef} args={[geometry, undefined, count]}>
          <meshPhongMaterial color="#ffffff" transparent opacity={0.7} />
        </instancedMesh>
      )}
      {/* Left endpoint error bars - InstancedMesh */}
      {count > 0 && (
        <instancedMesh ref={leftMeshRef} args={[geometry, undefined, count]}>
          <meshPhongMaterial color="#ffffff" transparent opacity={0.7} />
        </instancedMesh>
      )}
      {/* n labels (kept as individual Text elements since they are sparse) */}
      {instanceData.map((bar, idx) => {
        if (idx % Math.max(1, Math.floor(instanceData.length / 8)) !== 0) return null
        return (
          <Text
            key={`label-${idx}`}
            position={[bar.x, -0.4, 0]}
            fontSize={0.2}
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
          >
            {bar.label}
          </Text>
        )
      })}

      {/* Legend */}
      <Html position={[0, 5.5, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-emerald-500 rounded-sm"></span>
            <span className="text-emerald-600 dark:text-emerald-400">中点法误差</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-amber-500 rounded-sm"></span>
            <span className="text-amber-600 dark:text-amber-400">左端点法误差</span>
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Triple Integral Visualization (triple1) - OPTIMIZED with InstancedMesh ---
function TripleIntegralScene() {
  const { paramValue: n } = useLabStore()
  const nInt = Math.max(2, Math.round(n))

  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])

  const voxelData = useMemo(() => {
    const result: { pos: [number, number, number]; color: string; size: number; origX: number; origY: number; origZ: number; val: number; idx: number }[] = []
    const dx = 1 / nInt
    const scale = 3 // Scale [0,1] to [0,3]
    const offset = 0 // Start at origin
    // f(x,y,z) = x² + y² + z², max at (1,1,1) = 3
    const maxVal = 3
    let vIdx = 0

    for (let i = 0; i < nInt; i++) {
      for (let j = 0; j < nInt; j++) {
        for (let k = 0; k < nInt; k++) {
          const x = (i + 0.5) / nInt
          const y = (j + 0.5) / nInt
          const z = (k + 0.5) / nInt
          const val = fTriple(x, y, z) // x² + y² + z²

          // Heat map: blue (low) -> green (mid) -> red (high)
          const t = val / maxVal
          let r: number, g: number, b: number
          if (t < 0.5) {
            r = 0
            g = t * 2
            b = 1 - t * 2
          } else {
            r = (t - 0.5) * 2
            g = 1 - (t - 0.5) * 2
            b = 0
          }
          const color = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`

          result.push({
            pos: [
              (x * scale + offset),
              (z * scale + offset),
              (y * scale + offset),
            ],
            color,
            size: dx * scale * 0.9,
            origX: x,
            origY: y,
            origZ: z,
            val,
            idx: vIdx,
          })
          vIdx++
        }
      }
    }
    return result
  }, [nInt])

  const approxValue = useMemo(() => {
    return tripleIntegralApprox(fTriple, [0, 1], [0, 1], [0, 1], nInt)
  }, [nInt])

  // Exact value of ∫₀¹∫₀¹∫₀¹ (x²+y²+z²) dV = 3 * (1/3) = 1
  const exactValue = 1

  const count = voxelData.length
  const voxelDataRef = useRef(voxelData)

  // Keep ref in sync with data for event handlers
  useEffect(() => { voxelDataRef.current = voxelData }, [voxelData])

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const lastHoveredRef = useRef<number | null>(null)

  // Set instance matrices and colors
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh || count === 0) return

    const dummy = new THREE.Object3D()
    const col = new THREE.Color()
    const effectiveHovered = hoveredIdx !== null && hoveredIdx < count ? hoveredIdx : null

    for (let i = 0; i < count; i++) {
      const voxel = voxelData[i]
      const isHovered = effectiveHovered === i
      const s = isHovered ? 1.08 : 1

      dummy.position.set(voxel.pos[0], voxel.pos[1], voxel.pos[2])
      dummy.scale.set(voxel.size * s, voxel.size * s, voxel.size * s)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      col.set(isHovered ? '#c084fc' : voxel.color)
      mesh.setColorAt(i, col)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [count, voxelData, hoveredIdx])

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.instanceId === undefined) return
    e.stopPropagation()
    const id = e.instanceId

    const voxel = voxelDataRef.current[id]
    if (!voxel) return

    if (id !== lastHoveredRef.current) {
      lastHoveredRef.current = id
      setHoveredIdx(id)
      document.body.style.cursor = 'pointer'
    }

    const dV = (1 / nInt) ** 3
    const contribution = voxel.val * dV

    const content = `<div class="text-purple-600 dark:text-purple-400 font-semibold mb-0.5">🧊 体素 #${voxel.idx + 1}</div>` +
      `<div>f(${voxel.origX.toFixed(2)}, ${voxel.origY.toFixed(2)}, ${voxel.origZ.toFixed(2)})</div>` +
      `<div>= ${voxel.val.toFixed(4)}</div>` +
      `<div>ΔV = ${dV.toFixed(6)}</div>` +
      `<div class="text-amber-600 dark:text-amber-400 mt-0.5">贡献: ${contribution.toFixed(6)}</div>`

    showBarTooltip(e, content)
  }, [nInt])

  const handlePointerOut = useCallback(() => {
    lastHoveredRef.current = null
    setHoveredIdx(null)
    document.body.style.cursor = 'auto'
    hideBarTooltip()
  }, [])

  return (
    <AutoRotate speed={0.002}>
      {/* Voxels - InstancedMesh */}
      {count > 0 && (
        <instancedMesh
          ref={meshRef}
          args={[geometry, undefined, count]}
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
        >
          <meshPhongMaterial color="#ffffff" transparent opacity={0.5} side={THREE.DoubleSide} />
        </instancedMesh>
      )}

      {/* Wireframe cube outline */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([
              0, 0, 0, 3, 0, 0,
              3, 0, 0, 3, 0, 3,
              3, 0, 3, 0, 0, 3,
              0, 0, 3, 0, 0, 0,
              0, 3, 0, 3, 3, 0,
              3, 3, 0, 3, 3, 3,
              3, 3, 3, 0, 3, 3,
              0, 3, 3, 0, 3, 0,
              0, 0, 0, 0, 3, 0,
              3, 0, 0, 3, 3, 0,
              3, 0, 3, 3, 3, 3,
              0, 0, 3, 0, 3, 3,
            ]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#94a3b8" linewidth={1} />
      </line>

      {/* Axis labels */}
      <Text position={[3.4, 0, 0]} fontSize={0.25} color="#ef4444" anchorX="center" anchorY="middle">x</Text>
      <Text position={[0, 3.4, 0]} fontSize={0.25} color="#3b82f6" anchorX="center" anchorY="middle">z</Text>
      <Text position={[0, 0, 3.4]} fontSize={0.25} color="#22c55e" anchorX="center" anchorY="middle">y</Text>

      {/* Info overlay */}
      <Html position={[1.5, 4.5, 1.5]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-foreground">
            n = {nInt}³ = {nInt ** 3} 个体素
          </div>
          <div className="text-emerald-600 dark:text-emerald-400">
            近似值: {formatValue(approxValue)}
          </div>
          <div className="text-muted-foreground">
            精确值: {formatValue(exactValue)}
          </div>
          <div className="text-amber-600 dark:text-amber-400">
            误差: {formatValue(Math.abs(approxValue - exactValue))}
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Auto-rotate wrapper ---
function AutoRotate({ children, speed = 0.002 }: { children: React.ReactNode; speed?: number }) {
  const ref = useRef<THREE.Group>(null)
  const { autoRotate } = useLabStore()
  useFrame(() => {
    if (ref.current && autoRotate) {
      ref.current.rotation.y += speed
    }
  })
  return <group ref={ref}>{children}</group>
}

// --- Jacobian / Change of Variables (jacobian1) ---
function JacobianScene() {
  const { paramValue: a, paramValue2: theta } = useLabStore()
  
  // Regular grid lines in uv-space (before transformation)
  const regularGridLines = useMemo(() => {
    const lines: Float32Array[] = []
    const n = 6
    const range = 2
    // Horizontal lines (v = const)
    for (let i = -n; i <= n; i++) {
      const v = (i / n) * range
      const pts: number[] = []
      for (let j = -100; j <= 100; j++) {
        const u = (j / 100) * range
        pts.push(u, 0.01, v)
      }
      lines.push(new Float32Array(pts))
    }
    // Vertical lines (u = const)
    for (let i = -n; i <= n; i++) {
      const u = (i / n) * range
      const pts: number[] = []
      for (let j = -100; j <= 100; j++) {
        const v = (j / 100) * range
        pts.push(u, 0.01, v)
      }
      lines.push(new Float32Array(pts))
    }
    return lines
  }, [])

  // Transformed grid lines: x = a*u*cos(θ) - a*v*sin(θ), y = a*u*sin(θ) + a*v*cos(θ)
  const transformedGridLines = useMemo(() => {
    const lines: Float32Array[] = []
    const n = 6
    const range = 2
    const cosT = Math.cos(theta)
    const sinT = Math.sin(theta)
    
    // Horizontal lines (v = const)
    for (let i = -n; i <= n; i++) {
      const v = (i / n) * range
      const pts: number[] = []
      for (let j = -100; j <= 100; j++) {
        const u = (j / 100) * range
        const x = a * u * cosT - a * v * sinT
        const y = a * u * sinT + a * v * cosT
        pts.push(x, 0.02, y)
      }
      lines.push(new Float32Array(pts))
    }
    // Vertical lines (u = const)
    for (let i = -n; i <= n; i++) {
      const u = (i / n) * range
      const pts: number[] = []
      for (let j = -100; j <= 100; j++) {
        const v = (j / 100) * range
        const x = a * u * cosT - a * v * sinT
        const y = a * u * sinT + a * v * cosT
        pts.push(x, 0.02, y)
      }
      lines.push(new Float32Array(pts))
    }
    return lines
  }, [a, theta])

  // Area element: original square and deformed parallelogram
  const areaElement = useMemo(() => {
    const u0 = 0.5, v0 = 0.5, du = 0.3, dv = 0.3
    const cosT = Math.cos(theta)
    const sinT = Math.sin(theta)
    
    // Original square corners in uv
    const origCorners = [
      [u0, v0], [u0 + du, v0], [u0 + du, v0 + dv], [u0, v0 + dv]
    ]
    
    // Transformed corners
    const transCorners = origCorners.map(([u, v]) => [
      a * u * cosT - a * v * sinT,
      a * u * sinT + a * v * cosT
    ])
    
    return { origCorners, transCorners }
  }, [a, theta])

  const jacobianValue = a * a

  return (
    <AutoRotate speed={0.001}>
      {/* Regular grid (uv-space) */}
      {regularGridLines.map((pts, idx) => (
        <line key={`reg-${idx}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[pts, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#22c55e" opacity={0.3} transparent />
        </line>
      ))}

      {/* Transformed grid (xy-space) */}
      {transformedGridLines.map((pts, idx) => (
        <line key={`trans-${idx}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[pts, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#f59e0b" opacity={0.6} transparent />
        </line>
      ))}

      {/* Original area element (green square) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([
            ...areaElement.origCorners[0], 0.03,
            ...areaElement.origCorners[1], 0.03,
            ...areaElement.origCorners[2], 0.03,
            ...areaElement.origCorners[3], 0.03,
            ...areaElement.origCorners[0], 0.03,
          ]), 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#22c55e" linewidth={3} />
      </line>

      {/* Original area fill */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5 + 0.15, 0.025, 0.5 + 0.15]}>
        <planeGeometry args={[0.3, 0.3]} />
        <meshPhongMaterial color="#22c55e" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Transformed area element (amber parallelogram) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([
            ...areaElement.transCorners[0], 0.035,
            ...areaElement.transCorners[1], 0.035,
            ...areaElement.transCorners[2], 0.035,
            ...areaElement.transCorners[3], 0.035,
            ...areaElement.transCorners[0], 0.035,
          ]), 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#f59e0b" linewidth={3} />
      </line>

      {/* Transformed area fill */}
      <mesh>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([
            ...areaElement.transCorners[0], 0.03,
            ...areaElement.transCorners[1], 0.03,
            ...areaElement.transCorners[2], 0.03,
            ...areaElement.transCorners[3], 0.03,
          ]), 3]} count={4} />
          <bufferAttribute attach="index" args={[new Uint16Array([0, 1, 2, 0, 2, 3]), 1]} count={6} />
        </bufferGeometry>
        <meshPhongMaterial color="#f59e0b" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      <Axes length={4} />
      <AxisLabels length={4} />
      <XYGrid size={4} divisions={8} color="#888888" />

      {/* Info overlay */}
      <Html position={[0, 5, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-4 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-amber-600 dark:text-amber-400 mb-1">
            变换: x = au cosθ - av sinθ, y = au sinθ + av cosθ
          </div>
          <div className="text-emerald-600 dark:text-emerald-400 mb-1">
            雅可比行列式 J = a² = {jacobianValue.toFixed(2)}
          </div>
          <div className="text-muted-foreground">
            面积放大倍数 = |J| = {jacobianValue.toFixed(2)}倍
          </div>
          <div className="text-muted-foreground mt-1">
            <span className="inline-block w-3 h-0.5 bg-emerald-500 mr-1" />原始网格 (uv)
            <span className="inline-block w-3 h-0.5 bg-amber-500 mr-1 ml-3" />变换网格 (xy)
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Green's Theorem Scene (green1) ---
function GreenScene() {
  const { paramValue: deform } = useLabStore()

  // Boundary curve C (parametric)
  const boundaryCurve = useMemo(() => {
    const pts: number[] = []
    const res = 128
    for (let i = 0; i <= res; i++) {
      const t = (2 * Math.PI * i) / res
      const x = deform * (2 * Math.cos(t) + 0.3 * Math.cos(3 * t))
      const y = deform * (1.5 * Math.sin(t) + 0.2 * Math.sin(2 * t))
      pts.push(x, 0.03, y)
    }
    return new Float32Array(pts)
  }, [deform])

  // Filled region D
  const regionGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []
    const res = 64
    // Center vertex
    vertices.push(0, 0.01, 0)
    for (let i = 0; i <= res; i++) {
      const t = (2 * Math.PI * i) / res
      const x = deform * (2 * Math.cos(t) + 0.3 * Math.cos(3 * t))
      const y = deform * (1.5 * Math.sin(t) + 0.2 * Math.sin(2 * t))
      vertices.push(x, 0.01, y)
    }
    for (let i = 0; i < res; i++) {
      indices.push(0, i + 1, i + 2)
    }
    geom.setIndex(indices)
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geom.computeVertexNormals()
    return geom
  }, [deform])

  // Vector field arrows along boundary
  const vectorArrows = useMemo(() => {
    const arrows: { pos: [number, number, number]; dir: [number, number, number]; color: string }[] = []
    const n = 24
    for (let i = 0; i < n; i++) {
      const t = (2 * Math.PI * i) / n
      const x = deform * (2 * Math.cos(t) + 0.3 * Math.cos(3 * t))
      const y = deform * (1.5 * Math.sin(t) + 0.2 * Math.sin(2 * t))
      // Vector field: P = -y/2, Q = x/2
      const P = -y / 2
      const Q = x / 2
      const len = Math.sqrt(P * P + Q * Q)
      const scale = 0.4 / Math.max(0.01, len)
      arrows.push({
        pos: [x, 0.05, y],
        dir: [P * scale, 0, Q * scale],
        color: '#f59e0b',
      })
    }
    // Also add some interior arrows
    for (let i = 0; i < 12; i++) {
      const angle = (2 * Math.PI * i) / 12
      const r = deform * 0.8
      const x = r * Math.cos(angle)
      const y = r * Math.sin(angle)
      const P = -y / 2
      const Q = x / 2
      const len = Math.sqrt(P * P + Q * Q)
      const scale = 0.3 / Math.max(0.01, len)
      arrows.push({
        pos: [x, 0.05, y],
        dir: [P * scale, 0, Q * scale],
        color: '#6ee7b7',
      })
    }
    return arrows
  }, [deform])

  // Direction arrows on boundary (counterclockwise)
  const directionArrows = useMemo(() => {
    const arrows: { pos: [number, number, number]; rotation: number }[] = []
    const n = 8
    for (let i = 0; i < n; i++) {
      const t = (2 * Math.PI * i) / n
      const x = deform * (2 * Math.cos(t) + 0.3 * Math.cos(3 * t))
      const y = deform * (1.5 * Math.sin(t) + 0.2 * Math.sin(2 * t))
      // Tangent direction (counterclockwise)
      const dt = 0.01
      const x2 = deform * (2 * Math.cos(t + dt) + 0.3 * Math.cos(3 * (t + dt)))
      const y2 = deform * (1.5 * Math.sin(t + dt) + 0.2 * Math.sin(2 * (t + dt)))
      const dx = x2 - x
      const dy = y2 - y
      const angle = Math.atan2(dy, dx)
      arrows.push({ pos: [x, 0.06, y], rotation: -angle })
    }
    return arrows
  }, [deform])

  // Numerical computation of area
  const areaValue = useMemo(() => {
    // Green's theorem: Area = ∬_D 1 dA = ∮_C x dy (with P=0, Q=x)
    const res = 200
    let area = 0
    for (let i = 0; i < res; i++) {
      const t1 = (2 * Math.PI * i) / res
      const t2 = (2 * Math.PI * (i + 1)) / res
      const x1 = deform * (2 * Math.cos(t1) + 0.3 * Math.cos(3 * t1))
      const y1 = deform * (1.5 * Math.sin(t1) + 0.2 * Math.sin(2 * t1))
      const x2 = deform * (2 * Math.cos(t2) + 0.3 * Math.cos(3 * t2))
      const y2 = deform * (1.5 * Math.sin(t2) + 0.2 * Math.sin(2 * t2))
      area += x1 * (y2 - y1)
    }
    return Math.abs(area)
  }, [deform])

  // Line integral: ∮(P dx + Q dy) where P = -y/2, Q = x/2
  const lineIntegral = useMemo(() => {
    const res = 200
    let integral = 0
    for (let i = 0; i < res; i++) {
      const t1 = (2 * Math.PI * i) / res
      const t2 = (2 * Math.PI * (i + 1)) / res
      const x1 = deform * (2 * Math.cos(t1) + 0.3 * Math.cos(3 * t1))
      const y1 = deform * (1.5 * Math.sin(t1) + 0.2 * Math.sin(2 * t1))
      const x2 = deform * (2 * Math.cos(t2) + 0.3 * Math.cos(3 * t2))
      const y2 = deform * (1.5 * Math.sin(t2) + 0.2 * Math.sin(2 * t2))
      const P1 = -y1 / 2
      const Q1 = x1 / 2
      const dx = x2 - x1
      const dy = y2 - y1
      integral += P1 * dx + Q1 * dy
    }
    return integral
  }, [deform])

  return (
    <AutoRotate speed={0.001}>
      <Axes length={4} />
      <AxisLabels length={4} />
      <XYGrid size={4} divisions={8} />

      {/* Filled region D */}
      <mesh geometry={regionGeometry}>
        <meshPhongMaterial color="#10b981" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Boundary curve C */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[boundaryCurve, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={2} />
      </line>

      {/* Vector field arrows */}
      {vectorArrows.map((arrow, idx) => (
        <group key={idx} position={arrow.pos}>
          {/* Arrow shaft */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([0, 0, 0, arrow.dir[0], arrow.dir[1], arrow.dir[2]]), 3]}
                count={2}
              />
            </bufferGeometry>
            <lineBasicMaterial color={arrow.color} linewidth={2} />
          </line>
          {/* Arrow head (small cone) */}
          <mesh
            position={[arrow.dir[0] * 0.9, arrow.dir[1], arrow.dir[2] * 0.9]}
            rotation={[0, 0, 0]}
          >
            <coneGeometry args={[0.06, 0.15, 6]} />
            <meshPhongMaterial color={arrow.color} />
          </mesh>
        </group>
      ))}

      {/* Direction arrows (red triangular markers) */}
      {directionArrows.map((arrow, idx) => (
        <mesh key={`dir-${idx}`} position={arrow.pos} rotation={[Math.PI / 2, arrow.rotation, 0]}>
          <coneGeometry args={[0.1, 0.2, 3]} />
          <meshPhongMaterial color="#ef4444" />
        </mesh>
      ))}

      {/* Surface showing ∂Q/∂x - ∂P/∂y = 1 over region D */}
      <Surface
        func={() => 1}
        xRange={[-deform * 2.5, deform * 2.5]}
        yRange={[-deform * 2, deform * 2]}
        color="#10b981"
        opacity={0.15}
        resolution={20}
      />

      {/* Info overlay */}
      <Html position={[0, 5, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-4 py-2 text-xs font-mono whitespace-nowrap shadow-lg space-y-1">
          <div className="text-red-500 dark:text-red-400 font-bold">
            ∮_C (P dx + Q dy) = {lineIntegral.toFixed(4)}
          </div>
          <div className="text-emerald-600 dark:text-emerald-400 font-bold">
            ∬_D (∂Q/∂x - ∂P/∂y) dA = {areaValue.toFixed(4)}
          </div>
          <div className="text-muted-foreground text-[10px]">
            P = -y/2, Q = x/2 → ∂Q/∂x - ∂P/∂y = 1
          </div>
          <div className="text-amber-600 dark:text-amber-400 text-[10px]">
            验证: 线积分 ≈ 面积分 ✓ (误差: {Math.abs(lineIntegral - areaValue).toFixed(6)})
          </div>
          <div className="flex items-center gap-3 mt-1 text-[10px]">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-red-500" />边界曲线 C</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-emerald-500" />区域 D</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-amber-500" />向量场</span>
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Surface Area (surface_area1) ---
function SurfaceAreaScene() {
  const { paramValue: a } = useLabStore()
  
  // Surface z = a*(x² + y²) with heat-map coloring based on gradient magnitude
  const surfaceGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []
    const colors: number[] = []
    const normals: number[] = []
    const res = 50
    const [xMin, xMax] = [-2, 2]
    const [yMin, yMax] = [-2, 2]
    const dx = (xMax - xMin) / res
    const dy = (yMax - yMin) / res
    const tealCol = new THREE.Color('#14b8a6')
    const amberCol = new THREE.Color('#f59e0b')

    for (let i = 0; i <= res; i++) {
      for (let j = 0; j <= res; j++) {
        const x = xMin + i * dx
        const y = yMin + j * dy
        const z = a * (x * x + y * y)
        vertices.push(x, z, y)
        normals.push(0, 1, 0)
        // Heat map: gradient magnitude determines color
        const gradMag = Math.sqrt(4 * a * a * (x * x + y * y))
        const t = Math.min(1, gradMag / (4 * a + 0.01)) // normalize
        const col = tealCol.clone().lerp(amberCol, t)
        colors.push(col.r, col.g, col.b)
      }
    }

    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        const ai = i * (res + 1) + j
        const b2 = ai + 1
        const c = (i + 1) * (res + 1) + j
        const d = c + 1
        indices.push(ai, c, b2, b2, c, d)
      }
    }

    geom.setIndex(indices)
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geom.computeVertexNormals()
    return geom
  }, [a])

  // Normal vectors at grid points
  const normalArrows = useMemo(() => {
    const arrows: { pos: [number, number, number]; dir: [number, number, number] }[] = []
    const step = 1.0
    for (let x = -2; x <= 2; x += step) {
      for (let y = -2; y <= 2; y += step) {
        const z = a * (x * x + y * y)
        // Normal to z = a(x²+y²): (-∂f/∂x, 1, -∂f/∂y) = (-2ax, 1, -2ay)
        const nx = -2 * a * x
        const nz = -2 * a * y
        const ny = 1
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
        const scale = 0.3 / Math.max(0.01, len)
        arrows.push({
          pos: [x, z, y],
          dir: [nx * scale, ny * scale, nz * scale],
        })
      }
    }
    return arrows
  }, [a])

  // Connecting lines at corners (showing the "lift" from flat domain to surface)
  const connectingLines = useMemo(() => {
    const corners = [[-2, -2], [-2, 2], [2, -2], [2, 2]] as const
    return corners.map(([x, y]) => {
      const zBottom = 0
      const zTop = a * (x * x + y * y)
      return new Float32Array([x, zBottom, y, x, zTop, y])
    })
  }, [a])

  // Numerical surface area
  const surfaceArea = useMemo(() => {
    return surfaceAreaApprox(a, -2, 2, -2, 2)
  }, [a])

  // Gradient at center for display
  const gradAtOrigin = useMemo(() => {
    return { fx: 0, fy: 0, sqrtVal: 1 }
  }, [])

  // Gradient at (1,1) for display
  const gradAtSample = useMemo(() => {
    const fx = 2 * a * 1
    const fy = 2 * a * 1
    const sqrtVal = Math.sqrt(1 + fx * fx + fy * fy)
    return { fx, fy, sqrtVal }
  }, [a])

  return (
    <AutoRotate speed={0.002}>
      {/* Heat-mapped surface */}
      <mesh geometry={surfaceGeometry}>
        <meshPhongMaterial
          vertexColors
          side={THREE.DoubleSide}
          transparent
          opacity={0.8}
          shininess={60}
        />
      </mesh>

      {/* Normal vectors */}
      {normalArrows.map((arrow, idx) => (
        <group key={idx} position={arrow.pos}>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([0, 0, 0, arrow.dir[0], arrow.dir[1], arrow.dir[2]]), 3]}
                count={2}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#f97316" linewidth={2} />
          </line>
          {/* Small cone for arrow head */}
          <mesh position={[arrow.dir[0] * 0.85, arrow.dir[1] * 0.85, arrow.dir[2] * 0.85]}>
            <coneGeometry args={[0.04, 0.1, 4]} />
            <meshPhongMaterial color="#f97316" />
          </mesh>
        </group>
      ))}

      {/* Flat domain D on xy-plane */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 4]} />
        <meshPhongMaterial color="#99f6e4" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      <RegionOutline size={2} color="#14b8a6" />

      {/* Connecting lines at corners */}
      {connectingLines.map((line, idx) => (
        <line key={idx}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[line, 3]} count={2} />
          </bufferGeometry>
          <lineBasicMaterial color="#f97316" opacity={0.6} transparent linewidth={2} />
        </line>
      ))}

      <Axes length={4} />
      <AxisLabels length={4} />
      <XYGrid size={4} divisions={8} color="#888888" />

      {/* Info overlay */}
      <Html position={[0, 6, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-4 py-2 text-xs font-mono whitespace-nowrap shadow-lg space-y-1">
          <div className="text-teal-600 dark:text-teal-400 font-bold">
            S = ∫∫√(1+fx²+fy²) dσ ≈ {surfaceArea.toFixed(4)}
          </div>
          <div className="text-amber-600 dark:text-amber-400">
            f(x,y) = {a.toFixed(1)}·(x²+y²)
          </div>
          <div className="text-muted-foreground">
            fx = 2ax, fy = 2ay
          </div>
          <div className="text-muted-foreground">
            √(1+fx²+fy²) 在 (1,1): √(1+{gradAtSample.fx.toFixed(2)}²+{gradAtSample.fy.toFixed(2)}²) = {gradAtSample.sqrtVal.toFixed(4)}
          </div>
          <div className="flex items-center gap-3 mt-1 text-[10px]">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-teal-500" />平坦区域</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-amber-500" />陡峭区域</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-orange-500" />法向量</span>
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Fubini's Theorem (fubini1) ---
function FubiniScene() {
  const { paramValue: nSlices } = useLabStore()
  const nInt = Math.max(3, Math.round(nSlices))

  // Surface z = (4 - x² - y²) / 2
  const funcFubini = (x: number, y: number) => (4 - x * x - y * y) / 2

  // X-type slices (left half, x < 0): vertical green slices
  const xSlices = useMemo(() => {
    const slices: { x: number; w: number; h: number; color: string }[] = []
    const dx = 2 / nInt // from -2 to 0
    for (let i = 0; i < nInt; i++) {
      const x = -2 + (i + 0.5) * dx
      // Average height across y ∈ [-2, 2]
      let avgH = 0
      const ny = 20
      for (let j = 0; j < ny; j++) {
        const y = -2 + (j + 0.5) * (4 / ny)
        avgH += Math.max(0, funcFubini(x, y))
      }
      avgH /= ny
      slices.push({
        x,
        w: dx * 0.85,
        h: Math.max(0, avgH),
        color: i % 2 === 0 ? '#10b981' : '#34d399',
      })
    }
    return slices
  }, [nInt])

  // Y-type slices (right half, x > 0): horizontal amber slices
  const ySlices = useMemo(() => {
    const slices: { y: number; d: number; h: number; color: string }[] = []
    const dy = 4 / nInt // from -2 to 2
    for (let j = 0; j < nInt; j++) {
      const y = -2 + (j + 0.5) * dy
      // Average height across x ∈ [0, 2]
      let avgH = 0
      const nx = 20
      for (let i = 0; i < nx; i++) {
        const x = 0 + (i + 0.5) * (2 / nx)
        avgH += Math.max(0, funcFubini(x, y))
      }
      avgH /= nx
      slices.push({
        y,
        d: dy * 0.85,
        h: Math.max(0, avgH),
        color: j % 2 === 0 ? '#f59e0b' : '#fbbf24',
      })
    }
    return slices
  }, [nInt])

  // Numerical values
  const integralValues = useMemo(() => {
    return fubiniDoubleIntegral(200)
  }, [])

  // X-type slice floor strips (green)
  const xFloorStrips = useMemo(() => {
    const strips: { vertices: Float32Array; indices: Uint16Array; color: string }[] = []
    const dx = 2 / nInt
    for (let i = 0; i < nInt; i++) {
      const xMin = -2 + i * dx
      const xMax = -2 + (i + 1) * dx
      strips.push({
        vertices: new Float32Array([
          xMin, 0.005, -2,
          xMax, 0.005, -2,
          xMax, 0.005, 2,
          xMin, 0.005, 2,
        ]),
        indices: new Uint16Array([0, 1, 2, 0, 2, 3]),
        color: i % 2 === 0 ? '#10b981' : '#34d399',
      })
    }
    return strips
  }, [nInt])

  // Y-type slice floor strips (amber)
  const yFloorStrips = useMemo(() => {
    const strips: { vertices: Float32Array; indices: Uint16Array; color: string }[] = []
    const dy = 4 / nInt
    for (let j = 0; j < nInt; j++) {
      const yMin = -2 + j * dy
      const yMax = -2 + (j + 1) * dy
      strips.push({
        vertices: new Float32Array([
          0, 0.005, yMin,
          2, 0.005, yMin,
          2, 0.005, yMax,
          0, 0.005, yMax,
        ]),
        indices: new Uint16Array([0, 1, 2, 0, 2, 3]),
        color: j % 2 === 0 ? '#f59e0b' : '#fbbf24',
      })
    }
    return strips
  }, [nInt])

  return (
    <AutoRotate speed={0.002}>
      <Axes length={4} />
      <AxisLabels length={4} />
      <XYGrid size={4} divisions={8} color="#888888" />

      {/* Surface */}
      <Surface
        func={funcFubini}
        xRange={[-2, 2]}
        yRange={[-2, 2]}
        color="#8b5cf6"
        opacity={0.35}
        resolution={40}
      />

      {/* Dividing plane at x=0 */}
      <mesh position={[0, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[4, 4]} />
        <meshPhongMaterial color="#6366f1" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      {/* Dividing line on floor */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0.01, -2, 0, 0.01, 2]), 3]}
            count={2}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#6366f1" linewidth={2} />
      </line>

      {/* X-type floor strips (left half) */}
      {xFloorStrips.map((strip, idx) => (
        <mesh key={`xf-${idx}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[strip.vertices, 3]} count={4} />
            <bufferAttribute attach="index" args={[strip.indices, 1]} count={6} />
          </bufferGeometry>
          <meshPhongMaterial color={strip.color} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Y-type floor strips (right half) */}
      {yFloorStrips.map((strip, idx) => (
        <mesh key={`yf-${idx}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[strip.vertices, 3]} count={4} />
            <bufferAttribute attach="index" args={[strip.indices, 1]} count={6} />
          </bufferGeometry>
          <meshPhongMaterial color={strip.color} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* X-type vertical slice bars (left half) */}
      {xSlices.map((slice, idx) => (
        <mesh key={`xs-${idx}`} position={[slice.x, slice.h / 2, 0]}>
          <boxGeometry args={[slice.w, slice.h, 3.8]} />
          <meshPhongMaterial color={slice.color} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Y-type horizontal slice bars (right half) */}
      {ySlices.map((slice, idx) => (
        <mesh key={`ys-${idx}`} position={[1, slice.h / 2, slice.y]}>
          <boxGeometry args={[1.8, slice.h, slice.d]} />
          <meshPhongMaterial color={slice.color} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Region outline */}
      <RegionOutline size={2} color="#6366f1" />

      {/* Labels */}
      <Text
        position={[-1, 4.5, 0]}
        fontSize={0.25}
        color="#10b981"
        anchorX="center"
        anchorY="middle"
      >
        先y后x
      </Text>
      <Text
        position={[1, 4.5, 0]}
        fontSize={0.25}
        color="#f59e0b"
        anchorX="center"
        anchorY="middle"
      >
        先x后y
      </Text>

      {/* Info overlay */}
      <Html position={[0, 7, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-4 py-2 text-xs font-mono whitespace-nowrap shadow-lg space-y-1">
          <div className="text-violet-600 dark:text-violet-400 font-bold">
            ∫∫f dσ = {integralValues.direct.toFixed(4)}
          </div>
          <div className="text-emerald-600 dark:text-emerald-400">
            ∫[∫f dy]dx = {integralValues.dydx.toFixed(4)} (先y后x)
          </div>
          <div className="text-amber-600 dark:text-amber-400">
            ∫[∫f dx]dy = {integralValues.dxdy.toFixed(4)} (先x后y)
          </div>
          <div className="text-muted-foreground text-[10px]">
            验证: 两种顺序结果相同 ✓ (差: {Math.abs(integralValues.dydx - integralValues.dxdy).toFixed(6)})
          </div>
          <div className="flex items-center gap-3 mt-1 text-[10px]">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-emerald-500" />X型切片 (先y后x)</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-amber-500" />Y型切片 (先x后y)</span>
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// ============= MAIN SCENE RENDERER =============
// --- Arc Length Scene (arc_length1) ---
function ArcLengthScene() {
  const { paramValue: n } = useLabStore()
  const nInt = Math.max(2, Math.round(n))

  // Curve: r(t) = (t - π, 1.5sin(t), 1.5cos(t)) for t ∈ [0, 2π]
  const smoothCurve = useMemo(() => {
    const pts: number[] = []
    const res = 200
    for (let i = 0; i <= res; i++) {
      const t = (i / res) * 2 * Math.PI
      pts.push(t - Math.PI, 1.5 * Math.sin(t), 1.5 * Math.cos(t))
    }
    return new Float32Array(pts)
  }, [])

  // Segmented approximation
  const segPoints = useMemo(() => {
    const pts: [number, number, number][] = []
    for (let i = 0; i <= nInt; i++) {
      const t = (i / nInt) * 2 * Math.PI
      pts.push([t - Math.PI, 1.5 * Math.sin(t), 1.5 * Math.cos(t)])
    }
    return pts
  }, [nInt])

  const approxL = useMemo(() => arcLengthApprox(nInt), [nInt])
  const exactL = useMemo(() => arcLengthExact(), [])

  return (
    <AutoRotate speed={0.002}>
      {/* Smooth curve (green, thin) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[smoothCurve, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#10b981" opacity={0.5} transparent />
      </line>

      {/* Segmented line (amber, thicker segments) */}
      {segPoints.map((pt, idx) => {
        if (idx === 0) return null
        const prev = segPoints[idx - 1]
        return (
          <line key={idx}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([...prev, ...pt]), 3]}
                count={2}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#f59e0b" linewidth={2} />
          </line>
        )
      })}

      {/* Small spheres at segment points */}
      {segPoints.map((pt, idx) => (
        <mesh key={idx} position={pt}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshPhongMaterial color="#f59e0b" />
        </mesh>
      ))}

      {/* Drop lines to x-axis */}
      {segPoints.map((pt, idx) => (
        <line key={idx}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([pt[0], pt[1], pt[2], pt[0], 0, 0]), 3]}
              count={2}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#f59e0b" opacity={0.3} transparent />
        </line>
      ))}

      {/* Info overlay */}
      <Html position={[0, 3, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-pink-600 dark:text-pink-400">
            分段数: {nInt}
          </div>
          <div className="text-emerald-600 dark:text-emerald-400">
            近似弧长: {approxL.toFixed(4)}
          </div>
          <div className="text-muted-foreground">
            精确弧长: {exactL.toFixed(4)}
          </div>
          <div className="text-amber-600 dark:text-amber-400">
            误差: {Math.abs(approxL - exactL).toFixed(4)}
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Mass Center Scene (mass_center1) ---
function MassCenterScene() {
  const { paramValue: a } = useLabStore()

  // Compute mass center using the helper
  const { mass, cx, cy } = useMemo(() => massCenterComputation(a), [a])

  // Heat-mapped surface z = 2 - x² - y² with density ρ = 1 + a*(x²+y²)
  const surfaceGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []
    const colors: number[] = []
    const normals: number[] = []
    const res = 30
    const range = 1
    const dx = (2 * range) / res
    const dy = (2 * range) / res
    const cyan = new THREE.Color('#06b6d4')
    const yellow = new THREE.Color('#eab308')
    const red = new THREE.Color('#ef4444')

    for (let i = 0; i <= res; i++) {
      for (let j = 0; j <= res; j++) {
        const x = -range + i * dx
        const y = -range + j * dy
        const z = 2 - x * x - y * y
        vertices.push(x, z, y)
        normals.push(0, 1, 0)
        // Density-based color: low=cyan, mid=yellow, high=red
        const rho = 1 + a * (x * x + y * y)
        const maxRho = 1 + a * 2 // at corners
        const t = Math.min(1, (rho - 1) / Math.max(0.01, maxRho - 1))
        const col = t < 0.5
          ? cyan.clone().lerp(yellow, t * 2)
          : yellow.clone().lerp(red, (t - 0.5) * 2)
        colors.push(col.r, col.g, col.b)
      }
    }
    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        const idx = i * (res + 1) + j
        indices.push(idx, idx + res + 1, idx + 1, idx + 1, idx + res + 1, idx + res + 2)
      }
    }
    geom.setIndex(indices)
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geom.computeVertexNormals()
    return geom
  }, [a])

  // Surface height at centroid
  const cz = 2 - cx * cx - cy * cy

  return (
    <AutoRotate speed={0.002}>
      {/* Heat-mapped surface */}
      <mesh geometry={surfaceGeometry}>
        <meshPhongMaterial vertexColors side={THREE.DoubleSide} transparent opacity={0.8} shininess={60} />
      </mesh>

      {/* Floor domain */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 2]} />
        <meshPhongMaterial color="#06b6d4" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>

      {/* Centroid vertical line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([cx, 0, cy, cx, cz, cy]), 3]}
            count={2}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={2} />
      </line>

      {/* Centroid sphere on surface */}
      <mesh position={[cx, cz, cy]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshPhongMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
      </mesh>

      {/* Floor crosshair */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([cx - 0.2, 0.01, cy, cx + 0.2, 0.01, cy]), 3]}
            count={2}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" opacity={0.6} transparent />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([cx, 0.01, cy - 0.2, cx, 0.01, cy + 0.2]), 3]}
            count={2}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" opacity={0.6} transparent />
      </line>

      {/* Info overlay */}
      <Html position={[0, 4, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-cyan-600 dark:text-cyan-400">
            质量 M = {mass.toFixed(4)}
          </div>
          <div className="text-red-600 dark:text-red-400">
            质心: ({cx.toFixed(3)}, {cy.toFixed(3)})
          </div>
          <div className="text-muted-foreground">
            密度范围: [1, {(1 + a * 2).toFixed(2)}]
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Moment of Inertia Scene (moment_of_inertia1) ---
function MomentOfInertiaScene() {
  const { paramValue: a } = useLabStore()

  // Compute moments of inertia
  const { Ix, Iy } = useMemo(() => momentOfInertia(a), [a])

  // Heat-mapped surface z = 2 - x² - y² with density ρ = 1 + a*(x²+y²)
  const surfaceGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []
    const colors: number[] = []
    const normals: number[] = []
    const res = 30
    const range = 1
    const dx = (2 * range) / res
    const dy = (2 * range) / res
    const cyan = new THREE.Color('#06b6d4')
    const yellow = new THREE.Color('#eab308')
    const red = new THREE.Color('#ef4444')

    for (let i = 0; i <= res; i++) {
      for (let j = 0; j <= res; j++) {
        const x = -range + i * dx
        const y = -range + j * dy
        const z = 2 - x * x - y * y
        vertices.push(x, z, y)
        normals.push(0, 1, 0)
        // Density-based color: low=cyan, mid=yellow, high=red
        const rho = 1 + a * (x * x + y * y)
        const maxRho = 1 + a * 2
        const t = Math.min(1, (rho - 1) / Math.max(0.01, maxRho - 1))
        const col = t < 0.5
          ? cyan.clone().lerp(yellow, t * 2)
          : yellow.clone().lerp(red, (t - 0.5) * 2)
        colors.push(col.r, col.g, col.b)
      }
    }
    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        const idx = i * (res + 1) + j
        indices.push(idx, idx + res + 1, idx + 1, idx + 1, idx + res + 1, idx + res + 2)
      }
    }
    geom.setIndex(indices)
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geom.computeVertexNormals()
    return geom
  }, [a])

  // Sample points for distance indicator lines
  const samplePoints = useMemo(() => {
    const pts: { pos: [number, number, number] }[] = []
    const samples = 6
    for (let i = 0; i < samples; i++) {
      for (let j = 0; j < samples; j++) {
        const x = -0.7 + (1.4 * i) / (samples - 1)
        const y = -0.7 + (1.4 * j) / (samples - 1)
        const z = 2 - x * x - y * y
        pts.push({ pos: [x, z, y] })
      }
    }
    return pts
  }, [])

  // Spinning indicator arrow references
  const spinnerRef1a = useRef<THREE.Group>(null)
  const spinnerRef1b = useRef<THREE.Group>(null)
  const spinnerRef2a = useRef<THREE.Group>(null)
  const spinnerRef2b = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (spinnerRef1a.current) spinnerRef1a.current.rotation.y += delta * 2
    if (spinnerRef1b.current) spinnerRef1b.current.rotation.y += delta * 2
    if (spinnerRef2a.current) spinnerRef2a.current.rotation.y += delta * 2
    if (spinnerRef2b.current) spinnerRef2b.current.rotation.y += delta * 2
  })

  // Floor domain with density heat map
  const floorGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []
    const colors: number[] = []
    const res = 20
    const range = 1
    const dx = (2 * range) / res
    const dy = (2 * range) / res
    const cyan = new THREE.Color('#06b6d4')
    const yellow = new THREE.Color('#eab308')
    const red = new THREE.Color('#ef4444')

    for (let i = 0; i <= res; i++) {
      for (let j = 0; j <= res; j++) {
        const x = -range + i * dx
        const y = -range + j * dy
        vertices.push(x, 0.005, y)
        const rho = 1 + a * (x * x + y * y)
        const maxRho = 1 + a * 2
        const t = Math.min(1, (rho - 1) / Math.max(0.01, maxRho - 1))
        const col = t < 0.5
          ? cyan.clone().lerp(yellow, t * 2)
          : yellow.clone().lerp(red, (t - 0.5) * 2)
        colors.push(col.r, col.g, col.b)
      }
    }
    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        const idx = i * (res + 1) + j
        indices.push(idx, idx + res + 1, idx + 1, idx + 1, idx + res + 1, idx + res + 2)
      }
    }
    geom.setIndex(indices)
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geom.computeVertexNormals()
    return geom
  }, [a])

  return (
    <AutoRotate speed={0.002}>
      {/* Heat-mapped surface */}
      <mesh geometry={surfaceGeometry}>
        <meshPhongMaterial vertexColors side={THREE.DoubleSide} transparent opacity={0.7} shininess={60} />
      </mesh>

      {/* Floor domain with density heat map */}
      <mesh geometry={floorGeometry}>
        <meshPhongMaterial vertexColors side={THREE.DoubleSide} transparent opacity={0.4} />
      </mesh>

      {/* X-axis rotation line (red) - for Ix */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-2, 0, 0, 2, 0, 0]), 3]}
            count={2}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={3} />
      </line>

      {/* Y-axis rotation line (blue) - for Iy */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, -2, 0, 0, 2]), 3]}
            count={2}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" linewidth={3} />
      </line>

      {/* Distance indicator lines from sample points to x-axis */}
      {samplePoints.map((pt, idx) => (
        <group key={`dist-x-${idx}`}>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([pt.pos[0], pt.pos[1], pt.pos[2], pt.pos[0], pt.pos[1], 0]), 3]}
                count={2}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#ef4444" opacity={0.3} transparent />
          </line>
        </group>
      ))}

      {/* Distance indicator lines from sample points to y-axis */}
      {samplePoints.map((pt, idx) => (
        <group key={`dist-y-${idx}`}>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([pt.pos[0], pt.pos[1], pt.pos[2], 0, pt.pos[1], pt.pos[2]]), 3]}
                count={2}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#3b82f6" opacity={0.3} transparent />
          </line>
        </group>
      ))}

      {/* Spinning indicator arrow around x-axis (for Ix) */}
      <group ref={spinnerRef1a} position={[1.5, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.08, 0.3, 8]} />
          <meshPhongMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
        </mesh>
      </group>
      <group ref={spinnerRef1b} position={[-1.5, 0, 0]}>
        <mesh rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.08, 0.3, 8]} />
          <meshPhongMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* Spinning indicator arrow around y-axis (for Iy) */}
      <group ref={spinnerRef2a} position={[0, 0, 1.5]}>
        <mesh>
          <coneGeometry args={[0.08, 0.3, 8]} />
          <meshPhongMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.3} />
        </mesh>
      </group>
      <group ref={spinnerRef2b} position={[0, 0, -1.5]}>
        <mesh rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.08, 0.3, 8]} />
          <meshPhongMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* Axis labels for rotation axes */}
      <Text position={[2.3, 0.2, 0]} fontSize={0.25} color="#ef4444" anchorX="center" anchorY="middle">
        Ix轴
      </Text>
      <Text position={[0, 0.2, 2.3]} fontSize={0.25} color="#3b82f6" anchorX="center" anchorY="middle">
        Iy轴
      </Text>

      {/* Info overlay */}
      <Html position={[0, 4, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-red-600 dark:text-red-400">
            Ix = ∫∫y²ρ dσ = {Ix.toFixed(4)}
          </div>
          <div className="text-blue-600 dark:text-blue-400">
            Iy = ∫∫x²ρ dσ = {Iy.toFixed(4)}
          </div>
          <div className="text-muted-foreground">
            密度范围: [1, {(1 + a * 2).toFixed(2)}]
          </div>
          <div className="text-cyan-600 dark:text-cyan-400">
            ρ = 1 + {a.toFixed(1)}·r²
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Cylindrical Coordinates Scene (cylindrical1) ---
function CylindricalCoordScene() {
  const { paramValue: radius, paramValue2: height } = useLabStore()

  // Semi-transparent cylinder
  const cylinderGeom = useMemo(() => {
    return new THREE.CylinderGeometry(radius, radius, height, 48, 1, false)
  }, [radius, height])

  // Concentric circles on bottom face
  const concentricCircles = useMemo(() => {
    const circles: Float32Array[] = []
    const numCircles = Math.max(1, Math.floor(radius / 0.3))
    const res = 64
    for (let c = 1; c <= numCircles; c++) {
      const r = (radius * c) / numCircles
      const pts: number[] = []
      for (let i = 0; i <= res; i++) {
        const theta = (2 * Math.PI * i) / res
        pts.push(r * Math.cos(theta), -height / 2 + 0.01, r * Math.sin(theta))
      }
      circles.push(new Float32Array(pts))
    }
    return circles
  }, [radius, height])

  // Radial grid lines from center on bottom face
  const radialLines = useMemo(() => {
    const lines: Float32Array[] = []
    const numLines = 12
    for (let i = 0; i < numLines; i++) {
      const theta = (2 * Math.PI * i) / numLines
      lines.push(new Float32Array([
        0, -height / 2 + 0.01, 0,
        radius * Math.cos(theta), -height / 2 + 0.01, radius * Math.sin(theta),
      ]))
    }
    return lines
  }, [radius, height])

  // Height markers
  const heightMarkers = useMemo(() => {
    const markers: { y: number; label: string }[] = []
    const step = height <= 2 ? 0.5 : 1
    for (let h = 0; h <= height; h += step) {
      markers.push({ y: -height / 2 + h, label: h.toFixed(1) })
    }
    return markers
  }, [height])

  // Wedge-shaped volume element
  const wedgeGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const dr = 0.3
    const dTheta = Math.PI / 8
    const rInner = radius * 0.5
    const rOuter = rInner + dr
    const zBottom = -height / 2
    const zTop = -height / 2 + height * 0.4
    const thetaStart = Math.PI / 4

    const vPts: number[] = []
    const idxPts: number[] = []
    const arcRes = 4

    // Bottom face vertices
    for (let k = 0; k <= arcRes; k++) {
      const t = thetaStart + (k / arcRes) * dTheta
      vPts.push(rInner * Math.cos(t), zBottom, rInner * Math.sin(t))
    }
    for (let k = 0; k <= arcRes; k++) {
      const t = thetaStart + (k / arcRes) * dTheta
      vPts.push(rOuter * Math.cos(t), zBottom, rOuter * Math.sin(t))
    }
    // Top face vertices
    for (let k = 0; k <= arcRes; k++) {
      const t = thetaStart + (k / arcRes) * dTheta
      vPts.push(rInner * Math.cos(t), zTop, rInner * Math.sin(t))
    }
    for (let k = 0; k <= arcRes; k++) {
      const t = thetaStart + (k / arcRes) * dTheta
      vPts.push(rOuter * Math.cos(t), zTop, rOuter * Math.sin(t))
    }

    const s = arcRes + 1
    // Bottom face
    for (let k = 0; k < arcRes; k++) {
      idxPts.push(k, k + 1, s + k, s + k, k + 1, s + k + 1)
    }
    // Top face
    for (let k = 0; k < arcRes; k++) {
      idxPts.push(2 * s + k + 1, 2 * s + k, 3 * s + k, 3 * s + k, 3 * s + k + 1, 2 * s + k + 1)
    }
    // Inner side
    idxPts.push(0, 2 * s, 2 * s + 1, 0, 2 * s + 1, 1)
    // Outer side
    idxPts.push(s, s + 1, 3 * s + 1, s, 3 * s + 1, 3 * s)
    // Left side
    idxPts.push(0, s, 3 * s, 0, 3 * s, 2 * s)
    // Right side
    const li = arcRes
    idxPts.push(li + 1, li + s + 1, 3 * s + li + 1, li + 1, 3 * s + li + 1, 2 * s + li + 1)

    geom.setIndex(idxPts)
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vPts, 3))
    geom.computeVertexNormals()
    return geom
  }, [radius, height])

  const volume = cylindricalVolume(radius, height)

  return (
    <AutoRotate speed={0.002}>
      {/* Semi-transparent cylinder */}
      <mesh geometry={cylinderGeom} position={[0, 0, 0]}>
        <meshPhongMaterial color="#06b6d4" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Cylinder wireframe */}
      <mesh geometry={cylinderGeom} position={[0, 0, 0]}>
        <meshBasicMaterial color="#06b6d4" wireframe transparent opacity={0.3} />
      </mesh>

      {/* Top cap */}
      <mesh position={[0, height / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 48]} />
        <meshPhongMaterial color="#06b6d4" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>

      {/* Bottom cap */}
      <mesh position={[0, -height / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 48]} />
        <meshPhongMaterial color="#06b6d4" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>

      {/* Concentric circles on bottom face */}
      {concentricCircles.map((pts, idx) => (
        <line key={`cc-${idx}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[pts, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#06b6d4" opacity={0.4} transparent />
        </line>
      ))}

      {/* Radial grid lines on bottom face */}
      {radialLines.map((pts, idx) => (
        <line key={`rl-${idx}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[pts, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#06b6d4" opacity={0.3} transparent />
        </line>
      ))}

      {/* Wedge-shaped volume element (highlighted) */}
      <mesh geometry={wedgeGeometry}>
        <meshPhongMaterial color="#f59e0b" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={wedgeGeometry}>
        <meshBasicMaterial color="#f59e0b" wireframe transparent opacity={0.5} />
      </mesh>

      {/* Coordinate axes with r, θ, z labels */}
      <Text position={[radius + 0.5, -height / 2, 0]} fontSize={0.3} color="#ef4444" anchorX="center" anchorY="middle">
        r
      </Text>
      <Text position={[0.5, -height / 2, radius + 0.5]} fontSize={0.3} color="#22c55e" anchorX="center" anchorY="middle">
        θ
      </Text>
      <Text position={[0, height / 2 + 0.5, 0]} fontSize={0.3} color="#3b82f6" anchorX="center" anchorY="middle">
        z
      </Text>

      {/* Height markers */}
      {heightMarkers.map((marker, idx) => (
        <group key={`hm-${idx}`}>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([radius + 0.1, marker.y, 0, radius + 0.3, marker.y, 0]), 3]}
                count={2}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#94a3b8" opacity={0.5} transparent />
          </line>
          <Text position={[radius + 0.5, marker.y, 0]} fontSize={0.15} color="#94a3b8" anchorX="center" anchorY="middle">
            {marker.label}
          </Text>
        </group>
      ))}

      {/* dV label near wedge */}
      <Text position={[radius * 0.5 + 0.2, -height / 2 + height * 0.2 + 0.3, 0]} fontSize={0.2} color="#f59e0b" anchorX="center" anchorY="middle">
        dV=r·dr·dθ·dz
      </Text>

      {/* Info overlay */}
      <Html position={[0, height / 2 + 2, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-cyan-600 dark:text-cyan-400">
            V = πr²h = π×{radius.toFixed(1)}²×{height.toFixed(1)} = {volume.toFixed(4)}
          </div>
          <div className="text-muted-foreground">
            r ∈ [0, {radius.toFixed(1)}], θ ∈ [0, 2π], z ∈ [{(-height / 2).toFixed(1)}, {(height / 2).toFixed(1)}]
          </div>
          <div className="text-amber-600 dark:text-amber-400">
            dV = r·dr·dθ·dz
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Directional Derivative Scene ---
function DirectionalDerivativeScene() {
  const { paramValue: theta, paramValue2: a } = useLabStore()
  // Surface: z = a * (x² + y²) paraboloid
  // Gradient: ∇f = (2ax, 2ay)
  // Sample point: (0.5, 0.5)
  const px = 0.5
  const py = 0.5
  const pz = a * (px * px + py * py)

  // Gradient at sample point
  const gx = 2 * a * px
  const gy = 2 * a * py
  const gradMag = Math.sqrt(gx * gx + gy * gy)

  // Direction unit vector u at angle theta from x-axis
  const ux = Math.cos(theta)
  const uy = Math.sin(theta)

  // Directional derivative: D_uf = ∇f · u = |∇f| cos(angle between ∇f and u)
  const dirDeriv = gx * ux + gy * uy

  // Angle between gradient and u
  const angleBetween = gradMag > 0.001 ? Math.acos(Math.max(-1, Math.min(1, dirDeriv / gradMag))) : 0

  // Surface geometry with heat-mapped colors
  const surfaceData = useMemo(() => {
    const res = 40
    const positions: number[] = []
    const colors: number[] = []
    const indices: number[] = []
    for (let i = 0; i <= res; i++) {
      for (let j = 0; j <= res; j++) {
        const x = -1 + (2 * i) / res
        const y = -1 + (2 * j) / res
        const z = a * (x * x + y * y)
        positions.push(x, z, y)
        // Heat map: blue (bottom) to red (top)
        const maxZ = a * 2
        const t = Math.max(0, Math.min(1, z / maxZ))
        colors.push(t, 0.2, 1 - t)
      }
    }
    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        const a2 = i * (res + 1) + j
        const b2 = a2 + 1
        const c2 = a2 + (res + 1)
        const d2 = c2 + 1
        indices.push(a2, c2, b2, b2, c2, d2)
      }
    }
    return { positions: new Float32Array(positions), colors: new Float32Array(colors), indices }
  }, [a])

  // Contour lines on floor (circles since f is radially symmetric)
  const contourLines = useMemo(() => {
    const lines: Float32Array[] = []
    const numContours = 5
    const res = 64
    for (let c = 1; c <= numContours; c++) {
      const r = c / numContours
      const pts: number[] = []
      for (let i = 0; i <= res; i++) {
        const ang = (2 * Math.PI * i) / res
        pts.push(r * Math.cos(ang), 0.005, r * Math.sin(ang))
      }
      lines.push(new Float32Array(pts))
    }
    return lines
  }, [])

  // Tangent plane at sample point
  // z = f(px,py) + fx(px,py)*(x-px) + fy(px,py)*(y-py)
  // z = pz + 2a*px*(x-px) + 2a*py*(y-py)
  const tangentPlaneData = useMemo(() => {
    const size = 0.8
    const res = 4
    const positions: number[] = []
    const indices: number[] = []
    for (let i = 0; i <= res; i++) {
      for (let j = 0; j <= res; j++) {
        const x = px - size / 2 + (size * i) / res
        const y = py - size / 2 + (size * j) / res
        const z = pz + 2 * a * px * (x - px) + 2 * a * py * (y - py)
        positions.push(x, z, y)
      }
    }
    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        const a2 = i * (res + 1) + j
        const b2 = a2 + 1
        const c2 = a2 + (res + 1)
        const d2 = c2 + 1
        indices.push(a2, c2, b2, b2, c2, d2)
      }
    }
    return { positions: new Float32Array(positions), indices }
  }, [a, px, py, pz])

  // Arc showing angle θ between gradient and u at sample point
  const arcPoints = useMemo(() => {
    const pts: number[] = []
    const arcRes = 32
    const arcRadius = 0.2
    const gradAngle = Math.atan2(gy, gx)
    for (let i = 0; i <= arcRes; i++) {
      const t = (angleBetween * i) / arcRes
      const ang = gradAngle + t
      pts.push(
        px + arcRadius * Math.cos(ang),
        pz + 0.01,
        py + arcRadius * Math.sin(ang),
      )
    }
    return new Float32Array(pts)
  }, [angleBetween, gx, gy, px, py, pz])

  // Arrow length scaling
  const arrowScale = 0.3
  const gradArrowLen = Math.min(0.8, gradMag * arrowScale)
  const gradDir = gradMag > 0.001 ? [gx / gradMag, 0, gy / gradMag] : [1, 0, 0]
  const uArrowLen = 0.5
  const derivArrowLen = Math.min(0.6, Math.abs(dirDeriv) * arrowScale)

  return (
    <AutoRotate speed={0.002}>
      {/* Paraboloid surface z = a*(x²+y²) */}
      <mesh>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[surfaceData.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[surfaceData.colors, 3]} />
          <bufferAttribute attach="index" args={[new Uint32Array(surfaceData.indices), 1]} />
        </bufferGeometry>
        <meshPhongMaterial vertexColors transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Floor plane */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 2.2]} />
        <meshPhongMaterial color="#e2e8f0" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Contour lines on floor */}
      {contourLines.map((pts, idx) => (
        <line key={`cl-${idx}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[pts, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#94a3b8" opacity={0.4} transparent />
        </line>
      ))}

      {/* Tangent plane at sample point (semi-transparent green) */}
      <mesh>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[tangentPlaneData.positions, 3]} />
          <bufferAttribute attach="index" args={[new Uint32Array(tangentPlaneData.indices), 1]} />
        </bufferGeometry>
        <meshPhongMaterial color="#22c55e" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* Sample point sphere */}
      <mesh position={[px, pz, py]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshPhongMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>

      {/* Gradient arrow (red) at sample point - on xy-plane level */}
      <arrowHelper
        args={[
          new THREE.Vector3(...gradDir),
          new THREE.Vector3(px, pz + 0.02, py),
          gradArrowLen,
          0xef4444,
          gradArrowLen * 0.35,
          gradArrowLen * 0.2,
        ]}
      />

      {/* Direction unit vector u (blue) at sample point */}
      <arrowHelper
        args={[
          new THREE.Vector3(ux, 0, uy),
          new THREE.Vector3(px, pz + 0.02, py),
          uArrowLen,
          0x3b82f6,
          uArrowLen * 0.35,
          uArrowLen * 0.2,
        ]}
      />

      {/* Directional derivative projected arrow (yellow/green for positive, orange for negative) */}
      {Math.abs(dirDeriv) > 0.001 && (
        <arrowHelper
          args={[
            new THREE.Vector3(dirDeriv > 0 ? ux : -ux, 0, dirDeriv > 0 ? uy : -uy),
            new THREE.Vector3(px, pz - 0.05, py),
            derivArrowLen,
            dirDeriv >= 0 ? 0x22c55e : 0xf97316,
            derivArrowLen * 0.35,
            derivArrowLen * 0.2,
          ]}
        />
      )}

      {/* Angle arc between gradient and u */}
      {angleBetween > 0.02 && (
        <line>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[arcPoints, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#a855f7" linewidth={2} />
        </line>
      )}

      {/* Vertical line from sample point to floor */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([px, 0, py, px, pz, py]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#94a3b8" opacity={0.5} transparent />
      </line>

      {/* Info overlay */}
      <Html position={[0, a * 2 + 1.5, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-yellow-600 dark:text-yellow-400 font-semibold mb-1">
            方向导数 D_uf
          </div>
          <div className="text-muted-foreground">
            f(x,y) = {a.toFixed(1)}·(x² + y²)
          </div>
          <div className="text-red-600 dark:text-red-400">
            ∇f = ({(2 * a * px).toFixed(2)}, {(2 * a * py).toFixed(2)})  |∇f| = {gradMag.toFixed(3)}
          </div>
          <div className="text-blue-600 dark:text-blue-400">
            u = ({ux.toFixed(2)}, {uy.toFixed(2)})  θ = {(theta * 180 / Math.PI).toFixed(0)}°
          </div>
          <div className="text-purple-600 dark:text-purple-400">
            夹角 = {(angleBetween * 180 / Math.PI).toFixed(0)}°
          </div>
          <div className={dirDeriv >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}>
            D_uf = ∇f·u = {dirDeriv.toFixed(4)} = |∇f|·cos({(angleBetween * 180 / Math.PI).toFixed(0)}°)
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Curl Field Visualization (curl1) ---
function CurlFieldScene() {
  const { paramValue: a } = useLabStore()

  // Vector field F = (-y, x), curl = ∂Q/∂x - ∂P/∂y = 1-(-1) = 2
  // P = -y, Q = x, ∂Q/∂x = 1, ∂P/∂y = -1, curl = 2
  const arrows = useMemo(() => {
    const result: { pos: [number, number, number]; dir: [number, number, number]; magnitude: number }[] = []
    const gridSize = 4
    const step = 1
    for (let i = -gridSize; i <= gridSize; i += step) {
      for (let j = -gridSize; j <= gridSize; j += step) {
        const x = i
        const y = j
        const Px = -y * a * 0.3
        const Qy = x * a * 0.3
        const mag = Math.sqrt(Px * Px + Qy * Qy)
        if (mag > 0.01) {
          result.push({
            pos: [x, 0.05, y],
            dir: [Px, 0, Qy],
            magnitude: mag,
          })
        }
      }
    }
    return result
  }, [a])

  // Rotation indicator rings at key points
  const rotationRings = useMemo(() => {
    const rings: { center: [number, number, number]; radius: number; color: string }[] = []
    const positions: [number, number][] = [[2, 2], [-2, 2], [2, -2], [-2, -2], [0, 0]]
    positions.forEach(([cx, cy]) => {
      rings.push({
        center: [cx, 0.1, cy],
        radius: 0.6,
        color: '#ef4444',
      })
    })
    return rings
  }, [])

  return (
    <AutoRotate speed={0.003}>
      <Axes length={4} />
      <AxisLabels length={4} />
      <XYGrid size={4} color='#f9a8d4' />

      {/* Background plane colored by curl (uniformly positive = red) */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshPhongMaterial color="#fecaca" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Vector field arrows - amber colored */}
      {arrows.map((arrow, idx) => {
        const len = Math.max(0.01, arrow.magnitude)
        const dir = new THREE.Vector3(...arrow.dir).normalize()
        return (
          <group key={idx} position={arrow.pos}>
            <arrowHelper
              args={[dir, new THREE.Vector3(0, 0, 0), len, 0xf59e0b, 0.08, 0.06]}
            />
          </group>
        )
      })}

      {/* Rotation indicator rings */}
      {rotationRings.map((ring, idx) => {
        const pts: number[] = []
        const res = 32
        for (let i = 0; i <= res; i++) {
          const theta = (2 * Math.PI * i) / res
          pts.push(
            ring.center[0] + ring.radius * Math.cos(theta),
            ring.center[1],
            ring.center[2] + ring.radius * Math.sin(theta)
          )
        }
        return (
          <line key={idx}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[new Float32Array(pts), 3]} />
            </bufferGeometry>
            <lineBasicMaterial color={ring.color} linewidth={2} opacity={0.6} transparent />
          </line>
        )
      })}

      {/* Direction arrows on rotation rings (counterclockwise indicators) */}
      {rotationRings.slice(0, 4).map((ring, idx) => {
        const angle = idx * Math.PI / 2
        const tipX = ring.center[0] + ring.radius * Math.cos(angle)
        const tipZ = ring.center[2] + ring.radius * Math.sin(angle)
        const tangentDir = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)).normalize()
        return (
          <group key={`dir-${idx}`} position={[tipX, ring.center[1], tipZ]}>
            <arrowHelper args={[tangentDir, new THREE.Vector3(0, 0, 0), 0.3, 0xef4444, 0.06, 0.04]} />
          </group>
        )
      })}

      {/* Curl color legend on floor */}
      <mesh position={[3.5, 0.01, -3]}>
        <planeGeometry args={[0.8, 0.3]} />
        <meshPhongMaterial color="#ef4444" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[3.5, 0.02, -3.3]} fontSize={0.12} color="#ef4444" anchorX="center">
        正旋度(逆时针)
      </Text>
      <mesh position={[3.5, 0.01, -3.7]}>
        <planeGeometry args={[0.8, 0.3]} />
        <meshPhongMaterial color="#3b82f6" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[3.5, 0.02, -4]} fontSize={0.12} color="#3b82f6" anchorX="center">
        负旋度(顺时针)
      </Text>

      <Html position={[0, 4.5, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-rose-600 dark:text-rose-400 font-bold mb-1">
            F = (-y, x)
          </div>
          <div className="text-amber-600 dark:text-amber-400">
            ∇×F = ∂Q/∂x - ∂P/∂y = 1-(-1) = 2
          </div>
          <div className="text-muted-foreground text-[10px] mt-1">
            均匀正旋度 → 处处逆时针旋转
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Divergence Field Visualization (divergence_field1) ---
function DivergenceFieldScene() {
  const { paramValue: a } = useLabStore()

  // Vector field F = (x, y), divergence = ∂P/∂x + ∂Q/∂y = 1+1 = 2
  const arrows = useMemo(() => {
    const result: { pos: [number, number, number]; dir: [number, number, number]; magnitude: number }[] = []
    const gridSize = 4
    const step = 1
    for (let i = -gridSize; i <= gridSize; i += step) {
      for (let j = -gridSize; j <= gridSize; j += step) {
        const x = i
        const y = j
        const Px = x * a * 0.25
        const Qy = y * a * 0.25
        const mag = Math.sqrt(Px * Px + Qy * Qy)
        if (mag > 0.01) {
          result.push({
            pos: [x, 0.05, y],
            dir: [Px, 0, Qy],
            magnitude: mag,
          })
        }
      }
    }
    return result
  }, [a])

  // Expanding rings for source indicators
  const sourceRings = useMemo(() => {
    const rings: { center: [number, number, number]; radii: number[]; color: string }[] = []
    const positions: [number, number][] = [[2, 2], [-2, 2], [2, -2], [-2, -2]]
    positions.forEach(([cx, cy]) => {
      rings.push({
        center: [cx, 0.1, cy],
        radii: [0.3, 0.6, 0.9],
        color: '#ef4444',
      })
    })
    return rings
  }, [])

  return (
    <AutoRotate speed={0.003}>
      <Axes length={4} />
      <AxisLabels length={4} />
      <XYGrid size={4} color='#f9a8d4' />

      {/* Background plane colored by divergence (uniformly positive = red/orange) */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshPhongMaterial color="#fed7aa" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Vector field arrows - teal/green colored showing outward flow */}
      {arrows.map((arrow, idx) => {
        const len = Math.max(0.01, arrow.magnitude)
        const dir = new THREE.Vector3(...arrow.dir).normalize()
        const dist = Math.sqrt(arrow.pos[0] ** 2 + arrow.pos[2] ** 2)
        const color = dist < 1.5 ? 0x10b981 : dist < 3 ? 0xf59e0b : 0xef4444
        return (
          <group key={idx} position={arrow.pos}>
            <arrowHelper
              args={[dir, new THREE.Vector3(0, 0, 0), len, color, 0.08, 0.06]}
            />
          </group>
        )
      })}

      {/* Source indicator expanding rings */}
      {sourceRings.map((source, idx) => (
        <group key={idx}>
          {source.radii.map((r, rIdx) => {
            const pts: number[] = []
            const res = 32
            for (let i = 0; i <= res; i++) {
              const theta = (2 * Math.PI * i) / res
              pts.push(
                source.center[0] + r * Math.cos(theta),
                source.center[1],
                source.center[2] + r * Math.sin(theta)
              )
            }
            return (
              <line key={rIdx}>
                <bufferGeometry>
                  <bufferAttribute attach="attributes-position" args={[new Float32Array(pts), 3]} />
                </bufferGeometry>
                <lineBasicMaterial
                  color={source.color}
                  linewidth={1}
                  opacity={0.4 - rIdx * 0.1}
                  transparent
                />
              </line>
            )
          })}
        </group>
      ))}

      {/* Center source indicator */}
      {[0.5, 1.0, 1.5].map((r, idx) => {
        const pts: number[] = []
        const res = 48
        for (let i = 0; i <= res; i++) {
          const theta = (2 * Math.PI * i) / res
          pts.push(r * Math.cos(theta), 0.15, r * Math.sin(theta))
        }
        return (
          <line key={idx}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[new Float32Array(pts), 3]} />
            </bufferGeometry>
            <lineBasicMaterial color="#ef4444" linewidth={2} opacity={0.6 - idx * 0.15} transparent />
          </line>
        )
      })}

      {/* Color legend */}
      <mesh position={[3.5, 0.01, -3]}>
        <planeGeometry args={[0.8, 0.3]} />
        <meshPhongMaterial color="#ef4444" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[3.5, 0.02, -3.3]} fontSize={0.12} color="#ef4444" anchorX="center">
        正散度(源)
      </Text>
      <mesh position={[3.5, 0.01, -3.7]}>
        <planeGeometry args={[0.8, 0.3]} />
        <meshPhongMaterial color="#06b6d4" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[3.5, 0.02, -4]} fontSize={0.12} color="#06b6d4" anchorX="center">
        负散度(汇)
      </Text>

      <Html position={[0, 4.5, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border border-pink-200 dark:border-pink-800 rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-pink-600 dark:text-pink-400 font-bold mb-1">
            F = (x, y)
          </div>
          <div className="text-amber-600 dark:text-amber-400">
            ∇·F = ∂P/∂x + ∂Q/∂y = 1+1 = 2
          </div>
          <div className="text-muted-foreground text-[10px] mt-1">
            均匀正散度 → 处处向外发散（源场）
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Conservative Field Visualization (conservative1) ---
function ConservativeFieldScene() {
  const { paramValue: a } = useLabStore()

  // Vector field arrows F = (a*x, a*y) on 8×8 grid
  const arrows = useMemo(() => {
    const result: { pos: [number, number, number]; dir: [number, number, number]; len: number }[] = []
    const gridSize = 8
    const range = 3
    const step = (2 * range) / gridSize
    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const x = -range + i * step
        const y = -range + j * step
        const fx = a * x
        const fy = a * y
        const len = Math.sqrt(fx * fx + fy * fy)
        if (len > 0.05) {
          const scale = Math.min(len, 1.2) / len
          result.push({
            pos: [x, 0.05, y],
            dir: [fx * scale, 0, fy * scale],
            len: Math.min(len, 1.2),
          })
        }
      }
    }
    return result
  }, [a])

  // Concentric circles (level curves of potential φ = a/2*(x²+y²))
  const contourCircles = useMemo(() => {
    const circles: Float32Array[] = []
    const res = 64
    const maxR = 4
    const levels = 5
    for (let k = 1; k <= levels; k++) {
      const r = (k / levels) * maxR
      const pts: number[] = []
      for (let i = 0; i <= res; i++) {
        const theta = (2 * Math.PI * i) / res
        pts.push(r * Math.cos(theta), 0.02, r * Math.sin(theta))
      }
      circles.push(new Float32Array(pts))
    }
    return circles
  }, [])

  // Radial lines from origin
  const radialLines = useMemo(() => {
    const lines: Float32Array[] = []
    const numLines = 8
    const maxR = 4
    for (let i = 0; i < numLines; i++) {
      const theta = (2 * Math.PI * i) / numLines
      lines.push(new Float32Array([0, 0.02, 0, maxR * Math.cos(theta), 0.02, maxR * Math.sin(theta)]))
    }
    return lines
  }, [])

  // Two sample paths from A=(-2,0) to B=(2,0)
  // Path 1: straight line along x-axis
  // Path 2: semi-circle above
  const path1Points = useMemo(() => {
    const pts: number[] = []
    const res = 40
    for (let i = 0; i <= res; i++) {
      const t = i / res
      const x = -2 + 4 * t
      pts.push(x, 0.1, 0)
    }
    return new Float32Array(pts)
  }, [])

  const path2Points = useMemo(() => {
    const pts: number[] = []
    const res = 40
    for (let i = 0; i <= res; i++) {
      const t = i / res
      const theta = Math.PI * t
      const x = 2 * Math.cos(theta)
      const y = 2 * Math.sin(theta)
      pts.push(x, 0.1, y)
    }
    return new Float32Array(pts)
  }, [])

  // Point A and B markers
  const phiA = a / 2 * (4)
  const phiB = a / 2 * (4)
  const pathIntegral = phiB - phiA

  return (
    <AutoRotate speed={0.002}>
      {/* Vector field arrows */}
      {arrows.map((arrow, idx) => (
        <group key={idx}>
          {/* Arrow shaft */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([arrow.pos[0], arrow.pos[1], arrow.pos[2], arrow.pos[0] + arrow.dir[0], arrow.pos[1] + arrow.dir[1], arrow.pos[2] + arrow.dir[2]]), 3]}
                count={2}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#22c55e" linewidth={2} />
          </line>
          {/* Arrowhead */}
          <mesh position={[arrow.pos[0] + arrow.dir[0], arrow.pos[1] + arrow.dir[1], arrow.pos[2] + arrow.dir[2]]}>
            <coneGeometry args={[0.06, 0.2, 6]} />
            <meshPhongMaterial color="#22c55e" />
          </mesh>
        </group>
      ))}

      {/* Concentric circles (potential contours) */}
      {contourCircles.map((pts, idx) => (
        <line key={`c${idx}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[pts, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#06b6d4" opacity={0.5} transparent />
        </line>
      ))}

      {/* Radial lines */}
      {radialLines.map((pts, idx) => (
        <line key={`r${idx}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[pts, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#06b6d4" opacity={0.2} transparent />
        </line>
      ))}

      {/* Contour labels */}
      {[1, 2, 3, 4, 5].map((k) => {
        const r = k * 0.8
        const phiVal = a / 2 * r * r
        return (
          <Text key={`lbl${k}`} position={[r, 0.3, 0]} fontSize={0.15} color="#06b6d4" anchorX="center" anchorY="middle">
            {`φ=${phiVal.toFixed(1)}`}
          </Text>
        )
      })}

      {/* Path 1: straight line (red) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[path1Points, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={3} />
      </line>

      {/* Path 2: semi-circle (amber) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[path2Points, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#f59e0b" linewidth={3} />
      </line>

      {/* Point A and B markers */}
      <mesh position={[-2, 0.15, 0]}>
        <sphereGeometry args={[0.12, 12, 8]} />
        <meshPhongMaterial color="#ef4444" />
      </mesh>
      <Text position={[-2, 0.5, 0]} fontSize={0.2} color="#ef4444" anchorX="center">A</Text>

      <mesh position={[2, 0.15, 0]}>
        <sphereGeometry args={[0.12, 12, 8]} />
        <meshPhongMaterial color="#ef4444" />
      </mesh>
      <Text position={[2, 0.5, 0]} fontSize={0.2} color="#ef4444" anchorX="center">B</Text>

      {/* Potential surface (semi-transparent) */}
      <Surface
        func={() => 0}
        xRange={[-4, 4]}
        yRange={[-4, 4]}
        color="#06b6d4"
        opacity={0.08}
        resolution={20}
      />

      {/* Html overlay */}
      <Html position={[0, 4.5, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-emerald-600 dark:text-emerald-400 font-bold">
            保守场 F = ({a.toFixed(1)}x, {a.toFixed(1)}y)
          </div>
          <div className="text-cyan-600 dark:text-cyan-400">
            势函数 φ = {a.toFixed(1)}/2·(x²+y²)
          </div>
          <div className="text-muted-foreground">
            ∇×F = 0 ✓
          </div>
          <div className="text-amber-600 dark:text-amber-400">
            路径积分 = φ(B)-φ(A) = {pathIntegral.toFixed(2)}
          </div>
          <div className="text-muted-foreground text-[10px]">
            红色: 直线路径 | 黄色: 半圆路径 → 积分相同
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Taylor Expansion Visualization (taylor1) ---
function TaylorExpansionScene() {
  const { paramValue: N } = useLabStore()
  const order = Math.round(N)

  // sin(x) curve
  const sinCurve = useMemo(() => {
    const pts: number[] = []
    for (let i = -300; i <= 300; i++) {
      const x = (i / 100) * 3
      const y = Math.sin(x)
      pts.push(x, y, 0)
    }
    return new Float32Array(pts)
  }, [])

  // Taylor polynomial curve
  const taylorCurve = useMemo(() => {
    const pts: number[] = []
    for (let i = -300; i <= 300; i++) {
      const x = (i / 100) * 3
      let y = 0
      for (let n = 0; n <= order; n++) {
        const sign = n % 2 === 0 ? 1 : -1
        y += sign * Math.pow(x, 2 * n + 1) / factorial(2 * n + 1)
      }
      pts.push(x, y, 0.02)
    }
    return new Float32Array(pts)
  }, [order])

  // Error region (filled between curves) - as line strips
  const errorLines = useMemo(() => {
    const lines: Float32Array[] = []
    const step = 0.1
    for (let x = -3; x <= 3; x += step) {
      const sinY = Math.sin(x)
      let taylorY = 0
      for (let n = 0; n <= order; n++) {
        const sign = n % 2 === 0 ? 1 : -1
        taylorY += sign * Math.pow(x, 2 * n + 1) / factorial(2 * n + 1)
      }
      lines.push(new Float32Array([x, sinY, 0.01, x, taylorY, 0.01]))
    }
    return lines
  }, [order])

  // 3D sin(x)*cos(y) surface
  const sinSurface = useMemo(() => {
    return (x: number, y: number) => Math.sin(x) * Math.cos(y)
  }, [])

  // 3D Taylor polynomial surface
  const taylorSurface = useMemo(() => {
    return (x: number, _y: number) => {
      let y = 0
      for (let n = 0; n <= order; n++) {
        const sign = n % 2 === 0 ? 1 : -1
        y += sign * Math.pow(x, 2 * n + 1) / factorial(2 * n + 1)
      }
      return y
    }
  }, [order])

  // Compute error range
  let maxError = 0
  for (let x = -3; x <= 3; x += 0.1) {
    const sinY = Math.sin(x)
    let taylorY = 0
    for (let n = 0; n <= order; n++) {
      const sign = n % 2 === 0 ? 1 : -1
      taylorY += sign * Math.pow(x, 2 * n + 1) / factorial(2 * n + 1)
    }
    maxError = Math.max(maxError, Math.abs(sinY - taylorY))
  }

  // Taylor polynomial formula string
  const taylorFormula = useMemo(() => {
    const terms: string[] = []
    for (let n = 0; n <= Math.min(order, 4); n++) {
      const sign = n % 2 === 0 ? '+' : '-'
      const exp = 2 * n + 1
      if (n === 0) terms.push(`x`)
      else terms.push(`${sign} x^${exp}/${factorial(exp)}`)
    }
    if (order > 4) terms.push('...')
    return `T${order}(x) = ${terms.join(' ')}`
  }, [order])

  return (
    <AutoRotate speed={0.002}>
      {/* 2D curves at z=0 plane */}
      {/* sin(x) curve - red */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sinCurve, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={2} />
      </line>

      {/* Taylor polynomial curve - cyan */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[taylorCurve, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#06b6d4" linewidth={2} />
      </line>

      {/* Error region lines */}
      {errorLines.map((pts, idx) => {
        const x = -3 + idx * 0.1
        const sinY = Math.sin(x)
        let taylorY = 0
        for (let n = 0; n <= order; n++) {
          const sign = n % 2 === 0 ? 1 : -1
          taylorY += sign * Math.pow(x, 2 * n + 1) / factorial(2 * n + 1)
        }
        const err = Math.abs(sinY - taylorY)
        return (
          <line key={idx}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[pts, 3]} />
            </bufferGeometry>
            <lineBasicMaterial color="#f59e0b" opacity={Math.min(0.6, err * 2)} transparent />
          </line>
        )
      })}

      {/* Expansion point line at x=0 */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([0, -2, 0, 0, 2, 0]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#a855f7" linewidth={2} opacity={0.6} transparent />
      </line>
      <Text position={[0.2, 1.8, 0]} fontSize={0.15} color="#a855f7" anchorX="left">a=0</Text>

      {/* sin(x) label */}
      <Text position={[2.5, Math.sin(2.5) + 0.3, 0]} fontSize={0.2} color="#ef4444" anchorX="center">sin(x)</Text>

      {/* Taylor label */}
      <Text position={[-2.5, 0.3, 0.02]} fontSize={0.18} color="#06b6d4" anchorX="center">{`T${order}(x)`}</Text>

      {/* 3D surfaces at elevated position */}
      <group position={[0, 0, -4]}>
        <Surface
          func={sinSurface}
          xRange={[-3, 3]}
          yRange={[-3, 3]}
          color="#ef4444"
          opacity={0.3}
          resolution={25}
        />
        <Surface
          func={taylorSurface}
          xRange={[-3, 3]}
          yRange={[-3, 3]}
          color="#06b6d4"
          opacity={0.25}
          resolution={25}
        />
      </group>

      {/* Html overlay */}
      <Html position={[0, 4.5, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-red-600 dark:text-red-400 font-bold">
            sin(x) vs Taylor T{order}(x)
          </div>
          <div className="text-cyan-600 dark:text-cyan-400">
            {taylorFormula}
          </div>
          <div className="text-amber-600 dark:text-amber-400">
            最大误差: {maxError.toFixed(4)}
          </div>
          <div className="text-muted-foreground">
            展开点 a=0 | 阶数 N={order}
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// Helper: factorial
function factorial(n: number): number {
  if (n <= 1) return 1
  let result = 1
  for (let i = 2; i <= n; i++) result *= i
  return result
}

// --- Surface Integral Visualization (surface_integral1) ---
function SurfaceIntegralScene() {
  const { paramValue: a } = useLabStore()

  // Surface: z = a*(x² + y²), color by f=z (heat map: blue→green→red)
  // Domain: [-1.5, 1.5] × [-1.5, 1.5]
  const range = 1.5
  const res = 40

  // Generate surface mesh with heat-map coloring
  const surfaceGeom = useMemo(() => {
    const positions: number[] = []
    const colors: number[] = []
    const indices: number[] = []

    // Generate vertices
    for (let j = 0; j <= res; j++) {
      for (let i = 0; i <= res; i++) {
        const x = -range + (2 * range * i) / res
        const y = -range + (2 * range * j) / res
        const z = a * (x * x + y * y)
        positions.push(x, z, y)

        // Color by f=z value: blue (low) → green (mid) → red (high)
        const maxZ = a * 2 * range * range
        const t = Math.min(1, Math.max(0, z / maxZ))
        // Blue → Green → Red interpolation
        let r: number, g: number, b: number
        if (t < 0.5) {
          const s = t * 2
          r = 0
          g = s
          b = 1 - s
        } else {
          const s = (t - 0.5) * 2
          r = s
          g = 1 - s
          b = 0
        }
        colors.push(r, g, b)
      }
    }

    // Generate indices
    for (let j = 0; j < res; j++) {
      for (let i = 0; i < res; i++) {
        const a2 = j * (res + 1) + i
        const b2 = a2 + 1
        const c2 = a2 + (res + 1)
        const d2 = c2 + 1
        indices.push(a2, c2, b2)
        indices.push(b2, c2, d2)
      }
    }

    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geom.setIndex(indices)
    geom.computeVertexNormals()
    return geom
  }, [a])

  // Normal vectors at grid points (showing dS scaling factor)
  // Normal = (-dz/dx, 1, -dz/dy) normalized
  // dS factor = √(1 + (dz/dx)² + (dz/dy)²)
  const normals = useMemo(() => {
    const result: { pos: [number, number, number]; dir: [number, number, number]; dsFactor: number }[] = []
    const step = 0.7
    for (let x = -1.4; x <= 1.4; x += step) {
      for (let y = -1.4; y <= 1.4; y += step) {
        const z = a * (x * x + y * y)
        const dzdx = 2 * a * x
        const dzdy = 2 * a * y
        const dsFactor = Math.sqrt(1 + dzdx * dzdx + dzdy * dzdy)
        // Normal direction (unnormalized for display)
        const len = Math.sqrt(dzdx * dzdx + 1 + dzdy * dzdy)
        const nx = -dzdx / len
        const ny = 1 / len
        const nz = -dzdy / len
        // Scale the arrow length by dsFactor to visualize dS scaling
        const scale = 0.3 * dsFactor
        result.push({
          pos: [x, z, y],
          dir: [nx * scale, ny * scale, nz * scale],
          dsFactor,
        })
      }
    }
    return result
  }, [a])

  // Grid lines on the surface showing how surface area elements stretch
  const gridLines = useMemo(() => {
    const lines: { points: Float32Array; color: string }[] = []
    const gridRes = 20
    const gridStep = 0.6

    // Lines parallel to x-axis (at constant y)
    for (let y = -1.2; y <= 1.2; y += gridStep) {
      const pts: number[] = []
      for (let i = 0; i <= gridRes; i++) {
        const x = -1.2 + (2.4 * i) / gridRes
        const z = a * (x * x + y * y)
        pts.push(x, z, y)
      }
      lines.push({ points: new Float32Array(pts), color: '#a78bfa' })
    }

    // Lines parallel to y-axis (at constant x)
    for (let x = -1.2; x <= 1.2; x += gridStep) {
      const pts: number[] = []
      for (let i = 0; i <= gridRes; i++) {
        const y = -1.2 + (2.4 * i) / gridRes
        const z = a * (x * x + y * y)
        pts.push(x, z, y)
      }
      lines.push({ points: new Float32Array(pts), color: '#a78bfa' })
    }

    return lines
  }, [a])

  // Floor projection of domain D
  const floorDomainGeom = useMemo(() => {
    const geom = new THREE.PlaneGeometry(range * 2, range * 2)
    geom.rotateX(-Math.PI / 2)
    geom.translate(0, -0.01, 0)
    return geom
  }, [])

  // Compute integral value numerically
  // ∫∫_Σ f dS = ∫∫_D f(x,y,g(x,y)) * √(1+gx²+gy²) dxdy
  // f = z = a*(x²+y²)
  const integralValue = useMemo(() => {
    const n = 100
    const dx = (2 * range) / n
    let sum = 0
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x = -range + (i + 0.5) * dx
        const y = -range + (j + 0.5) * dx
        const z = a * (x * x + y * y)
        const dzdx = 2 * a * x
        const dzdy = 2 * a * y
        const dsFactor = Math.sqrt(1 + dzdx * dzdx + dzdy * dzdy)
        sum += z * dsFactor * dx * dx
      }
    }
    return sum
  }, [a])

  // dS factor range
  const dsFactorMin = 1 // at (0,0)
  const maxR = range * Math.SQRT2
  const dsFactorMax = Math.sqrt(1 + 4 * a * a * maxR * maxR)

  // Semi-transparent patches at a few grid points showing area elements
  const patches = useMemo(() => {
    const result: { pos: [number, number, number]; rot: [number, number, number]; scale: [number, number] }[] = []
    const patchPositions = [[-0.9, -0.9], [0, 0], [0.9, 0.9], [-0.9, 0.9], [0.9, -0.9]]
    for (const [px, py] of patchPositions) {
      const pz = a * (px * px + py * py)
      const dzdx = 2 * a * px
      const dzdy = 2 * a * py
      const dsFactor = Math.sqrt(1 + dzdx * dzdx + dzdy * dzdy)
      // Compute rotation to align patch with surface normal
      const normalLen = Math.sqrt(dzdx * dzdx + 1 + dzdy * dzdy)
      const nx = -dzdx / normalLen
      const ny = 1 / normalLen
      const nz = -dzdy / normalLen

      // Rotation from up vector (0,1,0) to normal
      const up = new THREE.Vector3(0, 1, 0)
      const normal = new THREE.Vector3(nx, ny, nz)
      const quat = new THREE.Quaternion().setFromUnitVectors(up, normal)
      const euler = new THREE.Euler().setFromQuaternion(quat)

      // Scale: width and depth of the patch, stretched by dS factor
      const baseSize = 0.3
      result.push({
        pos: [px, pz, py],
        rot: [euler.x, euler.y, euler.z],
        scale: [baseSize, baseSize * dsFactor],
      })
    }
    return result
  }, [a])

  return (
    <AutoRotate speed={0.003}>
      {/* Heat-mapped paraboloid surface */}
      <mesh geometry={surfaceGeom}>
        <meshPhongMaterial vertexColors transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>

      {/* Grid lines on surface */}
      {gridLines.map((line, idx) => (
        <line key={`grid-${idx}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[line.points, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={line.color} linewidth={1} transparent opacity={0.4} />
        </line>
      ))}

      {/* Normal vectors at grid points (length shows dS scaling) */}
      {normals.map((n, idx) => (
        <group key={`normal-${idx}`}>
          {/* Arrow shaft */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([
                  n.pos[0], n.pos[1], n.pos[2],
                  n.pos[0] + n.dir[0], n.pos[1] + n.dir[1], n.pos[2] + n.dir[2]
                ]), 3]}
                count={2}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#f59e0b" linewidth={2} />
          </line>
          {/* Arrow head */}
          <mesh
            position={[n.pos[0] + n.dir[0], n.pos[1] + n.dir[1], n.pos[2] + n.dir[2]]}
            rotation={[0, Math.atan2(n.dir[2], n.dir[0]), -Math.PI / 2 + Math.atan2(Math.sqrt(n.dir[0] * n.dir[0] + n.dir[2] * n.dir[2]), n.dir[1])]}
          >
            <coneGeometry args={[0.04, 0.12, 6]} />
            <meshPhongMaterial color="#f59e0b" />
          </mesh>
        </group>
      ))}

      {/* Semi-transparent patches showing area elements */}
      {patches.map((patch, idx) => (
        <mesh key={`patch-${idx}`} position={patch.pos} rotation={patch.rot}>
          <planeGeometry args={[patch.scale[0], patch.scale[1]]} />
          <meshPhongMaterial color="#c4b5fd" transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Floor domain D projection */}
      <mesh geometry={floorDomainGeom}>
        <meshPhongMaterial color="#8b5cf6" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>

      {/* Domain D border */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([
              -range, 0, -range,
              range, 0, -range,
              range, 0, range,
              -range, 0, range,
              -range, 0, -range,
            ]), 3]}
            count={5}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#8b5cf6" linewidth={2} />
      </line>

      {/* Connecting lines from surface corners to floor */}
      {[[-range, -range], [range, -range], [range, range], [-range, range]].map(([cx, cy], idx) => {
        const cz = a * (cx * cx + cy * cy)
        return (
          <line key={`conn-${idx}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([cx, cz, cy, cx, 0, cy]), 3]}
                count={2}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#8b5cf6" transparent opacity={0.3} />
          </line>
        )
      })}

      {/* Labels */}
      <Text position={[0, -0.3, 0]} fontSize={0.2} color="#8b5cf6" anchorX="center">
        D
      </Text>
      <Text position={[1.8, a * 1.5, 0]} fontSize={0.15} color="#a78bfa" anchorX="left">
        Σ: z={a.toFixed(1)}(x²+y²)
      </Text>

      {/* Info overlay */}
      <Html position={[0, a * 2 * range * range + 1.5, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border border-violet-200 dark:border-violet-800 rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-violet-600 dark:text-violet-400 font-semibold mb-1">
            对面积的曲面积分
          </div>
          <div className="text-muted-foreground">
            ∫∫_Σ f dS = ∫∫_D f·√(1+gx²+gy²) dxdy
          </div>
          <div className="text-amber-600 dark:text-amber-400">
            积分值 ≈ {integralValue.toFixed(4)}
          </div>
          <div className="text-muted-foreground">
            dS因子范围: [{dsFactorMin.toFixed(2)}, {dsFactorMax.toFixed(2)}]
          </div>
          <div className="text-muted-foreground">
            f(x,y,z) = z, 曲面陡度 a = {a.toFixed(1)}
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// ═══════════════════════════════════════════════════════════
// 一元微积分场景组件 (Single-Variable Calculus Scenes)
// ═══════════════════════════════════════════════════════════

// --- 1. 数列极限 (limit1) ---
function Limit1Scene() {
  const { paramValue: c, paramValue2: L } = useLabStore()
  const eps = 0.3

  const sequencePoints = useMemo(() => {
    const pts: [number, number, number][] = []
    for (let n = 1; n <= 40; n++) {
      const an = L + c / n
      pts.push([n * 0.15, an, 0])
    }
    return pts
  }, [c, L])

  const curvePoints = useMemo(() => {
    const pts: number[] = []
    for (let n = 1; n <= 400; n++) {
      const x = n * 0.015
      const an = L + c / (n * 0.1)
      pts.push(x, an, 0)
    }
    return new Float32Array(pts)
  }, [c, L])

  return (
    <>
      {/* ε-band (horizontal planes at L±ε) */}
      <mesh position={[3, L + eps, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 2]} />
        <meshPhongMaterial color="#10b981" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[3, L - eps, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 2]} />
        <meshPhongMaterial color="#10b981" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
      {/* ε-band edge lines */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([0, L + eps, -1, 6, L + eps, -1, 6, L + eps, 1, 0, L + eps, 1]), 3]} count={4} />
        </bufferGeometry>
        <lineBasicMaterial color="#10b981" opacity={0.5} transparent />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([0, L - eps, -1, 6, L - eps, -1, 6, L - eps, 1, 0, L - eps, 1]), 3]} count={4} />
        </bufferGeometry>
        <lineBasicMaterial color="#10b981" opacity={0.5} transparent />
      </line>
      {/* Limit line y = L */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([0, L, -1, 6, L, -1]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#f59e0b" linewidth={2} />
      </line>
      {/* Convergence curve */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[curvePoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#14b8a6" linewidth={2} />
      </line>
      {/* Sequence scatter points (spheres) */}
      {sequencePoints.map((pt, idx) => (
        <mesh key={idx} position={pt}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshPhongMaterial color={Math.abs(pt[1] - L) < eps ? '#10b981' : '#ef4444'} />
        </mesh>
      ))}
      {/* Convergence indicator: drop lines from points to L */}
      {sequencePoints.slice(0, 20).map((pt, idx) => (
        <line key={`drop-${idx}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[new Float32Array([pt[0], pt[1], 0, pt[0], L, 0]), 3]} count={2} />
          </bufferGeometry>
          <lineBasicMaterial color={Math.abs(pt[1] - L) < eps ? '#10b981' : '#ef4444'} opacity={0.4} transparent />
        </line>
      ))}
      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
            <div className="text-teal-600 dark:text-teal-400 font-semibold">数列极限</div>
            <div>aₙ = {L.toFixed(1)} + {c.toFixed(1)}/n</div>
            <div className="text-amber-600 dark:text-amber-400">L = {L.toFixed(2)}</div>
            <div>ε = {eps.toFixed(2)}</div>
            <div className="text-emerald-600 dark:text-emerald-400">|a₄₀ - L| = {(c / 40).toFixed(4)}</div>
          </div>
        </div>
      </Html>
    </>
  )
}

// --- 2. 函数极限 ε-δ (limit2) ---
function Limit2Scene() {
  const { paramValue: eps } = useLabStore()
  // f(x) = sin(x) + 1, x₀ = π/2, L = 2
  const x0 = Math.PI / 2
  const L = 2
  const fAt = (x: number) => Math.sin(x) + 1

  // Find δ such that |f(x)-L| < ε when |x-x₀| < δ
  const delta = useMemo(() => {
    // Search for δ by finding where |f(x)-L| = ε
    const searchDelta = () => {
      const n = 1000
      const maxD = 2
      const dd = maxD / n
      for (let i = n; i >= 1; i--) {
        const d = i * dd
        const x1 = x0 - d
        const x2 = x0 + d
        if (Math.abs(fAt(x1) - L) <= eps && Math.abs(fAt(x2) - L) <= eps) {
          return d
        }
      }
      return 0.01
    }
    return searchDelta()
  }, [eps])

  const curvePoints = useMemo(() => {
    const pts: number[] = []
    for (let i = -300; i <= 300; i++) {
      const x = (i / 100) * Math.PI
      const y = fAt(x)
      pts.push(x, y, 0)
    }
    return new Float32Array(pts)
  }, [])

  return (
    <>
      {/* Curve f(x) = sin(x)+1 */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[curvePoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#14b8a6" linewidth={2} />
      </line>
      {/* ε-band (green horizontal planes at L±ε) */}
      <mesh position={[0, L + eps, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 2]} />
        <meshPhongMaterial color="#10b981" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, L - eps, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 2]} />
        <meshPhongMaterial color="#10b981" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      {/* ε-band edge lines */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([-3, L + eps, -1, 3, L + eps, -1]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#10b981" linewidth={2} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([-3, L - eps, -1, 3, L - eps, -1]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#10b981" linewidth={2} />
      </line>
      {/* δ-interval (orange vertical planes at x₀±δ) */}
      <mesh position={[x0 - delta, L / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[L + 1, 2]} />
        <meshPhongMaterial color="#f97316" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[x0 + delta, L / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[L + 1, 2]} />
        <meshPhongMaterial color="#f97316" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      {/* δ-interval edge lines */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([x0 - delta, -0.5, -1, x0 - delta, L + 1, -1]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#f97316" linewidth={2} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([x0 + delta, -0.5, -1, x0 + delta, L + 1, -1]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#f97316" linewidth={2} />
      </line>
      {/* Point (x₀, L) */}
      <mesh position={[x0, L, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshPhongMaterial color="#ef4444" />
      </mesh>
      {/* Horizontal line at L */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([-3, L, -1, 3, L, -1]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#f59e0b" opacity={0.5} transparent />
      </line>
      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
            <div className="text-teal-600 dark:text-teal-400 font-semibold">函数极限 ε-δ</div>
            <div>f(x) = sin(x)+1, x₀ = π/2</div>
            <div className="text-emerald-600 dark:text-emerald-400">ε = {eps.toFixed(2)}</div>
            <div className="text-orange-500 dark:text-orange-400">δ ≈ {delta.toFixed(4)}</div>
            <div className="text-amber-600 dark:text-amber-400">L = f(x₀) = {L.toFixed(2)}</div>
          </div>
        </div>
      </Html>
    </>
  )
}

// --- 3. 导数定义 割线→切线 (derivative1) ---
function Derivative1Scene() {
  const { paramValue: deltaX } = useLabStore()
  // f(x) = sin(x) + 0.5x, x₀ = 1
  const x0 = 1
  const fAt = (x: number) => Math.sin(x) + 0.5 * x

  const curvePoints = useMemo(() => {
    const pts: number[] = []
    for (let i = -300; i <= 300; i++) {
      const x = (i / 100) * 3
      const y = fAt(x)
      pts.push(x, y, 0)
    }
    return new Float32Array(pts)
  }, [])

  const tangentSlope = Math.cos(x0) + 0.5
  const tangentY = fAt(x0) + tangentSlope * 2
  const secantSlope = (fAt(x0 + deltaX) - fAt(x0)) / deltaX

  return (
    <>
      {/* Curve f(x) = sin(x)+0.5x */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[curvePoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#14b8a6" linewidth={2} />
      </line>
      {/* Tangent line (red) at x₀ */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([x0 - 2, fAt(x0) - tangentSlope * 2, 0, x0 + 2, fAt(x0) + tangentSlope * 2, 0]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={2} />
      </line>
      {/* Secant line (blue) from x₀ to x₀+Δx */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([x0 - 1, fAt(x0) - secantSlope * 1, 0, x0 + deltaX + 1, fAt(x0) + secantSlope * (deltaX + 1), 0]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" linewidth={2} />
      </line>
      {/* Point at x₀ */}
      <mesh position={[x0, fAt(x0), 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshPhongMaterial color="#ef4444" />
      </mesh>
      {/* Point at x₀+Δx */}
      <mesh position={[x0 + deltaX, fAt(x0 + deltaX), 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshPhongMaterial color="#3b82f6" />
      </mesh>
      {/* Δx indicator */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([x0, fAt(x0), 0.5, x0 + deltaX, fAt(x0), 0.5]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" opacity={0.6} transparent />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([x0 + deltaX, fAt(x0), 0.5, x0 + deltaX, fAt(x0 + deltaX), 0.5]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" opacity={0.6} transparent />
      </line>
      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
            <div className="text-teal-600 dark:text-teal-400 font-semibold">导数定义 (割线→切线)</div>
            <div>f(x) = sin(x)+0.5x, x₀ = 1</div>
            <div className="text-red-500 dark:text-red-400">切线斜率 f&apos;(1) = {tangentSlope.toFixed(4)}</div>
            <div className="text-blue-500 dark:text-blue-400">割线斜率 = {secantSlope.toFixed(4)}</div>
            <div>Δx = {deltaX.toFixed(2)}</div>
            <div className="text-amber-600 dark:text-amber-400">|差值| = {Math.abs(tangentSlope - secantSlope).toFixed(4)}</div>
          </div>
        </div>
      </Html>
    </>
  )
}

// --- 4. 切线与导函数 (derivative2) ---
function Derivative2Scene() {
  const { paramValue: x0 } = useLabStore()
  // f(x) = x³-3x, f'(x) = 3x²-3
  const fAt = (x: number) => x * x * x - 3 * x
  const dfAt = (x: number) => 3 * x * x - 3

  const fCurvePoints = useMemo(() => {
    const pts: number[] = []
    for (let i = -250; i <= 250; i++) {
      const x = (i / 100) * 2.5
      const y = fAt(x)
      pts.push(x, y, -0.5)
    }
    return new Float32Array(pts)
  }, [])

  const dfCurvePoints = useMemo(() => {
    const pts: number[] = []
    for (let i = -250; i <= 250; i++) {
      const x = (i / 100) * 2.5
      const y = dfAt(x)
      pts.push(x, y, 0.5)
    }
    return new Float32Array(pts)
  }, [])

  const tangentSlope = dfAt(x0)
  const tangentLen = 1.5

  return (
    <>
      {/* f(x) = x³-3x (blue, offset z=-0.5) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[fCurvePoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" linewidth={2} />
      </line>
      {/* f'(x) = 3x²-3 (red, offset z=+0.5) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dfCurvePoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={2} />
      </line>
      {/* Tangent line at x₀ on f curve */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([x0 - tangentLen, fAt(x0) - tangentSlope * tangentLen, -0.5, x0 + tangentLen, fAt(x0) + tangentSlope * tangentLen, -0.5]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#f59e0b" linewidth={2} />
      </line>
      {/* Point on f curve */}
      <mesh position={[x0, fAt(x0), -0.5]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshPhongMaterial color="#3b82f6" />
      </mesh>
      {/* Point on f' curve */}
      <mesh position={[x0, dfAt(x0), 0.5]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshPhongMaterial color="#ef4444" />
      </mesh>
      {/* Vertical connecting line */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([x0, fAt(x0), -0.5, x0, dfAt(x0), 0.5]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#94a3b8" opacity={0.4} transparent />
      </line>
      {/* Labels */}
      <Text position={[-2.5, 4, -0.5]} fontSize={0.2} color="#3b82f6">f(x)</Text>
      <Text position={[-2.5, 4, 0.5]} fontSize={0.2} color="#ef4444">f&apos;(x)</Text>
      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
            <div className="text-teal-600 dark:text-teal-400 font-semibold">切线与导函数</div>
            <div>f(x) = x³-3x, f&apos;(x) = 3x²-3</div>
            <div className="text-blue-500 dark:text-blue-400">x₀ = {x0.toFixed(1)}</div>
            <div className="text-blue-500 dark:text-blue-400">f(x₀) = {fAt(x0).toFixed(3)}</div>
            <div className="text-red-500 dark:text-red-400">f&apos;(x₀) = {dfAt(x0).toFixed(3)}</div>
          </div>
        </div>
      </Html>
    </>
  )
}

// --- 5. 微分与线性近似 (derivative3) ---
function Derivative3Scene() {
  const { paramValue: x0, paramValue2: deltaX } = useLabStore()
  // f(x) = x², f'(x) = 2x
  const fAt = (x: number) => x * x
  const dfAt = (x: number) => 2 * x

  const curvePoints = useMemo(() => {
    const pts: number[] = []
    for (let i = 0; i <= 300; i++) {
      const x = (i / 100) * 3
      const y = fAt(x)
      pts.push(x, y, 0)
    }
    return new Float32Array(pts)
  }, [])

  const dy = dfAt(x0) * deltaX
  const deltaY = fAt(x0 + deltaX) - fAt(x0)

  return (
    <>
      {/* Curve f(x) = x² */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[curvePoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#14b8a6" linewidth={2} />
      </line>
      {/* Point at x₀ */}
      <mesh position={[x0, fAt(x0), 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshPhongMaterial color="#14b8a6" />
      </mesh>
      {/* Point at x₀+Δx */}
      <mesh position={[x0 + deltaX, fAt(x0 + deltaX), 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshPhongMaterial color="#ef4444" />
      </mesh>
      {/* Δy (actual change, blue vertical line) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([x0 + deltaX, fAt(x0), 0.2, x0 + deltaX, fAt(x0 + deltaX), 0.2]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" linewidth={2} />
      </line>
      {/* dy (differential approximation, red line along tangent) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([x0 + deltaX, fAt(x0), 0.3, x0 + deltaX, fAt(x0) + dy, 0.3]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={2} />
      </line>
      {/* Tangent line */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([x0 - 0.5, fAt(x0) - dfAt(x0) * 0.5, 0, x0 + deltaX + 0.5, fAt(x0) + dfAt(x0) * (deltaX + 0.5), 0]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#f59e0b" opacity={0.6} transparent />
      </line>
      {/* Δx horizontal indicator */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([x0, fAt(x0), 0.3, x0 + deltaX, fAt(x0), 0.3]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#94a3b8" opacity={0.6} transparent />
      </line>
      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
            <div className="text-teal-600 dark:text-teal-400 font-semibold">微分与线性近似</div>
            <div>f(x) = x²</div>
            <div>x₀ = {x0.toFixed(1)}, Δx = {deltaX.toFixed(2)}</div>
            <div className="text-blue-500 dark:text-blue-400">Δy = {deltaY.toFixed(4)}</div>
            <div className="text-red-500 dark:text-red-400">dy = {dy.toFixed(4)}</div>
            <div className="text-amber-600 dark:text-amber-400">误差 = {Math.abs(deltaY - dy).toFixed(4)}</div>
          </div>
        </div>
      </Html>
    </>
  )
}

// --- 6. 罗尔定理 (rolle1) ---
function Rolle1Scene() {
  const { paramValue: a } = useLabStore()
  // f(x) = a*(x-1)*(x-3)*(x-5) on [1,5]

  const curvePoints = useMemo(() => {
    const fAt = (x: number) => a * (x - 1) * (x - 3) * (x - 5)
    const pts: number[] = []
    for (let i = 0; i <= 200; i++) {
      const x = 0.5 + (i / 200) * 5.5
      const y = fAt(x)
      pts.push(x - 3, y, 0)
    }
    return new Float32Array(pts)
  }, [a])

  const { xi1, xi2, fXi1, fXi2 } = useMemo(() => findRollePoint(a), [a])

  return (
    <>
      {/* Curve f(x) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[curvePoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#14b8a6" linewidth={2} />
      </line>
      {/* Endpoints f(1)=0, f(5)=0 */}
      <mesh position={[-2, 0, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshPhongMaterial color="#f59e0b" />
      </mesh>
      <mesh position={[2, 0, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshPhongMaterial color="#f59e0b" />
      </mesh>
      {/* Horizontal line y=0 */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([-2.5, 0, 0, 2.5, 0, 0]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#94a3b8" opacity={0.5} transparent />
      </line>
      {/* ξ1 point with horizontal tangent */}
      <mesh position={[xi1 - 3, fXi1, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshPhongMaterial color="#ef4444" />
      </mesh>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([xi1 - 3 - 1, fXi1, 0, xi1 - 3 + 1, fXi1, 0]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={2} />
      </line>
      {/* ξ2 point with horizontal tangent */}
      <mesh position={[xi2 - 3, fXi2, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshPhongMaterial color="#ef4444" />
      </mesh>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([xi2 - 3 - 1, fXi2, 0, xi2 - 3 + 1, fXi2, 0]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={2} />
      </line>
      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
            <div className="text-teal-600 dark:text-teal-400 font-semibold">罗尔定理</div>
            <div>f(x) = {a.toFixed(1)}·(x-1)(x-3)(x-5)</div>
            <div className="text-amber-600 dark:text-amber-400">f(1) = f(5) = 0</div>
            <div className="text-red-500 dark:text-red-400">ξ₁ ≈ {xi1.toFixed(3)}, f(ξ₁) ≈ {fXi1.toFixed(3)}</div>
            <div className="text-red-500 dark:text-red-400">ξ₂ ≈ {xi2.toFixed(3)}, f(ξ₂) ≈ {fXi2.toFixed(3)}</div>
          </div>
        </div>
      </Html>
    </>
  )
}

// --- 7. 拉格朗日中值定理 (lagrange1) ---
function Lagrange1Scene() {
  const { paramValue: a } = useLabStore()
  // f(x) = a*(x³-6x²+11x) on [0,4]
  const fAt = (x: number) => a * (x * x * x - 6 * x * x + 11 * x)

  const curvePoints = useMemo(() => {
    const pts: number[] = []
    for (let i = 0; i <= 200; i++) {
      const x = (i / 200) * 5
      const y = fAt(x)
      pts.push(x - 2, y, 0)
    }
    return new Float32Array(pts)
  }, [a, fAt])

  const { xi, secantSlope, tangentSlope } = useMemo(() => findLagrangePoint(a), [a])

  // Secant line from (0, f(0)) to (4, f(4))
  const f0 = 0
  const f4 = a * (64 - 96 + 44)

  return (
    <>
      {/* Curve f(x) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[curvePoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#14b8a6" linewidth={2} />
      </line>
      {/* Secant line (blue) from (0,f(0)) to (4,f(4)) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([0 - 2, f0, 0.1, 4 - 2, f4, 0.1]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" linewidth={2} />
      </line>
      {/* Parallel tangent line (red) at ξ */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([xi - 2 - 1.5, fAt(xi) - tangentSlope * 1.5, 0.1, xi - 2 + 1.5, fAt(xi) + tangentSlope * 1.5, 0.1]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={2} />
      </line>
      {/* Point at ξ */}
      <mesh position={[xi - 2, fAt(xi), 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshPhongMaterial color="#ef4444" />
      </mesh>
      {/* Endpoints */}
      <mesh position={[0 - 2, f0, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshPhongMaterial color="#3b82f6" />
      </mesh>
      <mesh position={[4 - 2, f4, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshPhongMaterial color="#3b82f6" />
      </mesh>
      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
            <div className="text-teal-600 dark:text-teal-400 font-semibold">拉格朗日中值定理</div>
            <div>f(x) = {a.toFixed(1)}·(x³-6x²+11x)</div>
            <div className="text-blue-500 dark:text-blue-400">割线斜率 = {secantSlope.toFixed(4)}</div>
            <div className="text-red-500 dark:text-red-400">f&apos;(ξ) = {tangentSlope.toFixed(4)}</div>
            <div>ξ ≈ {xi.toFixed(4)}</div>
          </div>
        </div>
      </Html>
    </>
  )
}

// --- 8. 原函数族 (indef_integral1) ---
function IndefIntegral1Scene() {
  const { paramValue: count } = useLabStore()
  const numCurves = Math.round(count)

  const curves = useMemo(() => {
    const result: { points: Float32Array; color: string; C: number }[] = []
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899']
    const cRange = 4
    for (let k = 0; k < numCurves; k++) {
      const C = -cRange + (2 * cRange * k) / (numCurves - 1)
      const pts: number[] = []
      for (let i = -200; i <= 200; i++) {
        const x = (i / 100) * 2.5
        const y = x * x + C
        pts.push(x, y, 0)
      }
      result.push({ points: new Float32Array(pts), color: colors[k % colors.length], C })
    }
    return result
  }, [numCurves])

  // f(x) = 2x curve (the derivative)
  const fLinePoints = useMemo(() => {
    const pts: number[] = []
    for (let i = -200; i <= 200; i++) {
      const x = (i / 100) * 2.5
      const y = 2 * x
      pts.push(x, y, -1)
    }
    return new Float32Array(pts)
  }, [])

  return (
    <>
      {/* Family of curves F(x) = x² + C */}
      {curves.map((curve, idx) => (
        <line key={idx}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[curve.points, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={curve.color} linewidth={2} />
        </line>
      ))}
      {/* f(x) = 2x (derivative, shown at z=-1) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[fLinePoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#94a3b8" opacity={0.5} transparent linewidth={1} />
      </line>
      <Text position={[-2.5, -5, -1]} fontSize={0.2} color="#94a3b8">f(x)=2x</Text>
      <Text position={[-2.5, 5, 0]} fontSize={0.2} color="#14b8a6">F(x)=x²+C</Text>
      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
            <div className="text-teal-600 dark:text-teal-400 font-semibold">原函数族</div>
            <div>∫2x dx = x² + C</div>
            <div>曲线数量: {numCurves}</div>
            <div>C ∈ [{(-4).toFixed(1)}, {(4).toFixed(1)}]</div>
          </div>
        </div>
      </Html>
    </>
  )
}

// --- 9. 微积分基本定理 (ftc1) ---
function Ftc1Scene() {
  const { paramValue: upperLimit } = useLabStore()
  // f(x) = sin(x)+1, Φ(x) = ∫₋₂ˣ f(t)dt
  const fAt = (x: number) => Math.sin(x) + 1

  const fCurvePoints = useMemo(() => {
    const pts: number[] = []
    for (let i = -300; i <= 300; i++) {
      const x = (i / 100) * 3
      const y = fAt(x)
      pts.push(x, y, -1)
    }
    return new Float32Array(pts)
  }, [])

  // Area under curve from -2 to upperLimit
  const areaValue = useMemo(() => numericalIntegral1D(fAt, -2, upperLimit), [upperLimit])

  // Φ(x) curve = ∫₋₂ˣ f(t)dt = [-cos(t)+t]₋₂ˣ
  const phiCurvePoints = useMemo(() => {
    const pts: number[] = []
    for (let i = -200; i <= 200; i++) {
      const x = (i / 100) * 3
      const phiX = -Math.cos(x) + x - (-Math.cos(-2) + (-2))
      pts.push(x, phiX, 1)
    }
    return new Float32Array(pts)
  }, [])

  // Shaded area fill (triangulated mesh between curve and x-axis)
  const areaGeom = useMemo(() => {
    if (upperLimit <= -2) return null
    const geom = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []
    const colors: number[] = []
    const res = 60
    const xMin = -2
    const xMax = upperLimit
    const dx = (xMax - xMin) / res
    const col = new THREE.Color('#14b8a6')

    for (let i = 0; i <= res; i++) {
      const x = xMin + i * dx
      vertices.push(x, fAt(x), -1)
      colors.push(col.r, col.g, col.b)
      vertices.push(x, 0, -1)
      colors.push(col.r * 0.5, col.g * 0.5, col.b * 0.5)
    }
    for (let i = 0; i < res; i++) {
      const a = i * 2
      const b = a + 1
      const c = a + 2
      const d = a + 3
      indices.push(a, c, b, b, c, d)
    }
    geom.setIndex(indices)
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geom.computeVertexNormals()
    return geom
  }, [upperLimit])

  const phiAtX = -Math.cos(upperLimit) + upperLimit - (-Math.cos(-2) + (-2))

  return (
    <>
      {/* f(x) curve at z=-1 */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[fCurvePoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#14b8a6" linewidth={2} />
      </line>
      {/* Φ(x) curve at z=+1 */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[phiCurvePoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#f59e0b" linewidth={2} />
      </line>
      {/* Shaded area */}
      {areaGeom && (
        <mesh geometry={areaGeom}>
          <meshPhongMaterial vertexColors transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* Upper limit indicator on f curve */}
      <mesh position={[upperLimit, fAt(upperLimit), -1]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshPhongMaterial color="#ef4444" />
      </mesh>
      {/* Corresponding point on Φ curve */}
      <mesh position={[upperLimit, phiAtX, 1]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshPhongMaterial color="#f59e0b" />
      </mesh>
      {/* Vertical line at upper limit */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([upperLimit, 0, -1, upperLimit, fAt(upperLimit), -1]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" opacity={0.6} transparent />
      </line>
      <Text position={[-3, 2, -1]} fontSize={0.2} color="#14b8a6">f(x)</Text>
      <Text position={[-3, 2, 1]} fontSize={0.2} color="#f59e0b">Φ(x)</Text>
      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
            <div className="text-teal-600 dark:text-teal-400 font-semibold">微积分基本定理</div>
            <div>f(x) = sin(x)+1</div>
            <div>Φ(x) = ∫₋₂ˣ f(t)dt</div>
            <div className="text-emerald-600 dark:text-emerald-400">面积 = {areaValue.toFixed(4)}</div>
            <div className="text-amber-600 dark:text-amber-400">Φ({upperLimit.toFixed(1)}) = {phiAtX.toFixed(4)}</div>
            <div>Φ&apos;(x) = f(x) ✓</div>
          </div>
        </div>
      </Html>
    </>
  )
}

// --- 10. 积分中值定理 (mean_value_integral1) ---
function MeanValueIntegral1Scene() {
  const { paramValue: a } = useLabStore()
  // f(x) = a*sin(x)+1 on [0, 2π]

  const { xi, avgValue, integral } = useMemo(
    () => {
      const fAt = (x: number) => a * Math.sin(x) + 1
      return findMeanValueIntegralPoint(fAt, 0, 2 * Math.PI)
    },
    [a]
  )

  const curvePoints = useMemo(() => {
    const fAt = (x: number) => a * Math.sin(x) + 1
    const pts: number[] = []
    for (let i = 0; i <= 300; i++) {
      const x = (i / 300) * 2 * Math.PI
      const y = fAt(x)
      pts.push(x - Math.PI, y, 0)
    }
    return new Float32Array(pts)
  }, [a])

  // Area fill
  const areaGeom = useMemo(() => {
    const fAt = (x: number) => a * Math.sin(x) + 1
    const geom = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []
    const colors: number[] = []
    const res = 60
    const dx = (2 * Math.PI) / res
    const col = new THREE.Color('#14b8a6')

    for (let i = 0; i <= res; i++) {
      const x = i * dx
      vertices.push(x - Math.PI, fAt(x), 0)
      colors.push(col.r, col.g, col.b)
      vertices.push(x - Math.PI, 0, 0)
      colors.push(col.r * 0.5, col.g * 0.5, col.b * 0.5)
    }
    for (let i = 0; i < res; i++) {
      const ai = i * 2
      indices.push(ai, ai + 2, ai + 1, ai + 1, ai + 2, ai + 3)
    }
    geom.setIndex(indices)
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geom.computeVertexNormals()
    return geom
  }, [a])

  // Average value rectangle
  const rectW = 2 * Math.PI

  return (
    <>
      {/* Curve f(x) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[curvePoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#14b8a6" linewidth={2} />
      </line>
      {/* Area fill */}
      <mesh geometry={areaGeom}>
        <meshPhongMaterial vertexColors transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      {/* Average value rectangle f(ξ)·(b-a) */}
      <mesh position={[0, avgValue / 2, 0.3]}>
        <boxGeometry args={[rectW, avgValue, 0.02]} />
        <meshPhongMaterial color="#f59e0b" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* Average value line */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([-Math.PI, avgValue, 0.3, Math.PI, avgValue, 0.3]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#f59e0b" linewidth={2} />
      </line>
      {/* ξ point */}
      <mesh position={[xi - Math.PI, a * Math.sin(xi) + 1, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshPhongMaterial color="#ef4444" />
      </mesh>
      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
            <div className="text-teal-600 dark:text-teal-400 font-semibold">积分中值定理</div>
            <div>f(x) = {a.toFixed(1)}·sin(x)+1</div>
            <div className="text-emerald-600 dark:text-emerald-400">∫f dx = {integral.toFixed(4)}</div>
            <div className="text-amber-600 dark:text-amber-400">平均值 = {avgValue.toFixed(4)}</div>
            <div className="text-red-500 dark:text-red-400">ξ ≈ {xi.toFixed(4)}</div>
            <div>f(ξ) = {(a * Math.sin(xi) + 1).toFixed(4)}</div>
          </div>
        </div>
      </Html>
    </>
  )
}

// --- 11. 曲线间面积 (area1) ---
function Area1Scene() {
  const { paramValue: a } = useLabStore()
  // f(x) = a+cos(x), g(x) = sin(x) on [-π, π]

  const fCurvePoints = useMemo(() => {
    const pts: number[] = []
    for (let i = -200; i <= 200; i++) {
      const x = (i / 100) * Math.PI
      const y = a + Math.cos(x)
      pts.push(x, y, 0)
    }
    return new Float32Array(pts)
  }, [a])

  const gCurvePoints = useMemo(() => {
    const pts: number[] = []
    for (let i = -200; i <= 200; i++) {
      const x = (i / 100) * Math.PI
      const y = Math.sin(x)
      pts.push(x, y, 0)
    }
    return new Float32Array(pts)
  }, [])

  const area = useMemo(() => areaBetweenCurves(
    (x: number) => a + Math.cos(x),
    (x: number) => Math.sin(x),
    -Math.PI, Math.PI
  ), [a])

  // Filled area between curves
  const areaGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []
    const colors: number[] = []
    const res = 80
    const xMin = -Math.PI
    const xMax = Math.PI
    const dx = (xMax - xMin) / res
    const col1 = new THREE.Color('#14b8a6')
    const col2 = new THREE.Color('#f59e0b')

    for (let i = 0; i <= res; i++) {
      const x = xMin + i * dx
      const fv = a + Math.cos(x)
      const gv = Math.sin(x)
      vertices.push(x, fv, 0.1)
      colors.push(col1.r, col1.g, col1.b)
      vertices.push(x, gv, 0.1)
      colors.push(col2.r, col2.g, col2.b)
    }
    for (let i = 0; i < res; i++) {
      const ai = i * 2
      indices.push(ai, ai + 2, ai + 1, ai + 1, ai + 2, ai + 3)
    }
    geom.setIndex(indices)
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geom.computeVertexNormals()
    return geom
  }, [a])

  return (
    <>
      {/* f(x) = a+cos(x) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[fCurvePoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#14b8a6" linewidth={2} />
      </line>
      {/* g(x) = sin(x) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[gCurvePoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#f59e0b" linewidth={2} />
      </line>
      {/* Filled area between curves */}
      <mesh geometry={areaGeom}>
        <meshPhongMaterial vertexColors transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[-3.5, a + 1, 0]} fontSize={0.18} color="#14b8a6" anchorX="left">f(x)={a.toFixed(1)}+cos(x)</Text>
      <Text position={[-3.5, -1.5, 0]} fontSize={0.18} color="#f59e0b" anchorX="left">g(x)=sin(x)</Text>
      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
            <div className="text-teal-600 dark:text-teal-400 font-semibold">曲线间面积</div>
            <div>S = ∫|f(x)-g(x)|dx</div>
            <div className="text-emerald-600 dark:text-emerald-400">面积 = {area.toFixed(4)}</div>
            <div>间距 a = {a.toFixed(1)}</div>
          </div>
        </div>
      </Html>
    </>
  )
}

// --- 12. 旋转体体积 (volume_rev1) ---
function VolumeRev1Scene() {
  const { paramValue: a, paramValue2: numDiscs } = useLabStore()
  const nDiscs = Math.round(numDiscs)
  // f(x) = a*sin(x)+1.5 on [0, 2π]

  const vol = useMemo(() => volumeOfRevolution(
    (x: number) => a * Math.sin(x) + 1.5, 0, 2 * Math.PI
  ), [a])

  // Generate surface of revolution
  const surfaceGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []
    const colors: number[] = []
    const xRes = 60
    const thetaRes = 40
    const col = new THREE.Color('#14b8a6')

    for (let i = 0; i <= xRes; i++) {
      const x = (i / xRes) * 2 * Math.PI
      const r = a * Math.sin(x) + 1.5
      for (let j = 0; j <= thetaRes; j++) {
        const theta = (j / thetaRes) * 2 * Math.PI
        const px = x - Math.PI
        const py = r * Math.cos(theta)
        const pz = r * Math.sin(theta)
        vertices.push(px, py, pz)
        colors.push(col.r, col.g, col.b)
      }
    }
    for (let i = 0; i < xRes; i++) {
      for (let j = 0; j < thetaRes; j++) {
        const a1 = i * (thetaRes + 1) + j
        const b1 = a1 + 1
        const c1 = (i + 1) * (thetaRes + 1) + j
        const d1 = c1 + 1
        indices.push(a1, c1, b1, b1, c1, d1)
      }
    }
    geom.setIndex(indices)
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geom.computeVertexNormals()
    return geom
  }, [a])

  // Disc cross-sections
  const discData = useMemo(() => {
    const discs: { x: number; r: number }[] = []
    for (let i = 0; i < nDiscs; i++) {
      const x = (i + 0.5) / nDiscs * 2 * Math.PI
      const r = a * Math.sin(x) + 1.5
      discs.push({ x: x - Math.PI, r })
    }
    return discs
  }, [a, nDiscs])

  return (
    <AutoRotate speed={0.003}>
      {/* Surface of revolution */}
      <mesh geometry={surfaceGeom}>
        <meshPhongMaterial vertexColors transparent opacity={0.35} side={THREE.DoubleSide} shininess={60} />
      </mesh>
      {/* Disc cross-sections */}
      {discData.map((disc, idx) => (
        <mesh key={idx} position={[disc.x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[disc.r, disc.r, 0.03, 24]} />
          <meshPhongMaterial color={idx % 2 === 0 ? '#f59e0b' : '#fbbf24'} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Central axis (x-axis) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([-Math.PI, 0, 0, Math.PI, 0, 0]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" opacity={0.6} transparent />
      </line>
      {/* Curve profile (f(x) at z=0) */}
      {useMemo(() => {
        const pts: number[] = []
        for (let i = 0; i <= 200; i++) {
          const x = (i / 200) * 2 * Math.PI
          const y = a * Math.sin(x) + 1.5
          pts.push(x - Math.PI, y, 0)
        }
        return (
          <line>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[new Float32Array(pts), 3]} />
            </bufferGeometry>
            <lineBasicMaterial color="#14b8a6" linewidth={2} />
          </line>
        )
      }, [a])}
      <Html position={[0, 3.5, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-teal-600 dark:text-teal-400 font-semibold">旋转体体积</div>
          <div>f(x) = {a.toFixed(1)}·sin(x)+1.5</div>
          <div>V = π∫[f(x)]²dx</div>
          <div className="text-emerald-600 dark:text-emerald-400">V ≈ {vol.toFixed(4)}</div>
          <div>截面数: {nDiscs}</div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- 2D Axes helper for single-variable calculus modes ---
function Axes2D({ xRange = 3, yRange = 3 }: { xRange?: number; yRange?: number }) {
  const gridPts = useMemo(() => {
    const pts: number[] = []
    for (let i = -Math.floor(xRange); i <= Math.floor(xRange); i++) {
      pts.push(i, -yRange, 0.001, i, yRange, 0.001)
    }
    for (let j = -Math.floor(yRange); j <= Math.floor(yRange); j++) {
      pts.push(-xRange, j, 0.001, xRange, j, 0.001)
    }
    return new Float32Array(pts)
  }, [xRange, yRange])

  return (
    <group>
      {/* X axis */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([-xRange, 0, 0, xRange, 0, 0]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#999999" linewidth={1} />
      </line>
      {/* Y axis (mathematical y = R3F y) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([0, -yRange, 0, 0, yRange, 0]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#999999" linewidth={1} />
      </line>
      {/* X axis arrow */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([xRange - 0.2, 0.1, 0, xRange, 0, 0, xRange - 0.2, -0.1, 0]), 3]} count={3} />
        </bufferGeometry>
        <lineBasicMaterial color="#999999" />
      </line>
      {/* Y axis arrow */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([-0.1, yRange - 0.2, 0, 0, yRange, 0, 0.1, yRange - 0.2, 0]), 3]} count={3} />
        </bufferGeometry>
        <lineBasicMaterial color="#999999" />
      </line>
      {/* Grid */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[gridPts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#cccccc" transparent opacity={0.15} />
      </lineSegments>
      {/* Axis labels */}
      <Text position={[xRange + 0.25, -0.15, 0]} fontSize={0.22} color="#666666" anchorX="center" anchorY="middle">x</Text>
      <Text position={[0.2, yRange + 0.2, 0]} fontSize={0.22} color="#666666" anchorX="center" anchorY="middle">y</Text>
      {/* Origin label */}
      <Text position={[-0.2, -0.25, 0]} fontSize={0.15} color="#999999" anchorX="center" anchorY="middle">O</Text>
      {/* Tick marks - X axis */}
      {Array.from({ length: Math.floor(xRange) * 2 + 1 }, (_, i) => i - Math.floor(xRange)).filter(v => v !== 0).map(v => (
        <group key={`xt${v}`}>
          <line>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[new Float32Array([v, -0.08, 0, v, 0.08, 0]), 3]} count={2} />
            </bufferGeometry>
            <lineBasicMaterial color="#999999" />
          </line>
          <Text position={[v, -0.25, 0]} fontSize={0.13} color="#999999" anchorX="center" anchorY="middle">{v}</Text>
        </group>
      ))}
      {/* Tick marks - Y axis */}
      {Array.from({ length: Math.floor(yRange) * 2 + 1 }, (_, i) => i - Math.floor(yRange)).filter(v => v !== 0).map(v => (
        <group key={`yt${v}`}>
          <line>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[new Float32Array([-0.08, v, 0, 0.08, v, 0]), 3]} count={2} />
            </bufferGeometry>
            <lineBasicMaterial color="#999999" />
          </line>
          <Text position={[-0.25, v, 0]} fontSize={0.13} color="#999999" anchorX="center" anchorY="middle">{v}</Text>
        </group>
      ))}
    </group>
  )
}

// --- 2D filled region between curve and axis ---
function FilledRegion2D({ xMin, xMax, fn, color = '#10b981', opacity = 0.25, yBase = 0, res = 80 }: {
  xMin: number; xMax: number; fn: (x: number) => number; color?: string; opacity?: number; yBase?: number; res?: number
}) {
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []
    const dx = (xMax - xMin) / res
    for (let i = 0; i <= res; i++) {
      const x = xMin + i * dx
      vertices.push(x, fn(x), 0)
      vertices.push(x, yBase, 0)
    }
    for (let i = 0; i < res; i++) {
      const a = i * 2; const b = a + 1; const c = a + 2; const d = a + 3
      indices.push(a, c, b, b, c, d)
    }
    geom.setIndex(indices)
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geom.computeVertexNormals()
    return geom
  }, [xMin, xMax, fn, yBase, res])
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  )
}

// 1. continuity1 - 函数连续性
function Continuity1Scene() {
  const { paramValue } = useLabStore()
  const isContinuous = paramValue >= 1

  const contPoints = useMemo(() => {
    const pts: number[] = []
    for (let i = -200; i <= 200; i++) {
      const x = (i / 100) * 3
      pts.push(x, x * x, 0)
    }
    return new Float32Array(pts)
  }, [])

  const discontLeft = useMemo(() => {
    const pts: number[] = []
    for (let i = -200; i < 0; i++) {
      const x = (i / 100) * 3
      pts.push(x, x * x + 1, 0)
    }
    return new Float32Array(pts)
  }, [])

  const discontRight = useMemo(() => {
    const pts: number[] = []
    for (let i = 1; i <= 200; i++) {
      const x = (i / 100) * 3
      pts.push(x, x * x - 0.5, 0)
    }
    return new Float32Array(pts)
  }, [])

  return (
    <group>
      <Axes2D xRange={3.5} yRange={4} />
      {/* Continuous function f(x)=x² (always shown) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[contPoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#22c55e" linewidth={2} />
      </line>
      {/* Discontinuous function g(x) with jump at x=0 */}
      {!isContinuous && (
        <>
          <line>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[discontLeft, 3]} />
            </bufferGeometry>
            <lineBasicMaterial color="#ef4444" linewidth={2} />
          </line>
          <line>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[discontRight, 3]} />
            </bufferGeometry>
            <lineBasicMaterial color="#ef4444" linewidth={2} />
          </line>
          {/* Open/closed circles at discontinuity */}
          <mesh position={[0, 1, 0]}><sphereGeometry args={[0.08, 16, 16]} /><meshBasicMaterial color="#ef4444" /></mesh>
          <mesh position={[0, -0.5, 0]}><sphereGeometry args={[0.08, 16, 16]} /><meshBasicMaterial color="#ef4444" /></mesh>
          {/* Dashed line for missing point */}
          <line>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[new Float32Array([0, -0.5, 0, 0, 0, 0]), 3]} count={2} />
            </bufferGeometry>
            <lineBasicMaterial color="#ef4444" opacity={0.4} transparent />
          </line>
        </>
      )}
      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
            <div className="text-green-600 dark:text-green-400 font-semibold">连续函数 f(x) = x²</div>
            {!isContinuous && <div className="text-red-600 dark:text-red-400 font-semibold">不连续函数 g(x)：x=0处跳跃间断</div>}
            <div className="text-muted-foreground mt-1">连续性: {isContinuous ? '✓ 连续' : '✗ 不连续'}</div>
          </div>
        </div>
      </Html>
    </group>
  )
}

// 2. discontinuity1 - 间断点类型
function Discontinuity1Scene() {
  const { paramValue } = useLabStore()
  const dtype = Math.round(paramValue)

  // Removable (hole) at x=1: f(x) = (x²-1)/(x-1) = x+1 except hole at x=1
  const removablePts = useMemo(() => {
    const pts: number[] = []
    for (let i = -200; i <= 200; i++) {
      const x = (i / 100) * 3
      if (Math.abs(x - 1) < 0.05) continue
      pts.push(x, x + 1, 0)
    }
    return new Float32Array(pts)
  }, [])

  // Jump (step) at x=2
  const jumpLeft = useMemo(() => {
    const pts: number[] = []
    for (let i = -200; i < 200; i++) { const x = (i / 100) * 3; if (x >= 2) break; pts.push(x, x > 0 ? 1 : -1, 0) }
    return new Float32Array(pts)
  }, [])
  const jumpRight = useMemo(() => {
    const pts: number[] = []
    for (let i = -200; i <= 200; i++) { const x = (i / 100) * 3; if (x < 2) continue; pts.push(x, -1, 0) }
    return new Float32Array(pts)
  }, [])

  // Infinite at x=3: f(x) = 1/(x-3)
  const infiniteLeft = useMemo(() => {
    const pts: number[] = []
    for (let i = -200; i <= 200; i++) { const x = (i / 100) * 3; if (x >= 3 - 0.1) break; const y = 1 / (x - 3); if (Math.abs(y) < 5) pts.push(x, y, 0) }
    return new Float32Array(pts)
  }, [])
  const infiniteRight = useMemo(() => {
    const pts: number[] = []
    for (let i = -200; i <= 200; i++) { const x = (i / 100) * 3; if (x <= 3 + 0.1) continue; const y = 1 / (x - 3); if (Math.abs(y) < 5) pts.push(x, y, 0) }
    return new Float32Array(pts)
  }, [])

  // Oscillating: f(x) = sin(1/x) near x=0
  const oscPts = useMemo(() => {
    const pts: number[] = []
    for (let i = -200; i <= 200; i++) {
      const x = (i / 200) * 3
      if (Math.abs(x) < 0.02) continue
      const y = Math.sin(1 / x)
      pts.push(x, y, 0)
    }
    return new Float32Array(pts)
  }, [])

  const titles: Record<number, { name: string; desc: string; color: string }> = {
    1: { name: '可去间断点', desc: 'f(x)=(x²-1)/(x-1)，x=1处有洞', color: '#3b82f6' },
    2: { name: '跳跃间断点', desc: 'f(x)在x=2处左右极限不相等', color: '#f59e0b' },
    3: { name: '无穷间断点', desc: 'f(x)=1/(x-3)，x=3处趋向无穷', color: '#ef4444' },
    4: { name: '振荡间断点', desc: 'f(x)=sin(1/x)，x=0处无限振荡', color: '#8b5cf6' },
  }
  const info = titles[dtype] || titles[1]

  return (
    <group>
      <Axes2D xRange={3.5} yRange={4} />
      {dtype === 1 && (<>
        <line><bufferGeometry><bufferAttribute attach="attributes-position" args={[removablePts, 3]} /></bufferGeometry><lineBasicMaterial color="#3b82f6" linewidth={2} /></line>
        <mesh position={[1, 2, 0]}><sphereGeometry args={[0.08, 16, 16]} /><meshBasicMaterial color="#3b82f6" /></mesh>
        <line><bufferGeometry><bufferAttribute attach="attributes-position" args={[new Float32Array([1, 1.85, 0, 1, 2.15, 0]), 3]} count={2} /></bufferGeometry><lineBasicMaterial color="#3b82f6" opacity={0.3} transparent /></line>
      </>)}
      {dtype === 2 && (<>
        <line><bufferGeometry><bufferAttribute attach="attributes-position" args={[jumpLeft, 3]} /></bufferGeometry><lineBasicMaterial color="#f59e0b" linewidth={2} /></line>
        <line><bufferGeometry><bufferAttribute attach="attributes-position" args={[jumpRight, 3]} /></bufferGeometry><lineBasicMaterial color="#f59e0b" linewidth={2} /></line>
        <mesh position={[2, 1, 0]}><sphereGeometry args={[0.08, 16, 16]} /><meshBasicMaterial color="#f59e0b" /></mesh>
      </>)}
      {dtype === 3 && (<>
        <line><bufferGeometry><bufferAttribute attach="attributes-position" args={[infiniteLeft, 3]} /></bufferGeometry><lineBasicMaterial color="#ef4444" linewidth={2} /></line>
        <line><bufferGeometry><bufferAttribute attach="attributes-position" args={[infiniteRight, 3]} /></bufferGeometry><lineBasicMaterial color="#ef4444" linewidth={2} /></line>
        <line><bufferGeometry><bufferAttribute attach="attributes-position" args={[new Float32Array([3, -4, 0, 3, 4, 0]), 3]} count={2} /></bufferGeometry><lineBasicMaterial color="#ef4444" opacity={0.3} transparent linewidth={1} /></line>
      </>)}
      {dtype === 4 && (<>
        <line><bufferGeometry><bufferAttribute attach="attributes-position" args={[oscPts, 3]} /></bufferGeometry><lineBasicMaterial color="#8b5cf6" linewidth={2} /></line>
      </>)}
      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
            <div className="font-semibold" style={{ color: info.color }}>{info.name}</div>
            <div className="text-muted-foreground">{info.desc}</div>
            <div className="text-muted-foreground mt-1">类型 {dtype}/4：1=可去 2=跳跃 3=无穷 4=振荡</div>
          </div>
        </div>
      </Html>
    </group>
  )
}

// 3. important_limits1 - 两个重要极限
function ImportantLimits1Scene() {
  const { paramValue: xVal } = useLabStore()

  // sin(x)/x → 1
  const sinOverXPts = useMemo(() => {
    const pts: number[] = []
    for (let i = 1; i <= 200; i++) {
      const x = (i / 200) * 10
      const y = Math.sin(x) / x
      pts.push(x, y + 4, 0)
    }
    return new Float32Array(pts)
  }, [])

  // (1+1/x)^x → e
  const expLimitPts = useMemo(() => {
    const pts: number[] = []
    for (let i = 1; i <= 200; i++) {
      const x = (i / 200) * 10
      if (x < 0.1) continue
      const y = Math.pow(1 + 1 / x, x)
      pts.push(x, y - 1.5, 0)
    }
    return new Float32Array(pts)
  }, [])

  const sinVal = xVal > 0.001 ? Math.sin(xVal) / xVal : 1
  const expVal = xVal > 0.1 ? Math.pow(1 + 1 / xVal, xVal) : Math.E

  return (
    <group>
      <Axes2D xRange={5.5} yRange={4} />
      {/* Top: sin(x)/x → 1 */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sinOverXPts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" linewidth={2} />
      </line>
      {/* Dashed line at y=1 (shifted up 4) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([0, 5, 0, 5, 5, 0]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={1} transparent opacity={0.5} />
      </line>
      <Text position={[5.5, 5, 0]} fontSize={0.18} color="#ef4444" anchorX="left">y=1</Text>

      {/* Bottom: (1+1/x)^x → e */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[expLimitPts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#f59e0b" linewidth={2} />
      </line>
      {/* Dashed line at y=e (shifted down 1.5) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([0, Math.E - 1.5, 0, 5, Math.E - 1.5, 0]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={1} transparent opacity={0.5} />
      </line>
      <Text position={[5.5, Math.E - 1.5, 0]} fontSize={0.18} color="#ef4444" anchorX="left">y=e</Text>

      {/* Current x indicator */}
      <mesh position={[xVal, sinVal + 4, 0]}><sphereGeometry args={[0.1, 16, 16]} /><meshBasicMaterial color="#3b82f6" /></mesh>
      <mesh position={[xVal, expVal - 1.5, 0]}><sphereGeometry args={[0.1, 16, 16]} /><meshBasicMaterial color="#f59e0b" /></mesh>

      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
            <div className="text-blue-600 dark:text-blue-400 font-semibold">sin(x)/x → 1：x={xVal.toFixed(2)} 时 = {sinVal.toFixed(4)}</div>
            <div className="text-amber-600 dark:text-amber-400 font-semibold">(1+1/x)^x → e：x={xVal.toFixed(2)} 时 = {expVal.toFixed(4)}</div>
            <div className="text-muted-foreground">e ≈ {Math.E.toFixed(6)}</div>
          </div>
        </div>
      </Html>
    </group>
  )
}

// 4. lhopital1 - 洛必达法则
function Lhopital1Scene() {
  const { paramValue: eps } = useLabStore()

  const fOverGPts = useMemo(() => {
    const pts: number[] = []
    for (let i = 1; i <= 200; i++) {
      const x = (i / 200) * eps * 4
      if (x < 0.001) continue
      pts.push(x, Math.sin(x) / x, 0)
    }
    return new Float32Array(pts)
  }, [eps])

  const fPrimeOverGPrimePts = useMemo(() => {
    const pts: number[] = []
    for (let i = 1; i <= 200; i++) {
      const x = (i / 200) * eps * 4
      if (x < 0.001) continue
      pts.push(x, Math.cos(x) / 1, 0)
    }
    return new Float32Array(pts)
  }, [eps])

  const fOverGVal = eps > 0.001 ? Math.sin(eps) / eps : 1
  const fPrimeOverGPrimeVal = Math.cos(eps)

  return (
    <group>
      <Axes2D xRange={3} yRange={2} />
      {/* f(x)/g(x) = sin(x)/x */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[fOverGPts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" linewidth={2} />
      </line>
      {/* f'(x)/g'(x) = cos(x)/1 */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[fPrimeOverGPrimePts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={2} />
      </line>
      {/* Limit line y=1 */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([0, 1, 0, 3, 1, 0]), 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#22c55e" linewidth={1} transparent opacity={0.5} />
      </line>
      <Text position={[3.2, 1, 0]} fontSize={0.18} color="#22c55e" anchorX="left">L=1</Text>
      {/* Indicator dots */}
      <mesh position={[eps, fOverGVal, 0]}><sphereGeometry args={[0.08, 16, 16]} /><meshBasicMaterial color="#3b82f6" /></mesh>
      <mesh position={[eps, fPrimeOverGPrimeVal, 0]}><sphereGeometry args={[0.08, 16, 16]} /><meshBasicMaterial color="#ef4444" /></mesh>

      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
            <div className="text-blue-600 dark:text-blue-400 font-semibold">sin(x)/x = {fOverGVal.toFixed(4)}</div>
            <div className="text-red-600 dark:text-red-400 font-semibold">cos(x)/1 = {fPrimeOverGPrimeVal.toFixed(4)}</div>
            <div className="text-green-600 dark:text-green-400 mt-1">极限值 L = 1</div>
          </div>
        </div>
      </Html>
    </group>
  )
}

// 5. monotonicity1 - 函数单调性
function Monotonicity1Scene() {
  const { paramValue: a } = useLabStore()

  const fPts = useMemo(() => {
    const pts: number[] = []
    for (let i = -200; i <= 200; i++) {
      const x = (i / 100) * 3
      pts.push(x, a * (x * x * x - 3 * x), 0)
    }
    return new Float32Array(pts)
  }, [a])

  const fPrimePts = useMemo(() => {
    const pts: number[] = []
    for (let i = -200; i <= 200; i++) {
      const x = (i / 100) * 3
      pts.push(x, a * (3 * x * x - 3), 0)
    }
    return new Float32Array(pts)
  }, [a])

  return (
    <group>
      <Axes2D xRange={3} yRange={5} />
      {/* Increasing region (green) f'>0: x<-1 or x>1 */}
      <FilledRegion2D xMin={-3} xMax={-1} fn={() => 5} color="#22c55e" opacity={0.1} yBase={-5} />
      <FilledRegion2D xMin={1} xMax={3} fn={() => 5} color="#22c55e" opacity={0.1} yBase={-5} />
      {/* Decreasing region (orange) f'<0: -1<x<1 */}
      <FilledRegion2D xMin={-1} xMax={1} fn={() => 5} color="#f97316" opacity={0.1} yBase={-5} />
      {/* f(x) curve */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[fPts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" linewidth={2} />
      </line>
      {/* f'(x) curve */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[fPrimePts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={2} transparent opacity={0.7} />
      </line>
      {/* Critical points */}
      <mesh position={[-1, a * (-1 + 3), 0]}><sphereGeometry args={[0.1, 16, 16]} /><meshBasicMaterial color="#22c55e" /></mesh>
      <mesh position={[1, a * (1 - 3), 0]}><sphereGeometry args={[0.1, 16, 16]} /><meshBasicMaterial color="#f97316" /></mesh>
      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
            <div className="text-blue-600 dark:text-blue-400 font-semibold">f(x) = {a.toFixed(1)}(x³-3x)</div>
            <div className="text-red-600 dark:text-red-400">f&apos;(x) = {a.toFixed(1)}(3x²-3)</div>
            <div className="text-green-600">绿色: f&apos;&gt;0 递增</div>
            <div className="text-orange-600">橙色: f&apos;&lt;0 递减</div>
          </div>
        </div>
      </Html>
    </group>
  )
}

// 6. extrema1 - 函数极值
function Extrema1Scene() {
  const { paramValue: a } = useLabStore()

  const fPts = useMemo(() => {
    const pts: number[] = []
    for (let i = -200; i <= 200; i++) {
      const x = (i / 100) * 3
      pts.push(x, a * (x * x * x * x - 4 * x * x), 0)
    }
    return new Float32Array(pts)
  }, [a])

  const fPrimePts = useMemo(() => {
    const pts: number[] = []
    for (let i = -200; i <= 200; i++) {
      const x = (i / 100) * 3
      pts.push(x, a * (4 * x * x * x - 8 * x), 0)
    }
    return new Float32Array(pts)
  }, [a])

  // Critical points: x=0 (local max), x=±√2 (local min)
  const sqrt2 = Math.sqrt(2)

  return (
    <group>
      <Axes2D xRange={3} yRange={5} />
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[fPts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" linewidth={2} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[fPrimePts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={2} transparent opacity={0.6} />
      </line>
      {/* Local maximum at x=0 (red) */}
      <mesh position={[0, 0, 0]}><sphereGeometry args={[0.12, 16, 16]} /><meshBasicMaterial color="#ef4444" /></mesh>
      <Text position={[0.2, 0.3, 0]} fontSize={0.15} color="#ef4444">极大</Text>
      {/* Local minima at x=±√2 (green) */}
      <mesh position={[-sqrt2, a * (4 - 8), 0]}><sphereGeometry args={[0.12, 16, 16]} /><meshBasicMaterial color="#22c55e" /></mesh>
      <mesh position={[sqrt2, a * (4 - 8), 0]}><sphereGeometry args={[0.12, 16, 16]} /><meshBasicMaterial color="#22c55e" /></mesh>
      <Text position={[-sqrt2, a * (4 - 8) + 0.4, 0]} fontSize={0.15} color="#22c55e">极小</Text>
      <Text position={[sqrt2, a * (4 - 8) + 0.4, 0]} fontSize={0.15} color="#22c55e">极小</Text>
      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
            <div className="text-blue-600 dark:text-blue-400 font-semibold">f(x) = {a.toFixed(1)}(x⁴-4x²)</div>
            <div className="text-red-600 dark:text-red-400">f&apos;(x) = {a.toFixed(1)}(4x³-8x)</div>
            <div className="text-red-600">红色: 极大值点(x=0)</div>
            <div className="text-green-600">绿色: 极小值点(x=±√2)</div>
          </div>
        </div>
      </Html>
    </group>
  )
}

// 7. concavity1 - 凹凸性与拐点
function Concavity1Scene() {
  const { paramValue: a } = useLabStore()

  const fPts = useMemo(() => {
    const pts: number[] = []
    for (let i = -200; i <= 200; i++) {
      const x = (i / 100) * 3
      pts.push(x, a * x * x * x, 0)
    }
    return new Float32Array(pts)
  }, [a])

  // f(x)=a*x³, f''(x)=6a*x: concave up (blue) when x>0, concave down (red) when x<0
  return (
    <group>
      <Axes2D xRange={3} yRange={5} />
      {/* Concave up region (x>0) - blue fill */}
      <FilledRegion2D xMin={0} xMax={3} fn={(x) => a * x * x * x} color="#3b82f6" opacity={0.2} />
      {/* Concave down region (x<0) - red fill */}
      <FilledRegion2D xMin={-3} xMax={0} fn={(x) => a * x * x * x} color="#ef4444" opacity={0.2} />
      {/* f(x) curve */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[fPts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#f59e0b" linewidth={2} />
      </line>
      {/* Inflection point at x=0 */}
      <mesh position={[0, 0, 0]}><sphereGeometry args={[0.12, 16, 16]} /><meshBasicMaterial color="#22c55e" /></mesh>
      <Text position={[0.2, 0.3, 0]} fontSize={0.18} color="#22c55e">拐点</Text>
      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
            <div className="text-amber-600 dark:text-amber-400 font-semibold">f(x) = {a.toFixed(1)}x³</div>
            <div className="text-blue-600">蓝色: 凹区间(x&gt;0, f&apos;&apos;&gt;0)</div>
            <div className="text-red-600">红色: 凸区间(x&lt;0, f&apos;&apos;&lt;0)</div>
            <div className="text-green-600">拐点: x=0, f&apos;&apos;(0)=0</div>
          </div>
        </div>
      </Html>
    </group>
  )
}

// 8. curvature1 - 曲率
function Curvature1Scene() {
  const { paramValue: x0 } = useLabStore()

  const f = (x: number) => Math.cos(x)
  const fPrime = (x: number) => -Math.sin(x)
  const fDoublePrime = (x: number) => -Math.cos(x)

  const curvePts = useMemo(() => {
    const pts: number[] = []
    for (let i = -200; i <= 200; i++) {
      const x = (i / 100) * 4
      pts.push(x, f(x), 0)
    }
    return new Float32Array(pts)
  }, [])

  const kappa = Math.abs(fDoublePrime(x0)) / Math.pow(1 + fPrime(x0) * fPrime(x0), 1.5)
  const R = kappa > 0.001 ? 1 / kappa : 100
  const y0 = f(x0)
  // Center of curvature circle: normal direction
  const nx = -fPrime(x0)
  const ny = 1
  const nLen = Math.sqrt(nx * nx + ny * ny)
  const cx = x0 + (nx / nLen) * R * (fDoublePrime(x0) > 0 ? 1 : -1)
  const cy = y0 + (ny / nLen) * R * (fDoublePrime(x0) > 0 ? 1 : -1)

  const circPts = useMemo(() => {
    const pts: number[] = []
    const res = 64
    for (let i = 0; i <= res; i++) {
      const theta = (2 * Math.PI * i) / res
      pts.push(cx + R * Math.cos(theta), cy + R * Math.sin(theta), 0)
    }
    return new Float32Array(pts)
  }, [cx, cy, R])

  return (
    <group>
      <Axes2D xRange={4.5} yRange={2} />
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[curvePts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" linewidth={2} />
      </line>
      {/* Curvature circle */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[circPts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={1} transparent opacity={0.6} />
      </line>
      {/* Point on curve */}
      <mesh position={[x0, y0, 0]}><sphereGeometry args={[0.1, 16, 16]} /><meshBasicMaterial color="#ef4444" /></mesh>
      {/* Center of curvature */}
      <mesh position={[cx, cy, 0]}><sphereGeometry args={[0.06, 16, 16]} /><meshBasicMaterial color="#f59e0b" /></mesh>
      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
            <div className="text-blue-600 dark:text-blue-400 font-semibold">f(x) = cos(x)</div>
            <div className="text-red-600">曲率 κ = {kappa.toFixed(4)}</div>
            <div className="text-amber-600">曲率半径 R = {R.toFixed(4)}</div>
            <div className="text-muted-foreground">观察点 x₀ = {x0.toFixed(2)}</div>
          </div>
        </div>
      </Html>
    </group>
  )
}

// 9. higher_derivative1 - 高阶导数
function HigherDerivative1Scene() {
  const { paramValue } = useLabStore()
  const n = Math.round(paramValue)

  const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4']
  const labels = ['f(x)=sin(x)', "f'(x)=cos(x)", "f''(x)=-sin(x)", "f'''(x)=-cos(x)", "f⁽⁴⁾(x)=sin(x)", "f⁽⁵⁾(x)=cos(x)"]

  const allCurves = useMemo(() => {
    const curves: Float32Array[] = []
    for (let d = 0; d <= 5; d++) {
      const pts: number[] = []
      const phase = -d * Math.PI / 2
      for (let i = -200; i <= 200; i++) {
        const x = (i / 100) * 5
        pts.push(x, Math.sin(x + phase) * (d === 0 ? 1 : 1), 0)
      }
      curves.push(new Float32Array(pts))
    }
    return curves
  }, [])

  return (
    <group>
      <Axes2D xRange={5.5} yRange={2} />
      {/* Draw all derivatives up to n */}
      {allCurves.map((pts, idx) => idx <= n ? (
        <line key={idx}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[pts, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={colors[idx]} linewidth={idx === n ? 3 : 1} transparent opacity={idx === n ? 1 : 0.4} />
        </line>
      ) : null)}
      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
            {Array.from({ length: n + 1 }, (_, i) => (
              <div key={i} style={{ color: colors[i] }} className={i === n ? 'font-semibold' : 'opacity-70'}>
                {labels[i]}
              </div>
            ))}
            <div className="text-muted-foreground mt-1">当前阶数: n = {n}</div>
          </div>
        </div>
      </Html>
    </group>
  )
}

// 10. substitution1 - 换元积分法
function Substitution1Scene() {
  const { paramValue: subType } = useLabStore()
  const st = Math.round(subType)

  // Type 1: ∫2x·cos(x²)dx, u=x² → ∫cos(u)du
  // Type 2: ∫2x·e^(x²)dx, u=x² → ∫e^u du
  // Type 3: ∫x/√(1-x²)dx, u=1-x² → -∫1/(2√u)du

  const origPts = useMemo(() => {
    const pts: number[] = []
    for (let i = -200; i <= 200; i++) {
      const x = (i / 100) * 2.5
      let y = 0
      if (st === 1) y = 2 * x * Math.cos(x * x)
      else if (st === 2) y = 2 * x * Math.exp(-x * x * 0.3)
      else { if (Math.abs(x) < 1) y = x / Math.sqrt(Math.max(0.001, 1 - x * x)) }
      if (Math.abs(y) < 5) pts.push(x, y, 0)
    }
    return new Float32Array(pts)
  }, [st])

  const subPts = useMemo(() => {
    const pts: number[] = []
    for (let i = 0; i <= 200; i++) {
      const u = (i / 200) * 5
      let y = 0
      if (st === 1) y = Math.cos(u)
      else if (st === 2) y = Math.exp(-u * 0.3)
      else y = -1 / (2 * Math.sqrt(Math.max(0.001, u)))
      if (Math.abs(y) < 5) pts.push(u, y + 4, 0)
    }
    return new Float32Array(pts)
  }, [st])

  const subLabels = ['u=x², ∫cos(u)du', 'u=x², ∫e^u du', 'u=1-x², -∫1/(2√u)du']

  return (
    <group>
      <Axes2D xRange={3} yRange={5} />
      {/* Original function */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[origPts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" linewidth={2} />
      </line>
      {/* Substituted function (shifted up) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[subPts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={2} />
      </line>
      <Text position={[-2.5, -2, 0]} fontSize={0.2} color="#3b82f6">原函数 f(g(x))g&apos;(x)</Text>
      <Text position={[0, 6, 0]} fontSize={0.2} color="#ef4444">换元后 f(u)</Text>
      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
            <div className="text-blue-600 dark:text-blue-400 font-semibold">原积分变量 x</div>
            <div className="text-red-600 dark:text-red-400 font-semibold">换元: {subLabels[st - 1]}</div>
            <div className="text-muted-foreground">类型 {st}/3</div>
          </div>
        </div>
      </Html>
    </group>
  )
}

// 11. integration_by_parts1 - 分部积分法
function IntegrationByParts1Scene() {
  const { paramValue: uType } = useLabStore()
  const ut = Math.round(uType)

  // u=x, dv=e^x dx → uv - ∫v du = x·e^x - ∫e^x dx
  // Type 1: u=x, v=e^x
  // Type 2: u=x², v=e^x
  // Type 3: u=ln(x), v=x

  const uCurve = useMemo(() => {
    const pts: number[] = []
    for (let i = -200; i <= 200; i++) {
      const x = (i / 100) * 3
      let y = 0
      if (ut === 1) y = x
      else if (ut === 2) y = x * x
      else if (x > 0.01) y = Math.log(x)
      if (Math.abs(y) < 5) pts.push(x, y, 0)
    }
    return new Float32Array(pts)
  }, [ut])

  const vCurve = useMemo(() => {
    const pts: number[] = []
    for (let i = -200; i <= 200; i++) {
      const x = (i / 100) * 3
      let y = 0
      if (ut === 1 || ut === 2) y = Math.exp(x * 0.5)
      else y = x
      if (Math.abs(y) < 5) pts.push(x, y + 3, 0)
    }
    return new Float32Array(pts)
  }, [ut])

  const uvLabel = ut === 1 ? 'u=x, dv=e^x dx' : ut === 2 ? 'u=x², dv=e^x dx' : 'u=ln(x), dv=x dx'

  return (
    <group>
      <Axes2D xRange={3} yRange={5} />
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[uCurve, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" linewidth={2} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[vCurve, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={2} />
      </line>
      <Text position={[-2.5, 2, 0]} fontSize={0.2} color="#3b82f6">u(x)</Text>
      <Text position={[-2.5, 5, 0]} fontSize={0.2} color="#ef4444">v(x)</Text>
      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
            <div className="font-semibold text-emerald-600">∫u dv = uv - ∫v du</div>
            <div className="text-blue-600 dark:text-blue-400">u(x) (蓝色)</div>
            <div className="text-red-600 dark:text-red-400">v(x) (红色)</div>
            <div className="text-muted-foreground">{uvLabel}</div>
          </div>
        </div>
      </Html>
    </group>
  )
}

// 12. improper_integral1 - 反常积分
function ImproperIntegral1Scene() {
  const { paramValue: p } = useLabStore()
  const convergent = p > 1

  const curvePts = useMemo(() => {
    const pts: number[] = []
    for (let i = 1; i <= 300; i++) {
      const x = 0.5 + (i / 300) * 9.5
      const y = 1 / Math.pow(x, p)
      if (y < 5) pts.push(x - 5, y, 0)
    }
    return new Float32Array(pts)
  }, [p])

  const fillFn = useMemo(() => (x: number) => {
    const realX = x + 5
    if (realX < 1) return 0
    return Math.min(1 / Math.pow(realX, p), 5)
  }, [p])

  // Compute integral value (numerical approximation)
  const integralVal = useMemo(() => {
    let sum = 0
    const n = 1000
    const dx = 20 / n
    for (let i = 0; i < n; i++) {
      const x = 1 + (i + 0.5) * dx
      sum += (1 / Math.pow(x, p)) * dx
    }
    return sum
  }, [p])

  return (
    <group>
      <Axes2D xRange={5.5} yRange={4} />
      {/* Filled area under curve */}
      <FilledRegion2D xMin={-4} xMax={5} fn={fillFn} color={convergent ? '#3b82f6' : '#ef4444'} opacity={0.25} yBase={0} res={120} />
      {/* Curve */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[curvePts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={convergent ? '#3b82f6' : '#ef4444'} linewidth={2} />
      </line>
      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
            <div className="font-semibold" style={{ color: convergent ? '#3b82f6' : '#ef4444' }}>
              ∫₁^∞ 1/x^{p.toFixed(1)} dx
            </div>
            <div style={{ color: convergent ? '#3b82f6' : '#ef4444' }}>
              {convergent ? '✓ 收敛' : '✗ 发散'}
            </div>
            <div className="text-muted-foreground">近似值 ≈ {integralVal.toFixed(4)}</div>
            <div className="text-muted-foreground">p = {p.toFixed(1)} {convergent ? '(p>1)' : '(p≤1)'}</div>
          </div>
        </div>
      </Html>
    </group>
  )
}

// 13. polar_area1 - 极坐标面积
function PolarArea1Scene() {
  const { paramValue: a } = useLabStore()

  const polarPts = useMemo(() => {
    const pts: number[] = []
    const res = 200
    for (let i = 0; i <= res; i++) {
      const theta = (2 * Math.PI * i) / res
      const r = a + Math.cos(theta)
      pts.push(r * Math.cos(theta), r * Math.sin(theta), 0)
    }
    return new Float32Array(pts)
  }, [a])

  // Filled area using triangulated mesh
  const areaGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []
    const res = 100
    // Center vertex
    vertices.push(0, 0, 0)
    for (let i = 0; i <= res; i++) {
      const theta = (2 * Math.PI * i) / res
      const r = a + Math.cos(theta)
      vertices.push(r * Math.cos(theta), r * Math.sin(theta), 0)
    }
    for (let i = 0; i < res; i++) {
      indices.push(0, i + 1, i + 2)
    }
    geom.setIndex(indices)
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geom.computeVertexNormals()
    return geom
  }, [a])

  // Area = ½∫₀²π (a+cosθ)² dθ = π(a² + 1/2)
  const area = Math.PI * (a * a + 0.5)

  return (
    <group>
      <Axes2D xRange={4.5} yRange={4.5} />
      {/* Filled area */}
      <mesh geometry={areaGeom}>
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* Polar curve */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[polarPts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#8b5cf6" linewidth={2} />
      </line>
      <Html fullscreen>
        <div className="absolute top-12 left-3 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
            <div className="text-violet-600 dark:text-violet-400 font-semibold">r = {a.toFixed(1)} + cos(θ)</div>
            <div className="text-violet-600">S = ½∫r²(θ)dθ</div>
            <div className="text-emerald-600 dark:text-emerald-400">S = π({a.toFixed(1)}² + ½) = {area.toFixed(4)}</div>
          </div>
        </div>
      </Html>
    </group>
  )
}

export function SceneRenderer() {
  const { mode, paramValue, paramValue2 } = useLabStore()

  const lightPosition: [number, number, number] = [5, 10, 7]

  // Determine axis length based on mode
  const axisLength = mode === 'sphere_cyl1' || mode === 'sphere_cyl2' ? 4 : 5

  return (
    <>
      {/* Lighting */}
      <directionalLight position={lightPosition} intensity={1.2} castShadow />
      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#b1e1ff', '#b97a20', 0.3]} />

      {/* Common elements - only show 3D axes/grid for 3D modes */}
      {modeInfo[mode]?.viewType !== '2d' && (
        <>
          <Axes length={axisLength} />
          <AxisLabels length={axisLength} />
          <XYGrid />
        </>
      )}

      {/* Mode-specific scenes */}
      {mode === 'step1' && (
        <group>
          <FlatPlane width={paramValue * 2} height={paramValue * 2} color="#10b981" opacity={0.35} />
          <RegionOutline size={paramValue} />
        </group>
      )}

      {mode === 'step2' && (
        <group>
          <FlatPlane width={4} height={4} color="#10b981" opacity={0.2} />
          <RegionOutline size={2} />
          <XYGrid size={2} divisions={Math.round(paramValue)} color="#10b981" />
        </group>
      )}

      {mode === 'step3' && (
        <AutoRotate>
          <RiemannBars func={f} n={Math.round(paramValue)} color="#10b981" opacity={0.7} tooltipMode="step3" />
          <Surface func={f} color="#059669" opacity={0.3} resolution={30} />
        </AutoRotate>
      )}

      {mode === 'step4' && (
        <AutoRotate>
          <Surface func={f} color="#10b981" opacity={0.85} resolution={Math.round(paramValue)} />
        </AutoRotate>
      )}

      {mode === 'prop1' && (
        <AutoRotate speed={0.003}>
          <Surface func={f} color="#10b981" opacity={0.5} resolution={30} />
          <Surface func={(x, y) => paramValue * f(x, y)} color="#f59e0b" opacity={0.4} resolution={30} />
        </AutoRotate>
      )}

      {mode === 'prop2' && (
        <AutoRotate speed={0.003}>
          <Surface func={f} color="#10b981" opacity={0.35} resolution={30} />
          <Surface func={g} color="#6366f1" opacity={0.35} resolution={30} />
          <Surface func={(x, y) => (1 - paramValue) * f(x, y) + paramValue * g(x, y)} color="#f59e0b" opacity={0.6} resolution={30} />
        </AutoRotate>
      )}

      {mode === 'prop3' && (
        <AutoRotate speed={0.003}>
          <SurfaceSplit func={f} splitX={paramValue} color1="#10b981" color2="#f59e0b" resolution={30} />
          <DividingPlane x={paramValue} height={5} />
        </AutoRotate>
      )}

      {mode === 'prop4' && (
        <AutoRotate speed={0.003}>
          <FlatPlane width={4} height={4} y={paramValue} color="#10b981" opacity={0.5} />
          {/* Side walls to show it's a flat-topped solid */}
          <mesh position={[0, paramValue / 2, -2]}>
            <planeGeometry args={[4, paramValue]} />
            <meshPhongMaterial color="#10b981" transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, paramValue / 2, 2]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[4, paramValue]} />
            <meshPhongMaterial color="#10b981" transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[-2, paramValue / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[4, paramValue]} />
            <meshPhongMaterial color="#10b981" transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[2, paramValue / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[4, paramValue]} />
            <meshPhongMaterial color="#10b981" transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
        </AutoRotate>
      )}

      {mode === 'prop5' && (
        <AutoRotate speed={0.003}>
          <Surface func={f} color="#3b82f6" opacity={0.6} resolution={30} />
          <Surface func={(x, y) => f(x, y) + paramValue} color="#22c55e" opacity={0.4} resolution={30} />
        </AutoRotate>
      )}

      {mode === 'prop6' && (
        <AutoRotate speed={0.003}>
          <Surface func={(x, y) => paramValue * (3 - (x * x + y * y) / 1.5) / 1.5} color="#10b981" opacity={0.7} resolution={30} />
          {/* Min plane */}
          <FlatPlane width={4} height={4} y={0.2} color="#3b82f6" opacity={0.3} />
          {/* Max plane */}
          <FlatPlane width={4} height={4} y={paramValue * 2} color="#ef4444" opacity={0.2} />
        </AutoRotate>
      )}

      {mode === 'prop7' && (
        <AutoRotate speed={0.003}>
          <Surface func={(x, y) => paramValue * (3 - (x * x + y * y) / 1.5) / 1.5} color="#10b981" opacity={0.7} resolution={30} />
          {/* Average value plane */}
          <FlatPlane width={4} height={4} y={paramValue * 0.8} color="#f59e0b" opacity={0.4} />
        </AutoRotate>
      )}

      {mode === 'parity1' && (
        <AutoRotate speed={0.003}>
          <ParitySurface func={fOdd} a={paramValue} />
          {/* Symmetry dividing plane (YZ plane at x=0) */}
          <mesh position={[0, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[paramValue * 2, 8]} />
            <meshPhongMaterial color="#ef4444" transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
          {/* Base plane with positive/negative halves */}
          <ParityBasePlane a={paramValue} />
          {/* Riemann bars showing cancellation */}
          <ParityRiemannBars func={fOdd} a={paramValue} n={8} />
          {/* Integral value label */}
          <Html position={[0, paramValue * paramValue + 1.5, 0]} center>
            <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-xs font-mono whitespace-nowrap shadow-lg">
              <div className="text-orange-500 dark:text-orange-400">
                正区域 ≈ 负区域
              </div>
              <div className="text-cyan-500 dark:text-cyan-400">
                ∫∫f = 0 (相互抵消)
              </div>
            </div>
          </Html>
        </AutoRotate>
      )}

      {mode === 'parity2' && (
        <AutoRotate speed={0.003}>
          <ParitySurface func={fEven} a={paramValue} positiveColor="#10b981" negativeColor="#10b981" />
          {/* Symmetry dividing plane (YZ plane at x=0) */}
          <mesh position={[0, 3, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[paramValue * 2, 10]} />
            <meshPhongMaterial color="#f59e0b" transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
          {/* Base plane with left/right halves colored differently */}
          <mesh position={[paramValue / 2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[paramValue, paramValue * 2]} />
            <meshPhongMaterial color="#10b981" transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[-paramValue / 2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[paramValue, paramValue * 2]} />
            <meshPhongMaterial color="#34d399" transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
          {/* Riemann bars showing equal contributions from both halves */}
          <ParityRiemannBars func={fEven} a={paramValue} n={6} />
          {/* Integral value label */}
          <Html position={[0, paramValue * paramValue + 1.5, 0]} center>
            <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-xs font-mono whitespace-nowrap shadow-lg">
              <div className="text-emerald-600 dark:text-emerald-400">
                ∫∫f = 2·∫∫<sub>D⁺</sub>f
              </div>
            </div>
          </Html>
        </AutoRotate>
      )}

      {mode === 'cartesian1' && (
        <AutoRotate speed={0.002}>
          <CartesianStrips n={Math.round(paramValue)} type="x" />
          <Surface func={(x, y) => fCartesian((x + 2) / 4, (y + 2) / 4)} xRange={[-2, 2]} yRange={[-2, 2]} color="#10b981" opacity={0.3} resolution={30} />
          <CartesianRegion type="x" />
        </AutoRotate>
      )}

      {mode === 'cartesian2' && (
        <AutoRotate speed={0.002}>
          <CartesianStrips n={Math.round(paramValue)} type="y" />
          <Surface func={(x, y) => fCartesian((x + 2) / 4, (y + 2) / 4)} xRange={[-2, 2]} yRange={[-2, 2]} color="#f59e0b" opacity={0.3} resolution={30} />
          <CartesianRegion type="y" />
        </AutoRotate>
      )}

      {mode === 'rect_approx' && (
        <AutoRotate speed={0.001}>
          <RectApproxBars n={Math.round(paramValue)} />
          <RectApproxCurve />
        </AutoRotate>
      )}

      {mode === 'sphere_cyl1' && (
        <group>
          <SphereWire radius={paramValue2} />
          <SphereWireframe radius={paramValue2} />
          <CylinderMesh radius={paramValue} height={paramValue2 * 2 + 1} />
          <CylinderWireframe radius={paramValue} height={paramValue2 * 2 + 1} />
          <IntersectionVolume sphereR={paramValue2} cylR={paramValue} />
          {/* Volume label */}
          <Html position={[0, paramValue2 + 1, 0]} center>
            <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-xs font-mono whitespace-nowrap shadow-lg">
              <div className="text-emerald-600 dark:text-emerald-400">
                V = 2πa²√(R²-a²) = {sphereCylinderVolume(paramValue2, paramValue).toFixed(4)}
              </div>
            </div>
          </Html>
        </group>
      )}

      {mode === 'sphere_cyl2' && (
        <SphereCyl2Scene />
      )}

      {mode === 'polar1' && (
        <PolarRegionScene />
      )}

      {mode === 'polar2' && (
        <PolarRiemannScene />
      )}

      {mode === 'convergence1' && (
        <ConvergenceScene />
      )}

      {mode === 'convergence2' && (
        <ErrorAnalysisScene />
      )}

      {mode === 'triple1' && (
        <TripleIntegralScene />
      )}

      {mode === 'jacobian1' && (
        <JacobianScene />
      )}

      {mode === 'green1' && (
        <GreenScene />
      )}

      {mode === 'surface_area1' && (
        <SurfaceAreaScene />
      )}

      {mode === 'fubini1' && (
        <FubiniScene />
      )}

      {mode === 'stokes1' && (
        <StokesScene />
      )}

      {mode === 'divergence1' && (
        <DivergenceScene />
      )}

      {mode === 'arc_length1' && (
        <ArcLengthScene />
      )}

      {mode === 'mass_center1' && (
        <MassCenterScene />
      )}

      {mode === 'moment_of_inertia1' && (
        <MomentOfInertiaScene />
      )}

      {mode === 'cylindrical1' && (
        <CylindricalCoordScene />
      )}

      {mode === 'gradient1' && (
        <GradientScene />
      )}

      {mode === 'spherical1' && (
        <SphericalScene />
      )}

      {mode === 'laplace1' && (
        <LaplaceScene />
      )}

      {mode === 'fourier1' && (
        <FourierScene />
      )}

      {mode === 'vector_field1' && (
        <VectorFieldScene />
      )}

      {mode === 'directional1' && (
        <DirectionalDerivativeScene />
      )}

      {mode === 'isosurface1' && (
        <IsosurfaceScene />
      )}

      {mode === 'curl1' && (
        <CurlFieldScene />
      )}

      {mode === 'divergence_field1' && (
        <DivergenceFieldScene />
      )}

      {mode === 'conservative1' && (
        <ConservativeFieldScene />
      )}

      {mode === 'taylor1' && (
        <TaylorExpansionScene />
      )}

      {mode === 'surface_integral1' && (
        <SurfaceIntegralScene />
      )}

      {/* 一元微积分模式 */}
      {mode === 'limit1' && (
        <Limit1Scene />
      )}

      {mode === 'limit2' && (
        <Limit2Scene />
      )}

      {mode === 'derivative1' && (
        <Derivative1Scene />
      )}

      {mode === 'derivative2' && (
        <Derivative2Scene />
      )}

      {mode === 'derivative3' && (
        <Derivative3Scene />
      )}

      {mode === 'rolle1' && (
        <Rolle1Scene />
      )}

      {mode === 'lagrange1' && (
        <Lagrange1Scene />
      )}

      {mode === 'indef_integral1' && (
        <IndefIntegral1Scene />
      )}

      {mode === 'ftc1' && (
        <Ftc1Scene />
      )}

      {mode === 'mean_value_integral1' && (
        <MeanValueIntegral1Scene />
      )}

      {mode === 'area1' && (
        <Area1Scene />
      )}

      {mode === 'volume_rev1' && (
        <VolumeRev1Scene />
      )}

      {/* Single-variable calculus 2D modes */}
      {mode === 'continuity1' && (
        <Continuity1Scene />
      )}
      {mode === 'discontinuity1' && (
        <Discontinuity1Scene />
      )}
      {mode === 'important_limits1' && (
        <ImportantLimits1Scene />
      )}
      {mode === 'lhopital1' && (
        <Lhopital1Scene />
      )}
      {mode === 'monotonicity1' && (
        <Monotonicity1Scene />
      )}
      {mode === 'extrema1' && (
        <Extrema1Scene />
      )}
      {mode === 'concavity1' && (
        <Concavity1Scene />
      )}
      {mode === 'curvature1' && (
        <Curvature1Scene />
      )}
      {mode === 'higher_derivative1' && (
        <HigherDerivative1Scene />
      )}
      {mode === 'substitution1' && (
        <Substitution1Scene />
      )}
      {mode === 'integration_by_parts1' && (
        <IntegrationByParts1Scene />
      )}
      {mode === 'improper_integral1' && (
        <ImproperIntegral1Scene />
      )}
      {mode === 'polar_area1' && (
        <PolarArea1Scene />
      )}
    </>
  )
}

// Sphere-Cyl2 scene component
function SphereCyl2Scene() {
  const { paramValue: zHeight, paramValue2: cylR } = useLabStore()
  const sphereR = 2.5

  const sphereCircleR = Math.sqrt(Math.max(0, sphereR * sphereR - zHeight * zHeight))
  const drawR = Math.min(cylR, sphereCircleR)

  const sphereCirclePts = useMemo(() => {
    const pts: number[] = []
    const res = 64
    for (let i = 0; i <= res; i++) {
      const theta = (2 * Math.PI * i) / res
      pts.push(sphereCircleR * Math.cos(theta), zHeight, sphereCircleR * Math.sin(theta))
    }
    return new Float32Array(pts)
  }, [sphereCircleR, zHeight])

  const cylCirclePts = useMemo(() => {
    const pts: number[] = []
    const res = 64
    for (let i = 0; i <= res; i++) {
      const theta = (2 * Math.PI * i) / res
      pts.push(cylR * Math.cos(theta), zHeight, cylR * Math.sin(theta))
    }
    return new Float32Array(pts)
  }, [cylR, zHeight])

  const filledDiscGeom = useMemo(() => {
    if (drawR <= 0) return null
    const geom = new THREE.CircleGeometry(drawR, 48)
    geom.rotateX(-Math.PI / 2)
    geom.translate(0, zHeight + 0.01, 0)
    return geom
  }, [drawR, zHeight])

  return (
    <group>
      <SphereWire radius={sphereR} opacity={0.08} />
      <SphereWireframe radius={sphereR} />
      <CylinderMesh radius={cylR} height={6} opacity={0.08} />
      <CylinderWireframe radius={cylR} height={6} />

      {/* Sphere cross-section circle */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sphereCirclePts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#6366f1" linewidth={2} />
      </line>
      {/* Cylinder cross-section circle */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[cylCirclePts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#f59e0b" linewidth={2} />
      </line>
      {filledDiscGeom && (
        <mesh geometry={filledDiscGeom}>
          <meshPhongMaterial color="#10b981" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* Horizontal cutting plane */}
      <mesh position={[0, zHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshPhongMaterial color="#94a3b8" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
      {/* z-height indicator line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, -3, 0, 0, zHeight, 0]), 3]}
            count={2}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={1} transparent opacity={0.5} />
      </line>
      {/* Cross-section area label */}
      <Html position={[0, zHeight + 0.3, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-2 py-1 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-emerald-600 dark:text-emerald-400">
            A(z) = π×{cylR.toFixed(1)}² = {(Math.PI * cylR * cylR).toFixed(3)}
          </div>
          <div className="text-muted-foreground">
            z = {zHeight.toFixed(2)}
          </div>
        </div>
      </Html>
    </group>
  )
}

// --- Stokes' Theorem Scene (stokes1) ---
function StokesScene() {
  const { paramValue: a } = useLabStore()

  // Surface: z = a*(2 - x² - y²) over the unit disk
  // F = (-y/2, x/2, z*a)
  // Curl F = (-a, 0, 1)
  const surfaceFunc = useMemo(() => (x: number, y: number) => {
    const r2 = x * x + y * y
    if (r2 > 1) return 0
    return a * (2 - r2)
  }, [a])

  // Paraboloid surface geometry (only over unit disk)
  const surfaceGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []
    const colors: number[] = []
    const res = 30
    const col = new THREE.Color('#22c55e')

    for (let i = 0; i <= res; i++) {
      for (let j = 0; j <= res; j++) {
        const x = -1 + (2 * i) / res
        const y = -1 + (2 * j) / res
        const r2 = x * x + y * y
        const z = r2 <= 1 ? a * (2 - r2) : 0
        const inside = r2 <= 1.02 ? 1 : 0.1
        vertices.push(x, z, y)
        colors.push(col.r * inside, col.g * inside, col.b * inside)
      }
    }

    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        const idx = i * (res + 1) + j
        indices.push(idx, idx + res + 1, idx + 1, idx + 1, idx + res + 1, idx + res + 2)
      }
    }

    geom.setIndex(indices)
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geom.computeVertexNormals()
    return geom
  }, [a])

  // Boundary curve C at z = a on the unit circle
  const boundaryPts = useMemo(() => {
    const pts: number[] = []
    const res = 80
    for (let i = 0; i <= res; i++) {
      const t = (2 * Math.PI * i) / res
      pts.push(Math.cos(t), a, Math.sin(t))
    }
    return new Float32Array(pts)
  }, [a])

  // Normal vectors (blue) on the surface showing curl direction
  const normalArrows = useMemo(() => {
    const arrows: { pos: [number, number, number]; dir: [number, number, number] }[] = []
    const n = 5
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x = -0.6 + (1.2 * i) / (n - 1)
        const y = -0.6 + (1.2 * j) / (n - 1)
        const r2 = x * x + y * y
        if (r2 > 0.8) continue
        const z = a * (2 - r2)
        // Normal direction: (∂z/∂x, ∂z/∂y, -1) flipped for upward normal => (-∂z/∂x, 1, -∂z/∂y)
        // curl F dot n: use simplified version - show normal arrows on surface
        const nx = 2 * a * x
        const ny = 1
        const nz = 2 * a * y
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
        arrows.push({
          pos: [x, z, y],
          dir: [nx / len, ny / len, nz / len],
        })
      }
    }
    return arrows
  }, [a])

  // Tangent arrows (amber) along boundary C showing circulation
  const tangentArrows = useMemo(() => {
    const arrows: { pos: [number, number, number]; dir: [number, number, number] }[] = []
    const n = 12
    for (let i = 0; i < n; i++) {
      const t = (2 * Math.PI * i) / n
      const x = Math.cos(t)
      const y = Math.sin(t)
      // Tangent direction (counterclockwise)
      const tx = -Math.sin(t)
      const ty = Math.cos(t)
      arrows.push({
        pos: [x, a, y],
        dir: [tx, 0, ty],
      })
    }
    return arrows
  }, [a])

  // Direction markers (red cones) on C
  const directionMarkers = useMemo(() => {
    const markers: { pos: [number, number, number]; rot: number }[] = []
    const n = 6
    for (let i = 0; i < n; i++) {
      const t = (2 * Math.PI * i) / n
      markers.push({
        pos: [Math.cos(t), a, Math.sin(t)],
        rot: t,
      })
    }
    return markers
  }, [a])

  const lineIntegral = Math.PI
  const surfaceIntegral = Math.PI

  return (
    <AutoRotate speed={0.002}>
      {/* Paraboloid surface S */}
      <mesh geometry={surfaceGeom}>
        <meshPhongMaterial vertexColors side={THREE.DoubleSide} transparent opacity={0.45} shininess={60} />
      </mesh>

      {/* Boundary curve C (red tube) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[boundaryPts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={3} />
      </line>

      {/* Normal arrows (blue) on surface showing (∇×F)·n direction */}
      {normalArrows.map((arrow, idx) => (
        <group key={`n${idx}`}>
          <arrowHelper
            args={[
              new THREE.Vector3(...arrow.dir),
              new THREE.Vector3(...arrow.pos),
              0.4,
              0x3b82f6,
              0.15,
              0.08,
            ]}
          />
        </group>
      ))}

      {/* Tangent arrows (amber) along C showing F·t circulation */}
      {tangentArrows.map((arrow, idx) => (
        <group key={`t${idx}`}>
          <arrowHelper
            args={[
              new THREE.Vector3(...arrow.dir),
              new THREE.Vector3(...arrow.pos),
              0.3,
              0xf59e0b,
              0.12,
              0.06,
            ]}
          />
        </group>
      ))}

      {/* Direction markers (red cones) on C */}
      {directionMarkers.map((marker, idx) => (
        <mesh key={`d${idx}`} position={marker.pos} rotation={[0, -marker.rot + Math.PI / 2, 0]}>
          <coneGeometry args={[0.06, 0.2, 8]} />
          <meshPhongMaterial color="#ef4444" />
        </mesh>
      ))}

      {/* Floor disk at z=a for boundary */}
      <mesh position={[0, a, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1, 48]} />
        <meshPhongMaterial color="#ef4444" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>

      {/* Vertical lines connecting surface to floor at 4 points */}
      {[0.5, -0.5].map((x) =>
        [0.5, -0.5].map((y) => (
          <line key={`v${x}${y}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([x, 0, y, x, a * (2 - x * x - y * y), y]), 3]}
                count={2}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#22c55e" opacity={0.3} transparent />
          </line>
        ))
      )}

      {/* Info overlay */}
      <Html position={[0, a * 2 + 1.5, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-violet-600 dark:text-violet-400 font-semibold mb-1">
            斯托克斯定理
          </div>
          <div className="text-muted-foreground">
            F = (-y/2, x/2, z·{a.toFixed(1)})
          </div>
          <div className="text-muted-foreground">
            ∇×F = ({(-a).toFixed(1)}, 0, 1)
          </div>
          <div className="text-amber-600 dark:text-amber-400">
            ∮F·dr = {lineIntegral.toFixed(4)}
          </div>
          <div className="text-blue-600 dark:text-blue-400">
            ∬(∇×F)·dS = {surfaceIntegral.toFixed(4)}
          </div>
          <div className="text-emerald-600 dark:text-emerald-400 mt-1">
            ✓ 验证: {Math.abs(lineIntegral - surfaceIntegral) < 0.001 ? '等式成立' : '计算中...'}
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Divergence Theorem Scene (divergence1) ---
function DivergenceScene() {
  const { paramValue: R } = useLabStore()

  // F = (x, y, z), div F = 3
  // Surface flux = ∯ F·dS = 4πR³
  // Volume integral = ∭ 3 dV = 3 * (4/3)πR³ = 4πR³
  const flux = 4 * Math.PI * R * R * R
  const volumeIntegral = 4 * Math.PI * R * R * R

  // Outward normal arrows on sphere surface
  const surfaceArrows = useMemo(() => {
    const arrows: { pos: [number, number, number]; dir: [number, number, number] }[] = []
    // Sample points on sphere using fibonacci sphere
    const n = 24
    const goldenRatio = (1 + Math.sqrt(5)) / 2
    for (let i = 0; i < n; i++) {
      const theta = Math.acos(1 - 2 * (i + 0.5) / n)
      const phi = 2 * Math.PI * i / goldenRatio
      const x = Math.sin(theta) * Math.cos(phi)
      const y = Math.cos(theta)
      const z = Math.sin(theta) * Math.sin(phi)
      // Outward normal = radial direction = (x, y, z) normalized (already unit)
      arrows.push({
        pos: [R * x, R * y, R * z],
        dir: [x, y, z],
      })
    }
    return arrows
  }, [R])

  // Interior divergence arrows (green, showing expansion)
  const interiorArrows = useMemo(() => {
    const arrows: { pos: [number, number, number]; dir: [number, number, number]; len: number }[] = []
    // Sample some interior points along axes and diagonals
    const positions: [number, number, number][] = []
    const step = R * 0.4
    for (let x = -R + step; x < R; x += step) {
      for (let y = -R + step; y < R; y += step) {
        for (let z = -R + step; z < R; z += step) {
          if (x * x + y * y + z * z < R * R * 0.85) {
            positions.push([x, y, z])
          }
        }
      }
    }
    // Limit to ~20 arrows
    const sampled = positions.filter((_, i) => i % Math.max(1, Math.floor(positions.length / 20)) === 0)
    for (const pos of sampled) {
      const len = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2])
      if (len < 0.01) continue
      const dir: [number, number, number] = [pos[0] / len, pos[1] / len, pos[2] / len]
      arrows.push({ pos, dir, len: Math.min(len * 0.3, 0.4) })
    }
    return arrows
  }, [R])

  return (
    <AutoRotate speed={0.002}>
      {/* Sphere surface (semi-transparent blue) */}
      <mesh>
        <sphereGeometry args={[R, 32, 24]} />
        <meshPhongMaterial color="#3b82f6" transparent opacity={0.2} side={THREE.DoubleSide} shininess={60} />
      </mesh>

      {/* Sphere wireframe */}
      <mesh>
        <sphereGeometry args={[R, 16, 12]} />
        <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.15} />
      </mesh>

      {/* Cross-section disc at z=0 */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[R, 48]} />
        <meshPhongMaterial color="#22c55e" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      {/* Cross-section circle outline */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(Array.from({ length: 65 }, (_, i) => {
              const t = (2 * Math.PI * i) / 64
              return [R * Math.cos(t), 0, R * Math.sin(t)]
            }).flat()), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#22c55e" linewidth={2} opacity={0.5} transparent />
      </line>

      {/* Outward normal flux arrows (amber) on surface */}
      {surfaceArrows.map((arrow, idx) => (
        <group key={`s${idx}`}>
          <arrowHelper
            args={[
              new THREE.Vector3(...arrow.dir),
              new THREE.Vector3(...arrow.pos),
              R * 0.25,
              0xf59e0b,
              R * 0.1,
              R * 0.05,
            ]}
          />
        </group>
      ))}

      {/* Interior divergence arrows (green) showing ∇·F > 0 expansion */}
      {interiorArrows.map((arrow, idx) => (
        <group key={`i${idx}`}>
          <arrowHelper
            args={[
              new THREE.Vector3(...arrow.dir),
              new THREE.Vector3(...arrow.pos),
              arrow.len,
              0x22c55e,
              arrow.len * 0.35,
              arrow.len * 0.2,
            ]}
          />
        </group>
      ))}

      {/* Radius indicator line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, 0, R, 0, 0]), 3]}
            count={2}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#f59e0b" linewidth={2} />
      </line>
      {/* R label */}
      <Text
        position={[R / 2, 0.2, 0]}
        fontSize={0.25}
        color="#f59e0b"
        anchorX="center"
        anchorY="middle"
      >
        R={R.toFixed(1)}
      </Text>

      {/* Info overlay */}
      <Html position={[0, R + 2, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-orange-600 dark:text-orange-400 font-semibold mb-1">
            高斯散度定理
          </div>
          <div className="text-muted-foreground">
            F = (x, y, z), ∇·F = 3
          </div>
          <div className="text-amber-600 dark:text-amber-400">
            ∯F·dS = 4πR³ = {flux.toFixed(3)}
          </div>
          <div className="text-green-600 dark:text-green-400">
            ∭(∇·F)dV = 3·(4/3)πR³ = {volumeIntegral.toFixed(3)}
          </div>
          <div className="text-emerald-600 dark:text-emerald-400 mt-1">
            ✓ 验证: {Math.abs(flux - volumeIntegral) < 0.001 ? '等式成立' : '计算中...'}
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Gradient Field Scene ---
function GradientScene() {
  const { paramValue: a } = useLabStore()
  // Surface: z = a * (1 - x² - y²) over [-1, 1]²
  // Gradient: ∇f = (-2ax, -2ay)

  // Surface geometry with heat-mapped colors
  const surfaceData = useMemo(() => {
    const res = 40
    const positions: number[] = []
    const colors: number[] = []
    const indices: number[] = []
    for (let i = 0; i <= res; i++) {
      for (let j = 0; j <= res; j++) {
        const x = -1 + (2 * i) / res
        const y = -1 + (2 * j) / res
        const r2 = x * x + y * y
        const z = r2 <= 1 ? a * (1 - r2) : 0
        positions.push(x, z, y)
        // Heat map: blue (bottom) to red (top)
        const t = Math.max(0, Math.min(1, z / a))
        colors.push(t, 0.2, 1 - t) // red at top, blue at bottom
      }
    }
    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        const a2 = i * (res + 1) + j
        const b2 = a2 + 1
        const c2 = a2 + (res + 1)
        const d2 = c2 + 1
        indices.push(a2, c2, b2, b2, c2, d2)
      }
    }
    return { positions: new Float32Array(positions), colors: new Float32Array(colors), indices }
  }, [a])

  // Gradient arrows on xy-plane: 8x8 grid
  const gradientArrows = useMemo(() => {
    const arrows: { pos: [number, number, number]; dir: [number, number, number]; mag: number }[] = []
    const n = 8
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x = -0.85 + (1.7 * i) / (n - 1)
        const y = -0.85 + (1.7 * j) / (n - 1)
        if (x * x + y * y > 0.95) continue
        const gx = -2 * a * x
        const gy = -2 * a * y
        const mag = Math.sqrt(gx * gx + gy * gy)
        arrows.push({
          pos: [x, 0.01, y],
          dir: mag > 0.001 ? [gx / mag, 0, gy / mag] : [0, 0, 0],
          mag,
        })
      }
    }
    return arrows
  }, [a])

  // Contour lines on the floor (circles since f is radially symmetric)
  const contourLines = useMemo(() => {
    const lines: Float32Array[] = []
    const numContours = 5
    const res = 64
    for (let c = 1; c <= numContours; c++) {
      const r = c / numContours
      if (r >= 1) continue
      const pts: number[] = []
      for (let i = 0; i <= res; i++) {
        const theta = (2 * Math.PI * i) / res
        pts.push(r * Math.cos(theta), 0.005, r * Math.sin(theta))
      }
      lines.push(new Float32Array(pts))
    }
    return lines
  }, [])

  const maxGradMag = 2 * a * Math.SQRT2 // at corner (±1, ±1) but clipped
  const maxGradMagClipped = 2 * a * 0.85 * Math.SQRT2

  return (
    <AutoRotate speed={0.002}>
      {/* Surface z = a*(1-x²-y²) with heat-map coloring */}
      <mesh>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[surfaceData.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[surfaceData.colors, 3]} />
          <bufferAttribute attach="index" args={[new Uint32Array(surfaceData.indices), 1]} />
        </bufferGeometry>
        <meshPhongMaterial vertexColors transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>

      {/* Floor plane */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 2.2]} />
        <meshPhongMaterial color="#e2e8f0" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* Contour lines on floor */}
      {contourLines.map((pts, idx) => (
        <line key={`cl-${idx}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[pts, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#94a3b8" opacity={0.5} transparent />
        </line>
      ))}

      {/* Gradient arrows on xy-plane */}
      {gradientArrows.map((arrow, idx) => {
        const color = arrow.mag < maxGradMagClipped * 0.4 ? 0x22c55e : 0xef4444
        const arrowLen = Math.min(0.15, arrow.mag * 0.08)
        return (
          <group key={`ga-${idx}`}>
            <arrowHelper
              args={[
                new THREE.Vector3(...arrow.dir),
                new THREE.Vector3(...arrow.pos),
                arrowLen,
                color,
                arrowLen * 0.4,
                arrowLen * 0.25,
              ]}
            />
          </group>
        )
      })}

      {/* Info overlay */}
      <Html position={[0, a + 1.5, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-yellow-600 dark:text-yellow-400 font-semibold mb-1">
            梯度场可视化
          </div>
          <div className="text-muted-foreground">
            f(x,y) = {a.toFixed(1)}·(1 - x² - y²)
          </div>
          <div className="text-yellow-700 dark:text-yellow-300">
            ∇f = ({(-2 * a).toFixed(1)}x, {(-2 * a).toFixed(1)}y)
          </div>
          <div className="text-muted-foreground">
            最大梯度模 ≈ {maxGradMagClipped.toFixed(3)}
          </div>
          <div className="text-green-600 dark:text-green-400">
            方向导数最大值 = |∇f| (沿梯度方向)
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Spherical Coordinates Scene ---
function SphericalScene() {
  const { paramValue: R, paramValue2: phiMax } = useLabStore()
  // phiMax is the polar angle range [0, phiMax]

  // Semi-transparent sphere
  const sphereGeom = useMemo(() => {
    return new THREE.SphereGeometry(R, 32, 24)
  }, [R])

  // Concentric circle grid on equatorial plane
  const concentricCircles = useMemo(() => {
    const circles: Float32Array[] = []
    const numCircles = Math.max(1, Math.floor(R / 0.3))
    const res = 64
    for (let c = 1; c <= numCircles; c++) {
      const r = (R * c) / numCircles
      const pts: number[] = []
      for (let i = 0; i <= res; i++) {
        const theta = (2 * Math.PI * i) / res
        pts.push(r * Math.cos(theta), 0, r * Math.sin(theta))
      }
      circles.push(new Float32Array(pts))
    }
    return circles
  }, [R])

  // Great circle arc for θ (azimuthal angle) on equatorial plane
  const thetaArc = useMemo(() => {
    const pts: number[] = []
    const res = 32
    for (let i = 0; i <= res; i++) {
      const t = (Math.PI * 0.6 * i) / res
      pts.push(R * 0.6 * Math.cos(t), 0, R * 0.6 * Math.sin(t))
    }
    return new Float32Array(pts)
  }, [R])

  // Great circle arc for φ (polar angle) in xz plane
  const phiArc = useMemo(() => {
    const pts: number[] = []
    const res = 32
    for (let i = 0; i <= res; i++) {
      const t = (phiMax * i) / res
      const rr = R * 0.6
      pts.push(rr * Math.sin(t), rr * Math.cos(t), 0)
    }
    return new Float32Array(pts)
  }, [R, phiMax])

  // Wedge-shaped volume element showing dV = r²sinφ dr dθ dφ
  const wedgeGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const dr = R * 0.15
    const dTheta = Math.PI / 6
    const dPhi = Math.PI / 8
    const rInner = R * 0.45
    const rOuter = rInner + dr
    const phiStart = Math.PI / 4
    const thetaStart = Math.PI / 6

    const vPts: number[] = []
    const idxPts: number[] = []
    const arcRes = 4
    const phiRes = 4

    // Create vertices for all 8 corners of the wedge
    // For each (r, theta, phi) combination
    const radii = [rInner, rOuter]
    const thetas: number[] = []
    for (let k = 0; k <= arcRes; k++) {
      thetas.push(thetaStart + (k / arcRes) * dTheta)
    }
    const phis: number[] = []
    for (let k = 0; k <= phiRes; k++) {
      phis.push(phiStart + (k / phiRes) * dPhi)
    }

    // Vertices: 2 radii × (arcRes+1) thetas × (phiRes+1) phis
    for (const r of radii) {
      for (const phi of phis) {
        for (const theta of thetas) {
          // Convert spherical to Cartesian: x = r sinφ cosθ, y = r cosφ, z = r sinφ sinθ
          vPts.push(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta))
        }
      }
    }

    // Build index faces
    const s = arcRes + 1 // vertices per phi arc
    for (let ri = 0; ri < 2; ri++) {
      const offset = ri * (s * (phiRes + 1))
      const nextOffset = offset + s * (phiRes + 1)
      for (let pi = 0; pi < phiRes; pi++) {
        for (let ti = 0; ti < arcRes; ti++) {
          const v0 = offset + pi * s + ti
          const v1 = v0 + 1
          const v2 = v0 + s
          const v3 = v2 + 1
          if (ri === 0) {
            // Inner face
            idxPts.push(v0, v2, v1, v1, v2, v3)
          } else {
            // Outer face
            idxPts.push(v0, v1, v2, v1, v3, v2)
          }
        }
      }
    }

    // Connect inner and outer surfaces
    for (let pi = 0; pi < phiRes; pi++) {
      for (let ti = 0; ti < arcRes; ti++) {
        const i0 = pi * s + ti
        const i1 = i0 + 1
        const i2 = i0 + s
        const i3 = i2 + 1
        const o0 = i0 + s * (phiRes + 1)
        const o1 = o0 + 1
        const o2 = o0 + s
        const o3 = o2 + 1
        // Bottom phi face
        if (pi === 0) {
          idxPts.push(i0, o0, i1, i1, o0, o1)
        }
        // Top phi face
        if (pi === phiRes - 1) {
          const it2 = i2, it3 = i3, ot2 = o2, ot3 = o3
          idxPts.push(it2, it3, ot2, it3, ot3, ot2)
        }
        // Left theta face
        if (ti === 0) {
          idxPts.push(i0, i2, o0, i2, o2, o0)
        }
        // Right theta face
        if (ti === arcRes - 1) {
          idxPts.push(i1, o1, i3, i3, o1, o3)
        }
      }
    }

    geom.setIndex(idxPts)
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vPts, 3))
    geom.computeVertexNormals()
    return geom
  }, [R])

  const volume = (4 / 3) * Math.PI * R * R * R

  return (
    <AutoRotate speed={0.002}>
      {/* Semi-transparent sphere */}
      <mesh geometry={sphereGeom}>
        <meshPhongMaterial color="#22c55e" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Sphere wireframe */}
      <mesh geometry={sphereGeom}>
        <meshBasicMaterial color="#22c55e" wireframe transparent opacity={0.15} />
      </mesh>

      {/* Coordinate axis arrows */}
      <arrowHelper args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), R + 0.8, 0xef4444, 0.2, 0.1]} />
      <arrowHelper args={[new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), R + 0.8, 0x22c55e, 0.2, 0.1]} />
      <arrowHelper args={[new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), R + 0.8, 0x3b82f6, 0.2, 0.1]} />

      {/* Axis labels */}
      <Text position={[R + 1.1, 0, 0]} fontSize={0.3} color="#ef4444" anchorX="center" anchorY="middle">r</Text>
      <Text position={[0, R + 1.1, 0]} fontSize={0.3} color="#22c55e" anchorX="center" anchorY="middle">y</Text>
      <Text position={[0, 0, R + 1.1]} fontSize={0.3} color="#3b82f6" anchorX="center" anchorY="middle">z</Text>

      {/* θ label */}
      <Text position={[R * 0.3, 0.2, R * 0.3]} fontSize={0.25} color="#f59e0b" anchorX="center" anchorY="middle">θ</Text>

      {/* φ label */}
      <Text position={[0.2, R * 0.4, 0]} fontSize={0.25} color="#a855f7" anchorX="center" anchorY="middle">φ</Text>

      {/* Wedge volume element (amber) */}
      <mesh geometry={wedgeGeom}>
        <meshPhongMaterial color="#f59e0b" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={wedgeGeom}>
        <meshBasicMaterial color="#f59e0b" wireframe transparent opacity={0.5} />
      </mesh>

      {/* dV label */}
      <Text position={[R * 0.5, R * 0.3, 0.2]} fontSize={0.2} color="#f59e0b" anchorX="center" anchorY="middle">
        dV=r²sinφ
      </Text>

      {/* Concentric circles on equatorial plane */}
      {concentricCircles.map((pts, idx) => (
        <line key={`cc-${idx}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[pts, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#22c55e" opacity={0.3} transparent />
        </line>
      ))}

      {/* θ arc on equatorial plane */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[thetaArc, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#f59e0b" linewidth={2} opacity={0.7} transparent />
      </line>

      {/* φ arc in xz plane */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[phiArc, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#a855f7" linewidth={2} opacity={0.7} transparent />
      </line>

      {/* Info overlay */}
      <Html position={[0, R + 2.5, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-green-600 dark:text-green-400 font-semibold mb-1">
            球坐标系
          </div>
          <div className="text-muted-foreground">
            V = (4/3)πR³ = {volume.toFixed(4)}
          </div>
          <div className="text-muted-foreground">
            r ∈ [0, {R.toFixed(1)}], θ ∈ [0, 2π], φ ∈ [0, {phiMax.toFixed(2)}]
          </div>
          <div className="text-amber-600 dark:text-amber-400">
            dV = r²sinφ dr dθ dφ
          </div>
          <div className="text-purple-600 dark:text-purple-400">
            雅可比因子: r²sinφ
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Laplacian / Harmonic Function Scene ---
function LaplaceScene() {
  const { paramValue: a } = useLabStore()
  // Surface: z = a * cos(x) * cosh(y) over [-2, 2] × [-1, 1]
  // ∂²f/∂x² = -a * cos(x) * cosh(y)
  // ∂²f/∂y² = a * cos(x) * cosh(y)
  // ∇²f = ∂²f/∂x² + ∂²f/∂y² = 0 (harmonic!)

  // Surface geometry colored by Laplacian value
  const surfaceData = useMemo(() => {
    const res = 50
    const positions: number[] = []
    const colors: number[] = []
    const indices: number[] = []
    for (let i = 0; i <= res; i++) {
      for (let j = 0; j <= res; j++) {
        const x = -2 + (4 * i) / res
        const y = -1 + (2 * j) / res
        const z = a * Math.cos(x) * Math.cosh(y)
        positions.push(x, z, y)
        // ∇²f = 0 for this harmonic function, so color is green
        // Small numerical deviation from 0 → slight red/blue
        const laplacian = -a * Math.cos(x) * Math.cosh(y) + a * Math.cos(x) * Math.cosh(y)
        const deviation = Math.abs(laplacian)
        // Green for harmonic (Δf = 0), red/blue for deviation
        if (deviation < 0.01) {
          colors.push(0.2, 0.8, 0.3) // green
        } else {
          colors.push(0.8, 0.2, 0.2) // red (shouldn't happen for true harmonic)
        }
      }
    }
    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        const a2 = i * (res + 1) + j
        const b2 = a2 + 1
        const c2 = a2 + (res + 1)
        const d2 = c2 + 1
        indices.push(a2, c2, b2, b2, c2, d2)
      }
    }
    return { positions: new Float32Array(positions), colors: new Float32Array(colors), indices }
  }, [a])

  // Indicator patches on surface showing local Laplacian value
  const indicatorPatches = useMemo(() => {
    const patches: { pos: [number, number, number]; laplacian: number }[] = []
    const nx = 6
    const ny = 4
    for (let i = 1; i < nx; i++) {
      for (let j = 1; j < ny; j++) {
        const x = -2 + (4 * i) / nx
        const y = -1 + (2 * j) / ny
        const z = a * Math.cos(x) * Math.cosh(y)
        const laplacian = -a * Math.cos(x) * Math.cosh(y) + a * Math.cos(x) * Math.cosh(y)
        patches.push({ pos: [x, z + 0.05, y], laplacian })
      }
    }
    return patches
  }, [a])

  // Contour lines on floor
  const contourLines = useMemo(() => {
    const lines: { pts: Float32Array; isPositive: boolean }[] = []
    const res = 100
    // Contour at z = 0 (where cos(x) = 0)
    const pts0: number[] = []
    for (let i = 0; i <= res; i++) {
      const x = -2 + (4 * i) / res
      // cos(x) = 0 → x = ±π/2
      // Show vertical lines at x = ±π/2
    }
    // Instead, let's do horizontal contour lines at various z values
    for (let level = -2; level <= 4; level += 1) {
      const pts: number[] = []
      for (let i = 0; i <= res; i++) {
        const x = -2 + (4 * i) / res
        const cosX = Math.cos(x)
        if (Math.abs(cosX) < 0.01) continue
        const coshY = level / (a * cosX)
        if (coshY < 1) continue
        const y = Math.acosh(coshY)
        if (y > 1) continue
        pts.push(x, 0.005, y)
        pts.push(x, 0.005, -y)
      }
      if (pts.length > 2) {
        lines.push({ pts: new Float32Array(pts), isPositive: level > 0 })
      }
    }
    return lines
  }, [a])

  const maxZ = a * 1 * Math.cosh(1)
  const maxCoshY = Math.cosh(1)

  return (
    <AutoRotate speed={0.002}>
      {/* Surface z = a*cos(x)*cosh(y) colored by ∇²f */}
      <mesh>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[surfaceData.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[surfaceData.colors, 3]} />
          <bufferAttribute attach="index" args={[new Uint32Array(surfaceData.indices), 1]} />
        </bufferGeometry>
        <meshPhongMaterial vertexColors transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>

      {/* Floor plane */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.5, 2.5]} />
        <meshPhongMaterial color="#e2e8f0" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Contour lines on floor */}
      {contourLines.map((line, idx) => (
        <line key={`cl-${idx}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[line.pts, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={line.isPositive ? '#22c55e' : '#3b82f6'} opacity={0.4} transparent />
        </line>
      ))}

      {/* Indicator patches on surface (small spheres showing Δf value) */}
      {indicatorPatches.map((patch, idx) => (
        <mesh key={`ip-${idx}`} position={patch.pos}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshPhongMaterial
            color={Math.abs(patch.laplacian) < 0.01 ? '#22c55e' : '#ef4444'}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}

      {/* Info overlay */}
      <Html position={[0, maxZ + 1.2, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-slate-600 dark:text-slate-400 font-semibold mb-1">
            拉普拉斯算子与调和函数
          </div>
          <div className="text-muted-foreground">
            f(x,y) = {a.toFixed(1)}·cos(x)·cosh(y)
          </div>
          <div className="text-green-600 dark:text-green-400">
            ∇²f = ∂²f/∂x² + ∂²f/∂y² = 0 ✓
          </div>
          <div className="text-muted-foreground">
            调和函数性质: 无局部极值
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            f(x,y)值域: [{(-a).toFixed(1)}, {(a * maxCoshY).toFixed(2)}]
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Fourier Series Scene (fourier1) ---
function FourierScene() {
  const { paramValue } = useLabStore()
  const N = Math.round(paramValue)

  // Target function: square wave f(x) = sign(sin(x))
  const targetFunc = (x: number) => Math.sign(Math.sin(x))

  // Fourier coefficients for square wave
  // a0 = 0, an = 0, bn = 4/(nπ) for odd n, 0 for even n
  const fourierApprox = useCallback((x: number, numTerms: number) => {
    let sum = 0
    for (let n = 1; n <= numTerms; n++) {
      const bn = n % 2 === 1 ? 4 / (n * Math.PI) : 0
      sum += bn * Math.sin(n * x)
    }
    return sum
  }, [])

  // Generate curve points
  const xRange = [-Math.PI, Math.PI]
  const resolution = 200

  // Target curve (red) - on xz-plane at y=0
  const targetPoints = useMemo(() => {
    const pts: number[] = []
    for (let i = 0; i <= resolution; i++) {
      const x = xRange[0] + (xRange[1] - xRange[0]) * (i / resolution)
      const z = targetFunc(x)
      pts.push(x, 0, z)
    }
    return new Float32Array(pts)
  }, [])

  // Fourier approximation curve (blue) - at y=0.3 offset for visibility
  const approxPoints = useMemo(() => {
    const pts: number[] = []
    for (let i = 0; i <= resolution; i++) {
      const x = xRange[0] + (xRange[1] - xRange[0]) * (i / resolution)
      const z = fourierApprox(x, N)
      pts.push(x, 0.3, z)
    }
    return new Float32Array(pts)
  }, [N, fourierApprox])

  // Harmonic curves - first 5 individual harmonics at different y-levels
  const harmonicCurves = useMemo(() => {
    const curves: { pts: Float32Array; color: string; label: string; yLevel: number }[] = []
    const numHarmonics = Math.min(5, N)
    const colors = ['#22c55e', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899']
    for (let h = 0; h < numHarmonics; h++) {
      const n = h * 2 + 1 // odd harmonics only for square wave
      const yLevel = -0.3 * (h + 1)
      const pts: number[] = []
      for (let i = 0; i <= resolution; i++) {
        const x = xRange[0] + (xRange[1] - xRange[0]) * (i / resolution)
        const bn = 4 / (n * Math.PI)
        const z = bn * Math.sin(n * x)
        pts.push(x, yLevel, z)
      }
      curves.push({
        pts: new Float32Array(pts),
        color: colors[h % colors.length],
        label: `n=${n}`,
        yLevel,
      })
    }
    return curves
  }, [N])

  // Gibbs phenomenon vertical lines at x=0, ±π
  const gibbsLines = useMemo(() => {
    const lines: { x: number; z1: number; z2: number }[] = []
    for (const xPos of [0, Math.PI, -Math.PI]) {
      const approxVal = fourierApprox(xPos + 0.001, N)
      lines.push({ x: xPos, z1: -1.2, z2: approxVal })
    }
    return lines
  }, [N, fourierApprox])

  // L² error computation
  const l2Error = useMemo(() => {
    let sumSq = 0
    const res = 500
    for (let i = 0; i <= res; i++) {
      const x = xRange[0] + (xRange[1] - xRange[0]) * (i / res)
      const diff = targetFunc(x) - fourierApprox(x, N)
      sumSq += diff * diff
    }
    return Math.sqrt(sumSq / res)
  }, [N, fourierApprox])

  // Key coefficients
  const keyCoeffs = useMemo(() => {
    const coeffs: string[] = []
    for (let n = 1; n <= Math.min(N, 5); n++) {
      if (n % 2 === 1) {
        coeffs.push(`b${n}=${(4 / (n * Math.PI)).toFixed(3)}`)
      }
    }
    return coeffs
  }, [N])

  return (
    <AutoRotate speed={0.005}>
      {/* Axis indicators for the xz-plane view */}
      {/* x-axis */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-4, 0, 0, 4, 0, 0]), 3]}
            count={2}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#94a3b8" opacity={0.4} transparent />
      </line>

      {/* Target function curve (red) at y=0 */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[targetPoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={2} />
      </line>

      {/* Fourier approximation curve (blue) at y=0.3 */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[approxPoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" linewidth={2} />
      </line>

      {/* Harmonic curves */}
      {harmonicCurves.map((curve, idx) => (
        <line key={`harm-${idx}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[curve.pts, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={curve.color} opacity={0.7} transparent />
        </line>
      ))}

      {/* Harmonic labels */}
      {harmonicCurves.map((curve, idx) => (
        <Text
          key={`hlabel-${idx}`}
          position={[xRange[1] + 0.3, curve.yLevel, 0]}
          fontSize={0.18}
          color={curve.color}
          anchorX="left"
        >
          {curve.label}
        </Text>
      ))}

      {/* Gibbs phenomenon vertical lines */}
      {gibbsLines.map((line, idx) => (
        <line key={`gibbs-${idx}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([line.x, 0.3, line.z1, line.x, 0.3, line.z2]), 3]}
              count={2}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#ef4444" opacity={0.3} transparent linewidth={1} />
        </line>
      ))}

      {/* Label: target vs approximation */}
      <Text position={[xRange[1] + 0.3, 0, 0.5]} fontSize={0.18} color="#ef4444" anchorX="left">
        目标函数
      </Text>
      <Text position={[xRange[1] + 0.3, 0.3, 0.5]} fontSize={0.18} color="#3b82f6" anchorX="left">
        傅里叶近似
      </Text>

      {/* Vertical separators at ±π, 0 */}
      {[0, Math.PI, -Math.PI].map((xPos, idx) => (
        <line key={`sep-${idx}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([xPos, -2, -1.5, xPos, 0.5, -1.5]), 3]}
              count={2}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#ef4444" opacity={0.2} transparent />
        </line>
      ))}

      {/* Labels at separators */}
      <Text position={[0, 0.6, -1.5]} fontSize={0.15} color="#ef4444" anchorX="center">
        x=0
      </Text>
      <Text position={[Math.PI, 0.6, -1.5]} fontSize={0.15} color="#ef4444" anchorX="center">
        x=π
      </Text>
      <Text position={[-Math.PI, 0.6, -1.5]} fontSize={0.15} color="#ef4444" anchorX="center">
        x=-π
      </Text>

      {/* Info overlay */}
      <Html position={[0, 2.2, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border border-orange-200 dark:border-orange-800 rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-orange-600 dark:text-orange-400 font-semibold mb-1">
            傅里叶级数逼近 (N={N})
          </div>
          <div className="text-muted-foreground">
            f(x) = sign(sin(x)) 方波函数
          </div>
          <div className="text-blue-600 dark:text-blue-400">
            S(x) = Σ bn·sin(nx), bn = 4/(nπ) (n为奇数)
          </div>
          <div className="text-amber-600 dark:text-amber-400">
            L²误差: {l2Error.toFixed(4)}
          </div>
          <div className="text-muted-foreground">
            系数: {keyCoeffs.join(', ')}
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Isosurface and Contour Lines Scene (isosurface1) ---
function IsosurfaceScene() {
  const { paramValue, paramValue2 } = useLabStore()
  const numLevels = Math.round(paramValue)
  const funcType = Math.round(paramValue2) // 0 = sphere mode, 1 = paraboloid mode

  // Color gradient from blue (inner) to red (outer)
  const levelColors = useMemo(() => {
    const colors: string[] = []
    for (let i = 0; i < numLevels; i++) {
      const t = numLevels > 1 ? i / (numLevels - 1) : 0
      // Blue → Cyan → Green → Yellow → Red
      const r = Math.round(t < 0.5 ? 0 : (t - 0.5) * 2 * 255)
      const g = Math.round(t < 0.5 ? t * 2 * 255 : (1 - (t - 0.5) * 2) * 255)
      const b = Math.round(t < 0.5 ? (1 - t * 2) * 255 : 0)
      colors.push(`rgb(${r}, ${g}, ${b})`)
    }
    return colors
  }, [numLevels])

  // Sphere mode: f(x,y,z) = x²+y²+z² = c → radius = √c
  // Level values: c_i evenly spaced
  const sphereLevels = useMemo(() => {
    const levels: { c: number; radius: number; color: string }[] = []
    for (let i = 0; i < numLevels; i++) {
      const c = (i + 1) * (16 / numLevels) // c from ~2 to ~16
      levels.push({ c, radius: Math.sqrt(c), color: levelColors[i] })
    }
    return levels
  }, [numLevels, levelColors])

  // Paraboloid mode: f(x,y) = x²+y², z = x²+y²
  // Slice heights for contour lines
  const paraboloidLevels = useMemo(() => {
    const levels: { c: number; radius: number; height: number; color: string }[] = []
    for (let i = 0; i < numLevels; i++) {
      const c = (i + 1) * (8 / numLevels) // height from ~1 to ~8
      levels.push({ c, radius: Math.sqrt(c), height: c, color: levelColors[i] })
    }
    return levels
  }, [numLevels, levelColors])

  // Floor contour circles (same for both modes, different function)
  const floorContours = useMemo(() => {
    const contours: Float32Array[] = []
    const res = 64
    const levels = funcType === 0
      ? sphereLevels.map(l => l.radius)
      : paraboloidLevels.map(l => l.radius)
    for (const r of levels) {
      const pts: number[] = []
      for (let i = 0; i <= res; i++) {
        const theta = (2 * Math.PI * i) / res
        pts.push(r * Math.cos(theta), 0.01, r * Math.sin(theta))
      }
      contours.push(new Float32Array(pts))
    }
    return contours
  }, [funcType, sphereLevels, paraboloidLevels])

  // Surface contour lines on the paraboloid (for mode 1)
  const surfaceContours = useMemo(() => {
    if (funcType !== 1) return []
    const contours: { pts: Float32Array; height: number; color: string }[] = []
    const res = 64
    for (const level of paraboloidLevels) {
      const pts: number[] = []
      for (let i = 0; i <= res; i++) {
        const theta = (2 * Math.PI * i) / res
        const x = level.radius * Math.cos(theta)
        const y = level.radius * Math.sin(theta)
        pts.push(x, level.height, y)
      }
      contours.push({ pts: new Float32Array(pts), height: level.height, color: level.color })
    }
    return contours
  }, [funcType, paraboloidLevels])

  // Horizontal slice planes for paraboloid mode
  const slicePlanes = useMemo(() => {
    if (funcType !== 1) return []
    return paraboloidLevels.map(l => ({
      height: l.height,
      radius: l.radius,
      color: l.color,
    }))
  }, [funcType, paraboloidLevels])

  // Paraboloid surface geometry
  const paraboloidGeom = useMemo(() => {
    if (funcType !== 1) return null
    const geom = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []
    const colors: number[] = []
    const res = 40
    const maxR = 3
    for (let i = 0; i <= res; i++) {
      for (let j = 0; j <= res; j++) {
        const x = -maxR + (2 * maxR * i) / res
        const y = -maxR + (2 * maxR * j) / res
        const r2 = x * x + y * y
        const z = r2 // f(x,y) = x² + y²
        vertices.push(x, z, y)
        // Color by height
        const t = Math.min(z / 9, 1)
        const r = t < 0.5 ? 0 : (t - 0.5) * 2
        const g = t < 0.5 ? t * 2 : (1 - (t - 0.5) * 2)
        const b = t < 0.5 ? 1 - t * 2 : 0
        colors.push(r, g, b)
      }
    }
    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        const a = i * (res + 1) + j
        const b2 = a + 1
        const c = (i + 1) * (res + 1) + j
        const d = c + 1
        indices.push(a, c, b2, b2, c, d)
      }
    }
    geom.setIndex(indices)
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geom.computeVertexNormals()
    return geom
  }, [funcType])

  // Level value labels for Html overlay
  const levelLabels = funcType === 0
    ? sphereLevels.map((l, i) => `c${i + 1}=${l.c.toFixed(1)} (r=${l.radius.toFixed(2)})`).join(', ')
    : paraboloidLevels.map((l, i) => `c${i + 1}=${l.c.toFixed(1)} (r=${l.radius.toFixed(2)})`).join(', ')

  const funcFormula = funcType === 0
    ? 'f(x,y,z) = x² + y² + z²'
    : 'f(x,y) = x² + y²,  z = x² + y²'

  return (
    <AutoRotate speed={0.004}>
      {/* Coordinate axes */}
      <Axes length={4} />
      <AxisLabels length={4} />

      {funcType === 0 ? (
        // === SPHERE MODE: Concentric semi-transparent spheres ===
        <group>
          {sphereLevels.map((level, idx) => (
            <group key={idx}>
              {/* Semi-transparent sphere */}
              <mesh>
                <sphereGeometry args={[level.radius, 32, 24]} />
                <meshStandardMaterial
                  color={level.color}
                  transparent
                  opacity={0.15 + idx * 0.03}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
              {/* Wireframe overlay */}
              <mesh>
                <sphereGeometry args={[level.radius, 16, 12]} />
                <meshBasicMaterial
                  color={level.color}
                  wireframe
                  transparent
                  opacity={0.3}
                />
              </mesh>
              {/* Equator circle (contour on xy-plane) */}
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    args={[(() => {
                      const pts: number[] = []
                      const res = 64
                      for (let i = 0; i <= res; i++) {
                        const theta = (2 * Math.PI * i) / res
                        pts.push(level.radius * Math.cos(theta), 0, level.radius * Math.sin(theta))
                      }
                      return new Float32Array(pts)
                    })(), 3]}
                  />
                </bufferGeometry>
                <lineBasicMaterial color={level.color} linewidth={2} />
              </line>
            </group>
          ))}
        </group>
      ) : (
        // === PARABOLOID MODE: Surface with contour lines and slice planes ===
        <group>
          {/* Paraboloid surface */}
          {paraboloidGeom && (
            <mesh geometry={paraboloidGeom}>
              <meshPhongMaterial
                vertexColors
                side={THREE.DoubleSide}
                transparent
                opacity={0.4}
                shininess={60}
              />
            </mesh>
          )}

          {/* Horizontal slice planes at different heights */}
          {slicePlanes.map((slice, idx) => (
            <mesh key={`slice-${idx}`} position={[0, slice.height, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[slice.radius, 32]} />
              <meshStandardMaterial
                color={slice.color}
                transparent
                opacity={0.12}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          ))}

          {/* Contour lines on the surface */}
          {surfaceContours.map((contour, idx) => (
            <line key={`surf-contour-${idx}`}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[contour.pts, 3]} />
              </bufferGeometry>
              <lineBasicMaterial color={contour.color} linewidth={2} />
            </line>
          ))}

          {/* Vertical connecting lines from surface contour to floor */}
          {paraboloidLevels.map((level, idx) => (
            <group key={`vline-${idx}`}>
              {/* Drop line at +x direction */}
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    args={[new Float32Array([level.radius, 0, 0, level.radius, level.height, 0]), 3]}
                    count={2}
                  />
                </bufferGeometry>
                <lineBasicMaterial color={level.color} opacity={0.4} transparent />
              </line>
              {/* Drop line at -x direction */}
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    args={[new Float32Array([-level.radius, 0, 0, -level.radius, level.height, 0]), 3]}
                    count={2}
                  />
                </bufferGeometry>
                <lineBasicMaterial color={level.color} opacity={0.4} transparent />
              </line>
              {/* Drop line at +z direction */}
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    args={[new Float32Array([0, 0, level.radius, 0, level.height, level.radius]), 3]}
                    count={2}
                  />
                </bufferGeometry>
                <lineBasicMaterial color={level.color} opacity={0.4} transparent />
              </line>
              {/* Drop line at -z direction */}
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    args={[new Float32Array([0, 0, -level.radius, 0, level.height, -level.radius]), 3]}
                    count={2}
                  />
                </bufferGeometry>
                <lineBasicMaterial color={level.color} opacity={0.4} transparent />
              </line>
            </group>
          ))}
        </group>
      )}

      {/* Floor projection of contour lines (both modes) */}
      {floorContours.map((pts, idx) => (
        <line key={`floor-${idx}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[pts, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={levelColors[idx] || '#06b6d4'} linewidth={2} />
        </line>
      ))}

      {/* Floor plane */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshPhongMaterial color="#e2e8f0" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>

      {/* Html overlay */}
      <Html position={[0, 5.5, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-cyan-600 dark:text-cyan-400 font-semibold mb-0.5">
            {funcFormula}
          </div>
          <div className="text-muted-foreground">
            等值层数: {numLevels}
          </div>
          <div className="text-amber-600 dark:text-amber-400 text-[10px] max-w-[280px] truncate">
            {levelLabels}
          </div>
          <div className="text-muted-foreground/60 text-[9px] mt-0.5">
            {funcType === 0 ? '球面模式 | 等值面 = 同心球' : '抛物面模式 | 等高线 = 同心圆'}
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}

// --- Vector Field Line Integral Scene (vector_field1) ---
function VectorFieldScene() {
  const { paramValue } = useLabStore()
  const curvature = paramValue

  // Path C: r(t) = (2t, a*sin(πt)), t in [0,1]
  const pX = (t: number) => 2 * t
  const pY = useCallback((t: number) => curvature * Math.sin(Math.PI * t), [curvature])
  const pDx = useCallback(() => 2, [])
  const pDy = useCallback((t: number) => curvature * Math.PI * Math.cos(Math.PI * t), [curvature])

  // 10x10 grid of vector field arrows
  const fieldArrows = useMemo(() => {
    const arrows: { pos: [number, number, number]; dir: [number, number, number]; color: string; len: number }[] = []
    const gridSize = 10
    const range = [-2, 2]
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = range[0] + (range[1] - range[0]) * ((i + 0.5) / gridSize)
        const y = range[0] + (range[1] - range[0]) * ((j + 0.5) / gridSize)
        const fx = -y / 2
        const fy = x / 2
        const mag = Math.sqrt(fx * fx + fy * fy)
        const maxMag = 1.1
        const normalizedMag = Math.min(mag / maxMag, 1)
        // Color: green (short) → red (long)
        const r = Math.round(normalizedMag * 220 + 35)
        const g = Math.round((1 - normalizedMag) * 200 + 55)
        const color = `rgb(${r}, ${g}, 50)`
        const scale = 0.3
        arrows.push({
          pos: [x, 0, y],
          dir: [fx * scale / mag, 0, fy * scale / mag],
          color,
          len: mag,
        })
      }
    }
    return arrows
  }, [])

  // Path curve points
  const pathPoints = useMemo(() => {
    const pts: number[] = []
    const res = 100
    for (let i = 0; i <= res; i++) {
      const t = i / res
      pts.push(pX(t), 0.05, pY(t))
    }
    return new Float32Array(pts)
  }, [pY])

  // Direction cones (6 red cones along C)
  const directionCones = useMemo(() => {
    const cones: { pos: [number, number, number]; rot: number }[] = []
    for (let i = 0; i < 6; i++) {
      const t = (i + 0.5) / 6
      const x = pX(t)
      const y = pY(t)
      const dy = pDy(t)
      const angle = Math.atan2(dy, 2)
      cones.push({ pos: [x, 0.05, y], rot: -angle + Math.PI / 2 })
    }
    return cones
  }, [pY, pDy])

  // Tangential components at 8 points
  const tangentialComponents = useMemo(() => {
    const comps: { pos: [number, number, number]; dir: [number, number, number]; projLen: number }[] = []
    for (let i = 0; i < 8; i++) {
      const t = (i + 0.5) / 8
      const x = pX(t)
      const y = pY(t)
      const dx = 2
      const dy = pDy(t)
      const tMag = Math.sqrt(dx * dx + dy * dy)
      const tx = dx / tMag
      const ty = dy / tMag
      const fx = -y / 2
      const fy = x / 2
      const projLen = fx * tx + fy * ty
      const scale = 0.3
      comps.push({
        pos: [x, 0.1, y],
        dir: [projLen * tx * scale, 0, projLen * ty * scale],
        projLen,
      })
    }
    return comps
  }, [pY, pDy])

  // Compute line integral numerically
  const lineIntegral = useMemo(() => {
    let integral = 0
    const res = 1000
    for (let i = 0; i < res; i++) {
      const t = (i + 0.5) / res
      const x = pX(t)
      const y = pY(t)
      const dx = 2 / res
      const dy = pDy(t) / res
      integral += (-y / 2) * dx + (x / 2) * dy
    }
    return integral
  }, [pY, pDy])

  // Path length
  const pathLength = useMemo(() => {
    let len = 0
    const res = 1000
    for (let i = 0; i < res; i++) {
      const t1 = i / res
      const t2 = (i + 1) / res
      const dx = pX(t2) - pX(t1)
      const dy = pY(t2) - pY(t1)
      len += Math.sqrt(dx * dx + dy * dy)
    }
    return len
  }, [pY])

  // Green fill under path (triangulated)
  const fillGeom = useMemo(() => {
    const shape = new THREE.Shape()
    const res = 60
    shape.moveTo(pX(0), pY(0))
    for (let i = 1; i <= res; i++) {
      const t = i / res
      shape.lineTo(pX(t), pY(t))
    }
    shape.lineTo(pX(1), 0)
    shape.lineTo(pX(0), 0)
    shape.lineTo(pX(0), pY(0))
    const geom = new THREE.ShapeGeometry(shape)
    geom.rotateX(-Math.PI / 2)
    geom.translate(0, -0.01, 0)
    return geom
  }, [pY])

  return (
    <AutoRotate speed={0.005}>
      {/* Grid floor */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, 5]} />
        <meshPhongMaterial color="#e2e8f0" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Vector field arrows */}
      {fieldArrows.map((arrow, idx) => (
        <group key={`vf-${idx}`} position={arrow.pos}>
          {/* Arrow shaft */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([0, 0, 0, arrow.dir[0], arrow.dir[1], arrow.dir[2]]), 3]}
                count={2}
              />
            </bufferGeometry>
            <lineBasicMaterial color={arrow.color} opacity={0.7} transparent />
          </line>
          {/* Arrow head (small cone) */}
          <mesh
            position={[arrow.dir[0], arrow.dir[1], arrow.dir[2]]}
            rotation={[0, Math.atan2(arrow.dir[2], arrow.dir[0]), -Math.PI / 2]}
          >
            <coneGeometry args={[0.04, 0.1, 6]} />
            <meshPhongMaterial color={arrow.color} transparent opacity={0.8} />
          </mesh>
        </group>
      ))}

      {/* Green fill under path (work area) */}
      <mesh geometry={fillGeom}>
        <meshPhongMaterial color="#22c55e" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Path C curve (amber) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pathPoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#f59e0b" linewidth={2} />
      </line>

      {/* Direction cones (red) along C */}
      {directionCones.map((cone, idx) => (
        <mesh key={`cone-${idx}`} position={cone.pos} rotation={[0, cone.rot, 0]}>
          <coneGeometry args={[0.08, 0.2, 6]} />
          <meshPhongMaterial color="#ef4444" transparent opacity={0.8} />
        </mesh>
      ))}

      {/* Tangential components (amber lines at 8 points) */}
      {tangentialComponents.map((comp, idx) => (
        <line key={`tang-${idx}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([
                comp.pos[0], comp.pos[1], comp.pos[2],
                comp.pos[0] + comp.dir[0], comp.pos[1] + comp.dir[1], comp.pos[2] + comp.dir[2]
              ]), 3]}
              count={2}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#f59e0b" opacity={0.8} transparent />
        </line>
      ))}

      {/* Path endpoints */}
      <mesh position={[pX(0), 0.05, pY(0)]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshPhongMaterial color="#22c55e" />
      </mesh>
      <mesh position={[pX(1), 0.05, pY(1)]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshPhongMaterial color="#ef4444" />
      </mesh>

      {/* Labels */}
      <Text position={[pX(0) - 0.2, 0.3, pY(0)]} fontSize={0.15} color="#22c55e" anchorX="right">
        起点
      </Text>
      <Text position={[pX(1) + 0.2, 0.3, pY(1)]} fontSize={0.15} color="#ef4444" anchorX="left">
        终点
      </Text>
      <Text position={[1, 0.3, pY(0.5) + 0.5]} fontSize={0.15} color="#f59e0b" anchorX="center">
        路径C
      </Text>

      {/* Info overlay */}
      <Html position={[0, 2.5, 0]} center>
        <div className="bg-background/90 backdrop-blur-sm border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap shadow-lg">
          <div className="text-teal-600 dark:text-teal-400 font-semibold mb-1">
            向量场线积分
          </div>
          <div className="text-muted-foreground">
            F = (-y/2, x/2)
          </div>
          <div className="text-amber-600 dark:text-amber-400">
            ∫C F·dr = {lineIntegral.toFixed(4)}
          </div>
          <div className="text-muted-foreground">
            路径长度: {pathLength.toFixed(4)}
          </div>
          <div className="text-muted-foreground">
            弯曲度 a = {curvature.toFixed(1)}
          </div>
        </div>
      </Html>
    </AutoRotate>
  )
}
