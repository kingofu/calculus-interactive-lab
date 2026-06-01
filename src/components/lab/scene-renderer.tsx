'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useLabStore } from '@/store/lab-store'
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
} from '@/lib/math-computations'

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

// --- Riemann bars ---
function RiemannBars({
  func,
  n = 8,
  xRange = [-3, 3],
  yRange = [-3, 3],
  color = '#10b981',
  opacity = 0.7,
  showColorSign = false,
}: {
  func: (x: number, y: number) => number
  n?: number
  xRange?: [number, number]
  yRange?: [number, number]
  color?: string
  opacity?: number
  showColorSign?: boolean
}) {
  const bars = useMemo(() => {
    const result: { x: number; z: number; w: number; d: number; h: number; sign: number }[] = []
    const [xMin, xMax] = xRange
    const [yMin, yMax] = yRange
    const dx = (xMax - xMin) / n
    const dy = (yMax - yMin) / n
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x = xMin + (i + 0.5) * dx
        const y = yMin + (j + 0.5) * dy
        const h = func(x, y)
        if (Math.abs(h) > 0.001) {
          result.push({ x, z: y, w: dx * 0.9, d: dy * 0.9, h, sign: h >= 0 ? 1 : -1 })
        }
      }
    }
    return result
  }, [func, n, xRange, yRange])

  return (
    <group>
      {bars.map((bar, idx) => (
        <mesh key={idx} position={[bar.x, bar.h / 2, bar.z]}>
          <boxGeometry args={[bar.w, Math.abs(bar.h), bar.d]} />
          <meshPhongMaterial
            color={
              showColorSign
                ? bar.sign >= 0
                  ? '#f97316'
                  : '#06b6d4'
                : color
            }
            transparent
            opacity={opacity}
          />
        </mesh>
      ))}
    </group>
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

// --- Rectangular approximation bars (IMPROVED with floor projection) ---
function RectApproxBars({ n = 10 }: { n?: number }) {
  const barData = useMemo(() => {
    const result: { x: number; h: number; w: number; positive: boolean }[] = []
    const a = -2
    const b = 2
    const dx = (b - a) / n
    for (let i = 0; i < n; i++) {
      const x = a + (i + 0.5) * dx
      const h = fRect(x)
      result.push({ x, h, w: dx * 0.9, positive: h > 0 })
    }
    return result
  }, [n])

  const approxValue = useMemo(() => rectApprox(fRect, -2, 2, n), [n])
  const exactValue = useMemo(() => numericalIntegral1D(fRect, -2, 2), [])

  return (
    <group>
      {/* 3D bars */}
      {barData.map((bar, idx) => (
        <group key={idx}>
          <mesh position={[bar.x, bar.h / 2, 0]}>
            <boxGeometry args={[bar.w, bar.h, 0.4]} />
            <meshPhongMaterial
              color={bar.h > 2 ? '#10b981' : bar.h > 1 ? '#34d399' : '#6ee7b7'}
              transparent
              opacity={0.7}
            />
          </mesh>
          {/* Floor projection (2D view from above) */}
          <mesh position={[bar.x, 0.005, -1.5]}>
            <boxGeometry args={[bar.w, 0.01, 0.3]} />
            <meshPhongMaterial
              color={bar.h > 2 ? '#10b981' : bar.h > 1 ? '#34d399' : '#6ee7b7'}
              transparent
              opacity={0.5}
            />
          </mesh>
        </group>
      ))}
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

// --- Polar Riemann Sum (polar2) ---
function PolarRiemannScene() {
  const { paramValue: nR } = useLabStore()
  const R = 2
  const beta = 2 * Math.PI
  const nTheta = Math.max(4, Math.round(nR * 2))

  const wedgeData = useMemo(() => {
    const result: {
      vertices: Float32Array
      indices: Uint16Array
      height: number
      color: string
      labelPos: [number, number, number]
    }[] = []
    const dr = R / nR
    const dTheta = beta / nTheta

    for (let i = 0; i < nR; i++) {
      const rInner = i * dr
      const rOuter = (i + 1) * dr
      const rMid = (i + 0.5) * dr

      for (let j = 0; j < nTheta; j++) {
        const thetaMin = j * dTheta
        const thetaMid = thetaMin + dTheta / 2
        const thetaMax = thetaMin + dTheta

        const x = rMid * Math.cos(thetaMid)
        const y = rMid * Math.sin(thetaMid)
        const h = fPolar(x, y) * rMid // Jacobian factor r

        if (h < 0.01) continue

        // Build wedge vertices (4 corners on the floor + 4 corners on top)
        const arcRes = 4
        const vPts: number[] = []
        const idxPts: number[] = []

        // Inner arc (bottom)
        for (let k = 0; k <= arcRes; k++) {
          const t = thetaMin + (k / arcRes) * dTheta
          vPts.push(rInner * Math.cos(t), 0, rInner * Math.sin(t))
        }
        // Outer arc (bottom)
        for (let k = 0; k <= arcRes; k++) {
          const t = thetaMin + (k / arcRes) * dTheta
          vPts.push(rOuter * Math.cos(t), 0, rOuter * Math.sin(t))
        }
        // Inner arc (top)
        for (let k = 0; k <= arcRes; k++) {
          const t = thetaMin + (k / arcRes) * dTheta
          vPts.push(rInner * Math.cos(t), h, rInner * Math.sin(t))
        }
        // Outer arc (top)
        for (let k = 0; k <= arcRes; k++) {
          const t = thetaMin + (k / arcRes) * dTheta
          vPts.push(rOuter * Math.cos(t), h, rOuter * Math.sin(t))
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

        const color = (i + j) % 2 === 0 ? '#10b981' : '#14b8a6'

        result.push({
          vertices: new Float32Array(vPts),
          indices: new Uint16Array(idxPts),
          height: h,
          color,
          labelPos: [x, h + 0.2, y],
        })
      }
    }
    return result
  }, [nR, R, beta, nTheta])

  const approxValue = useMemo(() => {
    return polarRiemannSum(fPolar, R, 0, beta, nR, nTheta)
  }, [nR, R, beta, nTheta])

  return (
    <AutoRotate speed={0.002}>
      {/* Wedge bars */}
      {wedgeData.map((wedge, idx) => (
        <mesh key={idx}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[wedge.vertices, 3]} />
            <bufferAttribute attach="index" args={[wedge.indices, 1]} count={wedge.indices.length} />
          </bufferGeometry>
          <meshPhongMaterial color={wedge.color} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      ))}

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

      {/* Riemann bars with error-based coloring */}
      <RiemannBars
        func={f}
        n={nInt}
        color={barColor}
        opacity={0.6}
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

// --- Error Analysis (convergence2) ---
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

  return (
    <AutoRotate speed={0.001}>
      {/* Bars for midpoint error */}
      {barData.bars.map((bar, idx) => {
        const hMid = Math.max(0.02, (bar.hMid - minLog) * scaleH)
        const hLeft = Math.max(0.02, (bar.hLeft - minLog) * scaleH)
        return (
          <group key={idx}>
            {/* Midpoint error bar (emerald) */}
            <mesh position={[bar.x - 0.15, hMid / 2, -0.2]}>
              <boxGeometry args={[0.25, hMid, 0.3]} />
              <meshPhongMaterial color="#10b981" transparent opacity={0.7} />
            </mesh>
            {/* Left endpoint error bar (amber) */}
            <mesh position={[bar.x + 0.15, hLeft / 2, 0.2]}>
              <boxGeometry args={[0.25, hLeft, 0.3]} />
              <meshPhongMaterial color="#f59e0b" transparent opacity={0.7} />
            </mesh>
            {/* n label */}
            {idx % Math.max(1, Math.floor(barData.bars.length / 8)) === 0 && (
              <Text
                position={[bar.x, -0.4, 0]}
                fontSize={0.2}
                color="#94a3b8"
                anchorX="center"
                anchorY="middle"
              >
                {bar.label}
              </Text>
            )}
          </group>
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

// --- Triple Integral Visualization (triple1) ---
function TripleIntegralScene() {
  const { paramValue: n } = useLabStore()
  const nInt = Math.max(2, Math.round(n))

  const voxelData = useMemo(() => {
    const result: { pos: [number, number, number]; color: string; size: number }[] = []
    const dx = 1 / nInt
    const scale = 3 // Scale [0,1] to [0,3]
    const offset = 0 // Start at origin
    // f(x,y,z) = x² + y² + z², max at (1,1,1) = 3
    const maxVal = 3

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
          })
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

  return (
    <AutoRotate speed={0.002}>
      {/* Voxels */}
      {voxelData.map((voxel, idx) => (
        <mesh key={idx} position={voxel.pos}>
          <boxGeometry args={[voxel.size, voxel.size, voxel.size]} />
          <meshPhongMaterial color={voxel.color} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      ))}

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
  useFrame(() => {
    if (ref.current) {
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
            近似弧长: {approxl.toFixed(4)}
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

      {/* Common elements */}
      <Axes length={axisLength} />
      <AxisLabels length={axisLength} />
      <XYGrid />

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
          <RiemannBars func={f} n={Math.round(paramValue)} color="#10b981" opacity={0.7} />
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
