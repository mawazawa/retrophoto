"use client"

import { lazy, Suspense } from 'react'
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Lazy load zoom library for performance (T083)
const TransformWrapper = lazy(() =>
  import('react-zoom-pan-pinch').then(mod => ({ default: mod.TransformWrapper }))
)
const TransformComponent = lazy(() =>
  import('react-zoom-pan-pinch').then(mod => ({ default: mod.TransformComponent }))
)

export function ZoomViewer({
  imageUrl,
  onClose
}: {
  imageUrl: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={onClose}
          className="min-touch-44"
          aria-label="Close zoom view"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading zoom...</div>
        </div>
      }>
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={5}
          centerOnInit
          doubleClick={{ mode: 'zoomIn' }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => zoomIn()}
                  className="min-touch-44"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => zoomOut()}
                  className="min-touch-44"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => resetTransform()}
                  className="min-touch-44"
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </div>

              <TransformComponent
                wrapperClass="!w-full !h-full"
                contentClass="!w-full !h-full flex items-center justify-center"
              >
                <img
                  src={imageUrl}
                  alt="Restored content zoomed in"
                  className="max-w-full max-h-full object-contain"
                />
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </Suspense>
    </div>
  )
}
