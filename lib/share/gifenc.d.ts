declare module 'gifenc' {
  export class GifWriter {
    constructor(
      buffer: Uint8Array,
      width: number,
      height: number,
      options?: { loop?: number }
    );
    addFrame(
      x: number,
      y: number,
      width: number,
      height: number,
      data: Uint8Array,
      options?: { delay?: number; transparent?: boolean; disposal?: number }
    ): void;
    end(): void;
    bytesView: number;
    bytes(): Uint8Array;
  }
}
