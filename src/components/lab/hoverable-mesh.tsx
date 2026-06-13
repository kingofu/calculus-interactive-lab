'use client'

import { useState, useRef, useCallback, ReactNode } from 'react'
import { useThree } from '@react-three/fiber'
import { useLabStore } from '@/store/lab-store'
import * as THREE from 'three'

interface HoverableMeshProps {
  /** Tooltip HTML content (supports inline HTML tags for styling) */
  tooltipContent: string
  /** Child mesh elements to wrap */
  children: ReactNode
  /** Optional highlight color on hover (CSS color string) */
  highlightColor?: string
  /** Scale factor on hover, default 1.08 */
  hoverScale?: number
  /** Position of the mesh group (for 3D->screen projection) */
  position?: [number, number, number]
}

/**
 * HoverableMesh - Wraps child meshes and adds hover interactivity.
 * On hover: slight scale-up + show tooltip at projected screen position.
 * On unhover: return to normal + hide tooltip.
 * Uses R3F's onPointerOver/onPointerOut events for raycasting.
 */
export function HoverableMesh({
  tooltipContent,
  children,
  highlightColor,
  hoverScale = 1.08,
  position = [0, 0, 0],
}: HoverableMeshProps) {
  const [hovered, setHovered] = useState(false)
  const groupRef = useRef<THREE.Group>(null)
  const { camera, gl } = useThree()
  const { showTooltip, hideTooltip } = useLabStore.getState()

  const handlePointerOver = useCallback(
    (e: THREE.Event) => {
      // Stop propagation so parent meshes don't also trigger
      (e as unknown as { stopPropagation: () => void }).stopPropagation()
      setHovered(true)
      document.body.style.cursor = 'pointer'

      // Project 3D position to screen coordinates
      if (groupRef.current) {
        const worldPos = new THREE.Vector3()
        groupRef.current.getWorldPosition(worldPos)
        worldPos.project(camera)

        const canvas = gl.domElement
        const rect = canvas.getBoundingClientRect()
        const x = (worldPos.x * 0.5 + 0.5) * rect.width + rect.left
        const y = (-worldPos.y * 0.5 + 0.5) * rect.height + rect.top

        showTooltip({ content: tooltipContent, x, y })
      }
    },
    [camera, gl, tooltipContent, showTooltip]
  )

  const handlePointerOut = useCallback(() => {
    setHovered(false)
    document.body.style.cursor = 'auto'
    hideTooltip()
  }, [hideTooltip])

  const scale = hovered ? hoverScale : 1

  return (
    <group
      ref={groupRef}
      position={position}
      scale={[scale, scale, scale]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {children}
    </group>
  )
}

/**
 * Convenience wrapper for a single box mesh with hover tooltip.
 * Used in scenes with many bars (Riemann bars, voxels, etc.)
 */
export function HoverableBar({
  position,
  size,
  color,
  opacity = 0.7,
  tooltipContent,
  hoverScale = 1.05,
}: {
  position: [number, number, number]
  size: [number, number, number]
  color: string
  opacity?: number
  tooltipContent: string
  hoverScale?: number
}) {
  const [hovered, setHovered] = useState(false)
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera, gl } = useThree()
  const showTooltip = useLabStore((s) => s.showTooltip)
  const hideTooltip = useLabStore((s) => s.hideTooltip)

  const handlePointerOver = useCallback(
    (e: THREE.Event) => {
      (e as unknown as { stopPropagation: () => void }).stopPropagation()
      setHovered(true)
      document.body.style.cursor = 'pointer'

      if (meshRef.current) {
        const worldPos = new THREE.Vector3()
        meshRef.current.getWorldPosition(worldPos)
        worldPos.project(camera)

        const canvas = gl.domElement
        const rect = canvas.getBoundingClientRect()
        const x = (worldPos.x * 0.5 + 0.5) * rect.width + rect.left
        const y = (-worldPos.y * 0.5 + 0.5) * rect.height + rect.top

        showTooltip({ content: tooltipContent, x, y })
      }
    },
    [camera, gl, tooltipContent, showTooltip]
  )

  const handlePointerOut = useCallback(() => {
    setHovered(false)
    document.body.style.cursor = 'auto'
    hideTooltip()
  }, [hideTooltip])

  const scale = hovered ? hoverScale : 1

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={[scale, scale, scale]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <boxGeometry args={size} />
      <meshPhongMaterial
        color={hovered ? '#34d399' : color}
        transparent
        opacity={hovered ? Math.min(1, opacity + 0.2) : opacity}
      />
    </mesh>
  )
}
