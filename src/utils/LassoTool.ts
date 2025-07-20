import { SelectionMode } from './SelectionTypes';
import { SelectionManager } from './SelectionManager';

export class LassoTool {
  private canvas: HTMLCanvasElement;
  private path: [number, number][] = [];
  private isDrawing = false;
  private selectionManager: SelectionManager;

  constructor(canvas: HTMLCanvasElement, selectionManager: SelectionManager) {
    this.canvas = canvas;
    this.selectionManager = selectionManager;
  }

  startPath(x: number, y: number) {
    // 边界检查
    const clampedX = Math.max(0, Math.min(x, this.canvas.width - 1));
    const clampedY = Math.max(0, Math.min(y, this.canvas.height - 1));
    
    this.path = [[clampedX, clampedY]];
    this.isDrawing = true;
    this.drawPath();
  }

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
    
    this.path.push([clampedX, clampedY]);
    this.drawPath();
  }

  finishPath(mode: SelectionMode = SelectionMode.NEW): boolean {
    if (this.path.length < 3) {
      this.clearPath();
      return false;
    }

    this.isDrawing = false;
    const mask = this.createSelectionMask();
    this.selectionManager.applySelection(mask, mode);
    this.clearPath();
    return true;
  }

  private drawPath() {
    const ctx = this.canvas.getContext('2d');
    if (!ctx || this.path.length < 2) return;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(this.path[0][0], this.path[0][1]);
    
    for (let i = 1; i < this.path.length; i++) {
      ctx.lineTo(this.path[i][0], this.path[i][1]);
    }
    
    if (!this.isDrawing) {
      ctx.closePath();
    }
    
    ctx.stroke();
  }

  private createSelectionMask(): Uint8Array {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const mask = new Uint8Array(width * height);

    // 使用Canvas API进行高效的多边形填充
    // 创建临时canvas用于路径填充
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return mask;

    // 使用Canvas Path API填充多边形
    tempCtx.fillStyle = 'white';
    tempCtx.beginPath();
    tempCtx.moveTo(this.path[0][0], this.path[0][1]);
    
    for (let i = 1; i < this.path.length; i++) {
      tempCtx.lineTo(this.path[i][0], this.path[i][1]);
    }
    
    tempCtx.closePath();
    tempCtx.fill();

    // 从Canvas获取填充结果
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // 转换为选区遮罩（检查alpha通道）
    for (let i = 0; i < mask.length; i++) {
      const pixelIndex = i * 4;
      // 如果像素不是完全透明，则认为在选区内
      mask[i] = data[pixelIndex + 3] > 0 ? 1 : 0;
    }

    return mask;
  }

  private clearPath() {
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.path = [];
    this.isDrawing = false;
  }
}