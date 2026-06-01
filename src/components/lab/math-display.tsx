'use client'

import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface MathDisplayProps {
  math: string
  display?: boolean
  className?: string
}

export function MathDisplay({ math, display = true, className = '' }: MathDisplayProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(math, ref.current, {
          displayMode: display,
          throwOnError: false,
          trust: true,
        })
      } catch {
        ref.current.textContent = math
      }
    }
  }, [math, display])

  return <span ref={ref} className={className} />
}
