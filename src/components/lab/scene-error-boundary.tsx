'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLabStore, type LabMode } from '@/store/lab-store'

interface Props {
  children: ReactNode
  onRetry?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

// All mode keys for "switch to next" navigation
const allModes: LabMode[] = [
  'step1', 'step2', 'step3', 'step4',
  'prop1', 'prop2', 'prop3', 'prop4', 'prop5', 'prop6', 'prop7',
  'parity1', 'parity2',
  'cartesian1', 'cartesian2',
  'rect_approx',
  'sphere_cyl1', 'sphere_cyl2',
  'polar1', 'polar2',
  'convergence1', 'convergence2',
  'triple1',
  'jacobian1',
  'green1',
  'surface_area1', 'fubini1',
  'stokes1', 'divergence1',
  'arc_length1', 'mass_center1',
  'moment_of_inertia1', 'cylindrical1',
]

export class SceneErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SceneErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    this.props.onRetry?.()
  }

  handleSwitchToNext = () => {
    const currentMode = useLabStore.getState().mode
    const currentIdx = allModes.indexOf(currentMode)
    const nextIdx = (currentIdx + 1) % allModes.length
    useLabStore.getState().setMode(allModes[nextIdx])
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 p-6 max-w-xs text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">渲染出错</h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {this.state.error?.message || '未知错误'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] gap-1.5 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                onClick={this.handleRetry}
              >
                <RefreshCw className="h-3 w-3" />
                重新加载
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] gap-1.5"
                onClick={this.handleSwitchToNext}
              >
                <SkipForward className="h-3 w-3" />
                切换到下一个
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
