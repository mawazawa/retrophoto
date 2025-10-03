import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import sharp from 'sharp';

export async function generateRevealGIF(
  originalUrl: string,
  restoredUrl: string
): Promise<Buffer> {
  // Download images
  const [originalBuffer, restoredBuffer] = await Promise.all([
    fetch(originalUrl).then((r) => r.arrayBuffer()),
    fetch(restoredUrl).then((r) => r.arrayBuffer()),
  ]);

  // Resize to max 800px width and convert to RGBA data
  const original = await sharp(Buffer.from(originalBuffer))
    .resize(800, null, { withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const restored = await sharp(Buffer.from(restoredBuffer))
    .resize(800, null, { withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Create GIF with wipe reveal animation (2-3 seconds, 10 frames)
  const { width, height } = original.info;
  const gif = GIFEncoder();

  // Generate palette from both images
  const sampleData = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height * 4; i++) {
    sampleData[i] = i % 2 === 0 ? original.data[i] : restored.data[i];
  }
  const palette = quantize(sampleData, 256);
  
  // Generate 11 frames (0-10) for smooth wipe animation
  for (let i = 0; i <= 10; i++) {
    const wipePosition = Math.floor((width * i) / 10);
    
    // Create frame buffer mixing original and restored based on wipe position
    const frameData = new Uint8ClampedArray(width * height * 4);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Use restored image on left side of wipe, original on right
        const sourceData = x < wipePosition ? restored.data : original.data;
        frameData[idx] = sourceData[idx];       // R
        frameData[idx + 1] = sourceData[idx + 1]; // G
        frameData[idx + 2] = sourceData[idx + 2]; // B
        frameData[idx + 3] = sourceData[idx + 3]; // A
      }
    }
    
    // Apply palette and add frame with 200ms delay
    const indexedFrame = applyPalette(frameData, palette);
    gif.writeFrame(indexedFrame, width, height, {
      palette,
      delay: 200, // 200ms delay
      first: i === 0
    });
  }

  // Finalize GIF
  gif.finish();
  return Buffer.from(gif.bytes());
}
