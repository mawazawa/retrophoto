"use client"

import {
  ReactCompareSlider,
  ReactCompareSliderImage
} from 'react-compare-slider'

export function BeforeAfterHero() {
  return (
    <section className="py-12 md:py-20 px-4 bg-gradient-to-b from-muted/30 to-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-block px-4 py-2 bg-primary/10 rounded-full text-sm text-primary font-medium">
            ✨ AI-Powered Restoration
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            See the Magic in Action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Drag the slider to see how RetroPhoto transforms damaged, faded photos into stunning HD quality
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-background">
            <ReactCompareSlider
              itemOne={
                <ReactCompareSliderImage
                  src="/examples/before.svg"
                  srcSet="/examples/before.jpg 1920w, /examples/before.svg 1920w"
                  alt="Damaged, faded old photo before restoration"
                  className="object-cover w-full h-full"
                />
              }
              itemTwo={
                <ReactCompareSliderImage
                  src="/examples/after.svg"
                  srcSet="/examples/after.jpg 1920w, /examples/after.svg 1920w"
                  alt="Beautifully restored photo in HD quality"
                  className="object-cover w-full h-full"
                />
              }
              position={50}
              style={{
                width: '100%',
                height: 'auto',
                aspectRatio: '16/9',
              }}
            />
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 text-center">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground mb-1">Before</p>
              <p className="text-xs text-muted-foreground">Damaged, faded, low resolution</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10">
              <p className="text-sm font-medium text-primary mb-1">After</p>
              <p className="text-xs text-muted-foreground">Restored, vibrant, HD quality</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
