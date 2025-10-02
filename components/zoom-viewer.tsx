"use client"

import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
                alt="Restored photo (zoomed)"
                className="max-w-full max-h-full object-contain"
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  )
}
