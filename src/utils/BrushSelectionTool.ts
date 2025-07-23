import { SelectionMode } from './SelectionTypes';
import { SelectionManager } from './SelectionManager';

// 画笔预览回调类型
export type BrushPreviewCallback = (points: [number, number][], brushSize: number, isDrawing: boolean) => void;

export class BrushSelectionTool {
  private canvas: HTMLCanvasElement;
  private selectionManager: SelectionManager;
  private brushSize: number = 20; // 默认画笔大小
  private path: [number, number][] = [];
  private isDrawing = false;
  private previewCallback?: BrushPreviewCallback;

  constructor(canvas: HTMLCanvasElement, selectionManager: SelectionManager, previewCallback?: BrushPreviewCallback) {
    this.canvas = canvas;
    this.selectionManager = selectionManager;
    this.previewCallback = previewCallback;
  }

  // 设置画笔大小
  setBrushSize(size: number) {
    this.brushSize = Math.max(1, Math.min(100, size)); // 限制在1-100像素之间
  }

  getBrushSize(): number {
    return this.brushSize;
  }

  // 设置预览回调
  setPreviewCallback(callback: BrushPreviewCallback) {
    this.previewCallback = callback;
  }

  // 清除预览回调
  clearPreviewCallback() {
    this.previewCallback = undefined;
  }

  // 开始绘制
  startDrawing(x: number, y: number) {
    // 边界检查
    const clampedX = Math.max(0, Math.min(x, this.canvas.width - 1));
    const clampedY = Math.max(0, Math.min(y, this.canvas.height - 1));
    
    this.path = [[clampedX, clampedY]];
    this.isDrawing = true;
    this.updatePreview();
  }

  // 添加绘制点
  // 优化版本：减少重复点和不必要的预览更新
  addPoint(x: number, y: number) {
    if (!this.isDrawing) return;
    
    // 边界检查
    const clampedX = Math.max(0, Math.min(x, this.canvas.width - 1));
    const clampedY = Math.max(0, Math.min(y, this.canvas.height - 1));
    
    // 避免添加重复点
    const lastPoint = this.path[this.path.length - 1];
    if (lastPoint && lastPoint[0] === clampedX && lastPoint[1] === clampedY) {
      return;
    }
    
    // 距离阈值优化：只有移动足够距离才添加新点
    if (lastPoint) {
      const dx = clampedX - lastPoint[0];
      const dy = clampedY - lastPoint[1];
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 如果移动距离小于1像素，跳过此点
      if (distance < 1) {
        return;
      }
    }
    
    this.path.push([clampedX, clampedY]);
    
    // 节流预览更新：每5个点更新一次，或者是最后一个点
    if (this.path.length % 3 === 0) {
      this.updatePreview();
    }
  }

  // 完成绘制
  finishDrawing(mode: SelectionMode = SelectionMode.NEW): boolean {
    if (!this.isDrawing || this.path.length === 0) {
      this.clearPath();
      return false;
    }

    this.isDrawing = false;
    this.updatePreview(); // 更新预览状态为非绘制中
    
    // 创建选区遮罩
    const mask = this.createSelectionMask();
    
    // 应用选区
    this.selectionManager.applySelection(mask, mode);
    
    this.clearPath();
    return true;
  }

  // 创建选区遮罩
  private createSelectionMask(): Uint8Array {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const mask = new Uint8Array(width * height);

    if (this.path.length === 0) return mask;

    // 如果只有一个点，绘制圆形
    if (this.path.length === 1) {
      this.drawCircle(mask, this.path[0][0], this.path[0][1], this.brushSize / 2, width, height);
      return mask;
    }

    // 多个点时，绘制连接的圆形路径
    for (let i = 0; i < this.path.length; i++) {
      const [x, y] = this.path[i];
      this.drawCircle(mask, x, y, this.brushSize / 2, width, height);
      
      // 连接相邻点之间的区域
      if (i > 0) {
        const [prevX, prevY] = this.path[i - 1];
        this.drawLine(mask, prevX, prevY, x, y, this.brushSize / 2, width, height);
      }
    }

    return mask;
  }

  // 在遮罩中绘制圆形
  private drawCircle(mask: Uint8Array, centerX: number, centerY: number, radius: number, width: number, height: number) {
    const radiusSquared = radius * radius;
    const minX = Math.max(0, Math.floor(centerX - radius));
    const maxX = Math.min(width - 1, Math.ceil(centerX + radius));
    const minY = Math.max(0, Math.floor(centerY - radius));
    const maxY = Math.min(height - 1, Math.ceil(centerY + radius));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distanceSquared = dx * dx + dy * dy;
        
        if (distanceSquared <= radiusSquared) {
          const index = y * width + x;
          mask[index] = 1;
        }
      }
    }
  }

  // 在遮罩中绘制连接线（带宽度）
  private drawLine(mask: Uint8Array, x1: number, y1: number, x2: number, y2: number, radius: number, width: number, height: number) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return;

    // 沿线段绘制圆形
    const steps = Math.ceil(distance);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + dx * t;
      const y = y1 + dy * t;
      this.drawCircle(mask, x, y, radius, width, height);
    }
  }

  // 更新预览回调
  // 优化版本：避免频繁的数组复制，使用节流
  private updatePreview() {
    if (this.previewCallback) {
      // 只传递路径的浅拷贝引用，减少内存分配
      this.previewCallback(this.path.slice(), this.brushSize, this.isDrawing);
    }
  }

  // 清除路径
  private clearPath() {
    this.path = [];
    this.isDrawing = false;
    this.updatePreview(); // 清除预览
  }

  // 获取当前绘制状态
  isCurrentlyDrawing(): boolean {
    return this.isDrawing;
  }

  // 获取当前路径
  getCurrentPath(): [number, number][] {
    return [...this.path];
  }
}
