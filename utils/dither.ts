// Standard Bayer 4x4 matrix
export const bayerMatrix4x4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export const getBayerValue = (x: number, y: number): number => {
  const matrixSize = 4;
  // Normalize matrix value (0-15) to 0-255 range effectively
  // (value / 16) * 255 roughly, but used as an offset
  const value = bayerMatrix4x4[y % matrixSize][x % matrixSize];
  return (value / 16) * 255;
};

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};
