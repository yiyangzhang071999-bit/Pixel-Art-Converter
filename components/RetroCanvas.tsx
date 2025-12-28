import React, { useRef, useEffect, useCallback, useState } from 'react';
import { RetroSettings, UploadedFile } from '../types';
import { getBayerValue, hexToRgb } from '../utils/dither';

interface RetroCanvasProps {
  file: UploadedFile | null;
  settings: RetroSettings;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
}

export const RetroCanvas: React.FC<RetroCanvasProps> = ({
  file,
  settings,
  onCanvasReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const requestRef = useRef<number>();
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

  // Initialize refs based on file type
  useEffect(() => {
    if (!file) return;

    if (file.type === 'video') {
      if (videoRef.current) {
        videoRef.current.src = file.url;
        videoRef.current.load();
        videoRef.current.play().catch((e) => console.log('Autoplay prevented', e));
        videoRef.current.loop = true;
        videoRef.current.muted = true;
      }
    } else if (file.type === 'image') {
      if (imageRef.current) {
        imageRef.current.src = file.url;
      }
    }
  }, [file]);

  // The core processing function
  const processFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let source: HTMLVideoElement | HTMLImageElement | null = null;
    let sourceW = 0;
    let sourceH = 0;

    if (file?.type === 'video' && videoRef.current) {
      const video = videoRef.current;
      source = video;
      // Wait for video to have dimensions
      if (video.videoWidth === 0) {
        requestRef.current = requestAnimationFrame(processFrame);
        return;
      }
      sourceW = video.videoWidth;
      sourceH = video.videoHeight;
    } else if (file?.type === 'image' && imageRef.current) {
      const image = imageRef.current;
      source = image;
      if (image.naturalWidth === 0) return; // Wait for load
      sourceW = image.naturalWidth;
      sourceH = image.naturalHeight;
    }

    if (!source || sourceW === 0 || sourceH === 0) return;

    // Calculate aspect ratio aware dimensions for display
    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;
    
    const scale = Math.min(containerW / sourceW, containerH / sourceH);
    const displayW = Math.floor(sourceW * scale);
    const displayH = Math.floor(sourceH * scale);

    // Update canvas size if changed
    if (canvas.width !== displayW || canvas.height !== displayH) {
      canvas.width = displayW;
      canvas.height = displayH;
      setDimensions({ w: displayW, h: displayH });
    }

    // --- PROCESSING PIPELINE ---

    // 1. Calculate processing resolution (downscaled)
    // The higher the pixelSize setting, the smaller the processing canvas
    // We want a minimum width of roughly 64px for very blocky, up to full res for 1
    const factor = Math.max(1, settings.pixelSize);
    const procW = Math.max(1, Math.floor(displayW / factor));
    const procH = Math.max(1, Math.floor(displayH / factor));

    // Create a temporary offscreen canvas for processing
    const offCanvas = document.createElement('canvas');
    offCanvas.width = procW;
    offCanvas.height = procH;
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    if (!offCtx) return;

    // Draw source to small canvas (this handles the pixelation downscaling)
    offCtx.drawImage(source, 0, 0, procW, procH);

    // Get raw pixel data
    const imgData = offCtx.getImageData(0, 0, procW, procH);
    const data = imgData.data;

    // Parse Colors
    const rgbDark = hexToRgb(settings.colorDark);
    const rgbLight = hexToRgb(settings.colorLight);
    
    // Swap if inverted
    const dark = settings.invert ? rgbLight : rgbDark;
    const light = settings.invert ? rgbDark : rgbLight;

    // Iterate pixels
    for (let y = 0; y < procH; y++) {
      for (let x = 0; x < procW; x++) {
        const i = (y * procW + x) * 4;
        
        // Extract RGB
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // 1. Grayscale (Luminance)
        let luma = 0.299 * r + 0.587 * g + 0.114 * b;

        // 2. Apply Contrast
        // (val - 128) * contrast + 128
        luma = (luma - 128) * settings.contrast + 128;

        // 3. Dithering calculation
        // Get Bayer matrix threshold offset (-128 to 128 approx range effectively)
        // We map the 0-255 bayer value to a range centered on 0 based on dither amount
        const ditherVal = getBayerValue(x, y);
        // Map 0..255 to -127..128
        const ditherOffset = (ditherVal - 128) * settings.ditherAmount;

        // 4. Thresholding
        // If luma + dither > threshold, it's white, else black
        const isLight = (luma + ditherOffset) > settings.threshold;

        // 5. Map to Palette
        const finalColor = isLight ? light : dark;

        data[i] = finalColor.r;
        data[i + 1] = finalColor.g;
        data[i + 2] = finalColor.b;
        // Alpha stays 255 (or original if we wanted transparency, but retro usually solid)
        data[i + 3] = 255;
      }
    }

    // Put processed pixels back to small canvas
    offCtx.putImageData(imgData, 0, 0);

    // Scale back up to display canvas with nearest-neighbor
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offCanvas, 0, 0, displayW, displayH);

    // Optional Scanlines
    if (settings.gridLine) {
       ctx.globalCompositeOperation = 'overlay';
       ctx.fillStyle = 'rgba(0,0,0,0.3)';
       for(let y=0; y<displayH; y+=2) {
           ctx.fillRect(0, y, displayW, 1);
       }
       ctx.globalCompositeOperation = 'source-over';
    }

    if (file.type === 'video') {
      requestRef.current = requestAnimationFrame(processFrame);
    }
  }, [file, settings]);

  // Handle Video Frame Loop
  useEffect(() => {
    if (file?.type === 'video') {
      requestRef.current = requestAnimationFrame(processFrame);
    } else {
      // For images, run once when dependencies change
      processFrame();
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [file, settings, processFrame]);

  // Expose canvas for screenshot
  useEffect(() => {
    if (canvasRef.current) {
        onCanvasReady(canvasRef.current);
    }
  }, [onCanvasReady]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-black overflow-hidden relative">
      {/* Hidden Source Elements */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
        loop
        crossOrigin="anonymous"
      />
      <img ref={imageRef} className="hidden" crossOrigin="anonymous" alt="source" />

      {/* The Display Canvas */}
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full object-contain shadow-2xl"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {!file && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <p className="font-mono text-[#e6e0d4]">NO SIGNAL</p>
        </div>
      )}
    </div>
  );
};