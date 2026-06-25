'use client'

import { useLabStore } from '@/store/lab-store'

/**
 * Simple HTML sanitizer to prevent XSS attacks.
 * Removes dangerous tags and attributes while preserving safe HTML.
 */
function sanitizeHTML(html: string): string {
  if (typeof window === 'undefined') return html
  
  // Create a temporary DOM element to parse the HTML
  const temp = document.createElement('div')
  temp.innerHTML = html
  
  // List of allowed tags (lowercase)
  const allowedTags = new Set([
    'b', 'i', 'em', 'strong', 'u', 's', 'strike', 'del', 'ins',
    'p', 'br', 'span', 'div', 'ul', 'ol', 'li', 'blockquote',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'img', 'code', 'pre'
  ])
  
  // List of allowed attributes (lowercase)
  const allowedAttrs = new Set(['href', 'src', 'alt', 'title', 'class'])
  
  // List of dangerous protocols for href/src
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:']
  
  function sanitizeNode(node: Node): void {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      const tagName = el.tagName.toLowerCase()
      
      // Remove disallowed tags
      if (!allowedTags.has(tagName)) {
        // Replace with text content
        const text = document.createTextNode(el.textContent || '')
        el.parentNode?.replaceChild(text, el)
        return
      }
      
      // Remove disallowed attributes
      const attrs = Array.from(el.attributes)
      for (const attr of attrs) {
        const attrName = attr.name.toLowerCase()
        if (!allowedAttrs.has(attrName)) {
          el.removeAttribute(attr.name)
          continue
        }
        
        // Check for dangerous protocols in href/src
        if (attrName === 'href' || attrName === 'src') {
          const value = attr.value.toLowerCase().trim()
          if (dangerousProtocols.some(proto => value.startsWith(proto))) {
            el.removeAttribute(attr.name)
          }
        }
      }
      
      // Recursively sanitize children
      const children = Array.from(el.childNodes)
      for (const child of children) {
        sanitizeNode(child)
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      // Text nodes are safe
    } else {
      // Remove other node types (comments, etc.)
      node.parentNode?.removeChild(node)
    }
  }
  
  // Sanitize all child nodes
  const children = Array.from(temp.childNodes)
  for (const child of children) {
    sanitizeNode(child)
  }
  
  return temp.innerHTML
}

/**
 * SceneTooltip - An HTML overlay that appears when hovering over 3D objects.
 * Positioned absolutely over the canvas using screen coordinates from the Zustand store.
 * Uses pointer-events: none so it doesn't interfere with 3D interactions.
 * Smooth fade-in/fade-out transitions via CSS only (no state-in-effect).
 */
export function SceneTooltip() {
  const { tooltip } = useLabStore()
  
  if (!tooltip) return null
  
  // Offset the tooltip slightly from cursor so it doesn't flicker
  const offsetX = 16
  const offsetY = 16
  
  // Clamp position so tooltip stays within viewport
  // Use a large fallback to avoid hydration mismatch (tooltip will reposition on client)
  const maxX = typeof window !== 'undefined' ? window.innerWidth - 220 : 9999
  const maxY = typeof window !== 'undefined' ? window.innerHeight - 120 : 9999
  const x = Math.min(tooltip.x + offsetX, maxX)
  const y = Math.min(tooltip.y + offsetY, maxY)
  
  // Sanitize HTML content to prevent XSS attacks
  const sanitizedContent = sanitizeHTML(tooltip.content)
  
  return (
    <div
      className="fixed z-[9999] pointer-events-none animate-[fade-in_0.2s_ease-out_forwards]"
      style={{ left: x, top: y }}
    >
      <div className="bg-background/95 dark:bg-slate-900/95 backdrop-blur-md border border-emerald-500/30 rounded-lg shadow-xl shadow-emerald-500/10 overflow-hidden min-w-[140px] max-w-[220px]">
        {/* Emerald accent border on left */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-l-lg" />
        <div
          className="px-3 py-2 text-[11px] leading-relaxed whitespace-pre-line pl-4"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      </div>
    </div>
  )
}
