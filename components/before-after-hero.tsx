"use client"

import {
  ReactCompareSlider,
  ReactCompareSliderImage
} from 'react-compare-slider'

export function BeforeAfterHero() {
  return (
    <div className="relative">
      {/* Slider container */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-background/50 backdrop-blur-sm">
        <ReactCompareSlider
          itemOne={
            <ReactCompareSliderImage
              src="/examples/before.jpg"
              alt="Damaged, faded old photo before restoration"
              className="object-cover w-full h-full"
            />
          }
          itemTwo={
            <ReactCompareSliderImage
              src="/examples/after.jpg"
              alt="Beautifully restored photo in HD quality"
              className="object-cover w-full h-full"
            />
          }
          position={50}
          style={{
            width: '100%',
            height: 'auto',
            aspectRatio: '4/5',
          }}
        />
      </div>

      {/* Labels */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center p-3 rounded-xl bg-muted/50 backdrop-blur-sm border border-border/50">
          <p className="text-sm font-semibold text-muted-foreground mb-1">Before</p>
          <p className="text-xs text-muted-foreground/70">Damaged & Faded</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-primary/10 backdrop-blur-sm border border-primary/20">
          <p className="text-sm font-semibold text-primary mb-1">After</p>
          <p className="text-xs text-muted-foreground/70">Restored in HD</p>
        </div>
      </div>

      {/* Drag indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="bg-background/90 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-border/50 animate-bounce">
          <p className="text-xs font-medium text-foreground whitespace-nowrap">← Drag to Compare →</p>
        </div>
      </div>
    </div>
  )
}
