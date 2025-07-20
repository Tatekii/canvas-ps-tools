import { SelectionMode } from './SelectionTypes';
import { SelectionManager } from './SelectionManager';

export class MagicWandTool {
  private canvas: HTMLCanvasElement;
  private tolerance: number;
  private imageData: ImageData | null = null;
  private selectionManager: SelectionManager;

  constructor(canvas: HTMLCanvasElement, selectionManager: SelectionManager, tolerance: number = 32) {
    this.canvas = canvas;
    this.tolerance = tolerance;
    this.selectionManager = selectionManager;
  }

  setTolerance(tolerance: number) {
    this.tolerance = tolerance;
  }

  select(x: number, y: number, mode: SelectionMode = SelectionMode.NEW): boolean {
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;

    // 边界检查
    if (x < 0 || y < 0 || x >= this.canvas.width || y >= this.canvas.height) {
      return false;
    }

    try {
      this.imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    } catch (error) {
      console.error('Failed to get image data:', error);
      return false;
    }

    const width = this.imageData.width;
    const height = this.imageData.height;
    
    // 创建新选区遮罩
    const newMask = new Uint8Array(width * height);
    const targetColor = this.getPixelColor(Math.floor(x), Math.floor(y));
    
    if (!targetColor) return false;

    // 使用泛洪填充算法创建新选区
    this.floodFill(Math.floor(x), Math.floor(y), targetColor, newMask, width, height);

    // 通过SelectionManager应用新选区
    this.selectionManager.applySelection(newMask, mode);

    return true;
  }

  private getPixelColor(x: number, y: number): [number, number, number, number] | null {
    if (!this.imageData) return null;
    
    // 确保坐标在有效范围内
    if (x < 0 || x >= this.imageData.width || y < 0 || y >= this.imageData.height) {
      return null;
    }
    
    const index = (y * this.imageData.width + x) * 4;
    const data = this.imageData.data;
    
    return [
      data[index],     // R
      data[index + 1], // G
      data[index + 2], // B
      data[index + 3]  // A
    ];
  }

  private colorDistance(color1: [number, number, number, number], color2: [number, number, number, number]): number {
    const deltaR = color1[0] - color2[0];
    const deltaG = color1[1] - color2[1];
    const deltaB = color1[2] - color2[2];
    const deltaA = color1[3] - color2[3];
    
    return Math.sqrt(deltaR * deltaR + deltaG * deltaG + deltaB * deltaB + deltaA * deltaA);
  }

  private floodFill(
    startX: number, 
    startY: number, 
    targetColor: [number, number, number, number], 
    mask: Uint8Array, 
    width: number, 
    height: number
  ) {
    const stack: [number, number][] = [[startX, startY]];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const currentColor = this.getPixelColor(x, y);
      if (!currentColor) continue;

      const distance = this.colorDistance(currentColor, targetColor);
      if (distance > this.tolerance) continue;

      const index = y * width + x;
      mask[index] = 1;

      // 添加相邻像素到堆栈
      stack.push([x + 1, y]);
      stack.push([x - 1, y]);
      stack.push([x, y + 1]);
      stack.push([x, y - 1]);
    }
  }
}
