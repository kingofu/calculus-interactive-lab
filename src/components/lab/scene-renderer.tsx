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

// ============= MAIN SCENE RENDERER =============
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
