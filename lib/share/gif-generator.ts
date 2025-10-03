import { GifWriter } from 'gifenc';
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

  // Resize to max 800px width and convert to raw RGB data
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
  const { width, height, channels } = original.info;
  const buffer = new Uint8Array(width * height * 256);
  const gif = new GifWriter(buffer, width, height);

  // Generate 11 frames (0-10) for smooth wipe animation
  for (let i = 0; i <= 10; i++) {
    const wipePosition = Math.floor((width * i) / 10);

    // Create frame data with indexed colors (RGBA -> palette index)
    const frameData = new Uint8Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels;
        const pixelIdx = y * width + x;

        // Use restored image on left side of wipe, original on right
        let r, g, b;
        if (x < wipePosition) {
          r = restored.data[idx];
          g = restored.data[idx + 1];
          b = restored.data[idx + 2];
        } else {
          r = original.data[idx];
          g = original.data[idx + 1];
          b = original.data[idx + 2];
        }

        // Simple color quantization to palette index (reduce to 256 colors)
        const paletteIndex = Math.floor((r / 32) * 36 + (g / 32) * 6 + b / 32);
        frameData[pixelIdx] = paletteIndex;
      }
    }

    // Add frame with 200ms delay
    gif.addFrame(0, 0, width, height, frameData, { delay: 20 }); // 20 = 200ms in centiseconds
  }

  // Finalize GIF
  gif.end();
  return Buffer.from(buffer.slice(0, gif.bytesView));
}
