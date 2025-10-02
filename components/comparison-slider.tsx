"use client"

import { useState } from 'react'
import {
  ReactCompareSlider,
  ReactCompareSliderImage
} from 'react-compare-slider'
import { ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ComparisonSlider({
  originalUrl,
  restoredUrl,
  onZoom
}: {
  originalUrl: string
  restoredUrl: string
  onZoom?: () => void
}) {
  const [position, setPosition] = useState(50)

  // Keyboard navigation (T087)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setPosition(Math.max(0, position - 5))
    } else if (e.key === 'ArrowRight') {
      setPosition(Math.min(100, position + 5))
    } else if (e.key === ' ' || e.key === 'Enter') {
      setPosition(position === 50 ? 0 : 50)
    }
  }

  return (
    <div className="relative w-full h-full">
      <ReactCompareSlider
        itemOne={
          <ReactCompareSliderImage
            src={originalUrl}
            alt="Original photo"
            className="object-contain"
          />
        }
        itemTwo={
          <ReactCompareSliderImage
            src={restoredUrl}
            alt="Restored photo"
            className="object-contain"
          />
        }
        position={position}
        onPositionChange={setPosition}
        onKeyDown={handleKeyDown}
        className="h-full focus:outline-none focus:ring-2 focus:ring-primary"
        tabIndex={0}
        role="slider"
        aria-label="Before and after comparison slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={position}
      />

      {onZoom && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 right-4 min-touch-44"
          onClick={onZoom}
          aria-label="Zoom in"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
      )}
    </div>
  )
}
