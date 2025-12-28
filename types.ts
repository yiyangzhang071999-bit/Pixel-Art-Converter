export interface RetroSettings {
  pixelSize: number; // 1 to 20
  threshold: number; // 0 to 255
  ditherAmount: number; // 0 to 1 (mix between solid threshold and dither)
  contrast: number; // 0.5 to 2.0
  colorDark: string; // Hex
  colorLight: string; // Hex
  invert: boolean;
  gridLine: boolean;
}

export type FileType = 'image' | 'video' | null;

export interface UploadedFile {
  url: string;
  type: FileType;
  name: string;
}

// Add EyeDropper API type support
declare global {
  interface Window {
    EyeDropper?: {
      new (): {
        open(options?: { signal?: AbortSignal }): Promise<{ sRGBHex: string }>;
      };
    };
  }
}
