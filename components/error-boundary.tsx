'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

/**
 * React Error Boundary for catching client-side errors
 *
 * Wraps components to catch and display errors gracefully.
 * Integrates with Sentry for error reporting when configured.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Report to Sentry if configured
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      ;(window as any).Sentry.captureException(error, {
        extra: {
          componentStack: errorInfo.componentStack,
        },
      })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-6 text-6xl">😓</div>
          <h2 className="mb-2 text-2xl font-bold">Something went wrong</h2>
          <p className="mb-6 max-w-md text-muted-foreground">
            We encountered an unexpected error. Please try again or refresh the page.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={this.handleRetry}>
              Try Again
            </Button>
            <Button onClick={this.handleReload}>
              Refresh Page
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-6 max-w-lg overflow-auto rounded bg-muted p-4 text-left text-sm">
              {this.state.error.message}
            </pre>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
