import { SelectionMode } from './SelectionTypes';
import { SelectionManager } from './SelectionManager';

// 预览回调类型
export type EllipsePreviewCallback = (centerX: number, centerY: number, radiusX: number, radiusY: number, isDrawing: boolean) => void;

export class EllipseSelectionTool {
  private canvas: HTMLCanvasElement;
  private selectionManager: SelectionManager;
  private previewCallback?: EllipsePreviewCallback;
  private startPoint: { x: number; y: number } | null = null;
  private isDrawing = false;

  constructor(canvas: HTMLCanvasElement, selectionManager: SelectionManager, previewCallback?: EllipsePreviewCallback) {
    this.canvas = canvas;
    this.selectionManager = selectionManager;
    this.previewCallback = previewCallback;
  }

  // 设置预览回调
  setPreviewCallback(callback: EllipsePreviewCallback) {
    this.previewCallback = callback;
  }

  // 清除预览回调
  clearPreviewCallback() {
    this.previewCallback = undefined;
  }

  // 开始椭圆选择
  startSelection(x: number, y: number) {
    // 边界检查
    const clampedX = Math.max(0, Math.min(x, this.canvas.width - 1));
    const clampedY = Math.max(0, Math.min(y, this.canvas.height - 1));
    
    this.startPoint = { x: clampedX, y: clampedY };
    this.isDrawing = true;
    this.updatePreview(clampedX, clampedY);
  }

  // 更新椭圆选择
  // 优化版本：减少不必要的预览更新
  updateSelection(x: number, y: number) {
    if (!this.isDrawing || !this.startPoint) return;
    
    // 边界检查
    const clampedX = Math.max(0, Math.min(x, this.canvas.width - 1));
    const clampedY = Math.max(0, Math.min(y, this.canvas.height - 1));
    
    // 检查是否有实际变化，避免无意义的预览更新
    const deltaX = Math.abs(clampedX - this.startPoint.x);
    const deltaY = Math.abs(clampedY - this.startPoint.y);
    
    // 只有移动距离超过阈值才更新预览
    if (deltaX >= 2 || deltaY >= 2) {
      this.updatePreview(clampedX, clampedY);
    }
  }

  // 完成椭圆选择
  finishSelection(x: number, y: number, mode: SelectionMode = SelectionMode.NEW): boolean {
    if (!this.isDrawing || !this.startPoint) {
      this.clearSelection();
      return false;
    }

    // 边界检查
    const clampedX = Math.max(0, Math.min(x, this.canvas.width - 1));
    const clampedY = Math.max(0, Math.min(y, this.canvas.height - 1));

    // 计算椭圆参数
    const centerX = (this.startPoint.x + clampedX) / 2;
    const centerY = (this.startPoint.y + clampedY) / 2;
    const radiusX = Math.abs(clampedX - this.startPoint.x) / 2;
    const radiusY = Math.abs(clampedY - this.startPoint.y) / 2;

    // 检查是否是有效的椭圆（最小半径2像素）
    if (radiusX < 2 || radiusY < 2) {
      this.clearSelection();
      return false;
    }

    this.isDrawing = false;
    this.updatePreview(clampedX, clampedY, false); // 更新预览状态为非绘制中

    // 创建选区遮罩
    const mask = this.createSelectionMask(centerX, centerY, radiusX, radiusY);
    this.selectionManager.applySelection(mask, mode);
    
    this.clearSelection();
    return true;
  }

  // 取消选择
  clearSelection() {
    this.startPoint = null;
    this.isDrawing = false;
    this.clearPreview();
  }

  // 更新预览回调
  private updatePreview(endX: number, endY: number, isDrawing: boolean = true) {
    if (this.previewCallback && this.startPoint) {
      const centerX = (this.startPoint.x + endX) / 2;
      const centerY = (this.startPoint.y + endY) / 2;
      const radiusX = Math.abs(endX - this.startPoint.x) / 2;
      const radiusY = Math.abs(endY - this.startPoint.y) / 2;
      
      this.previewCallback(centerX, centerY, radiusX, radiusY, isDrawing);
    }
  }

  // 清除预览
  private clearPreview() {
    if (this.previewCallback) {
      this.previewCallback(0, 0, 0, 0, false);
    }
  }

  // 创建椭圆选区遮罩
  private createSelectionMask(centerX: number, centerY: number, radiusX: number, radiusY: number): Uint8Array {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const mask = new Uint8Array(width * height);

    // 使用Canvas API进行高效的椭圆填充
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    
    if (!tempCtx) return mask;

    // 绘制填充的椭圆
    tempCtx.fillStyle = 'white';
    tempCtx.beginPath();
    tempCtx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
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

  // 获取当前绘制状态
  isCurrentlyDrawing(): boolean {
    return this.isDrawing;
  }

  // 获取当前起始点
  getStartPoint(): { x: number; y: number } | null {
    return this.startPoint ? { ...this.startPoint } : null;
  }
}
