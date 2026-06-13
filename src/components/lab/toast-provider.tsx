'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'info'
  exiting?: boolean
}

interface ToastContextValue {
  toast: (message: string, type?: 'success' | 'info') => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: number) => {
    // Mark as exiting first for animation
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    // Remove after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 300)
  }, [])

  const toast = useCallback((message: string, type: 'success' | 'info' = 'info') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    // Auto-dismiss after 2.5 seconds
    setTimeout(() => {
      removeToast(id)
    }, 2500)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container - bottom right */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              pointer-events-auto
              flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg backdrop-blur-md border
              transition-all duration-300 ease-out
              ${t.exiting
                ? 'opacity-0 translate-y-2 scale-95'
                : 'opacity-100 translate-y-0 scale-100 animate-[toast-in_0.3s_ease-out]'
              }
              ${t.type === 'success'
                ? 'bg-emerald-50/90 dark:bg-emerald-900/80 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                : 'bg-sky-50/90 dark:bg-sky-900/80 border-sky-200 dark:border-sky-700 text-sky-800 dark:text-sky-200'
              }
            `}
          >
            {t.type === 'success' ? (
              <svg className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
              </svg>
            )}
            <span className="text-sm font-medium">{t.message}</span>
          </div>
        ))}
      </div>
      {/* Keyframes injected via style tag */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes fade-in {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes shimmer-progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Return a no-op toast if used outside provider
    return { toast: (_message: string, _type?: 'success' | 'info') => {} }
  }
  return ctx
}
