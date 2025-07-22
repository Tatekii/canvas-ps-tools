import { SelectionMode } from './SelectionTypes';
import { SelectionManager } from './SelectionManager';

// 预览回调类型
export type RectanglePreviewCallback = (startX: number, startY: number, endX: number, endY: number, isDrawing: boolean) => void;

export class RectangleSelectionTool {
  private canvas: HTMLCanvasElement;
  private selectionManager: SelectionManager;
  private previewCallback?: RectanglePreviewCallback;
  private startPoint: { x: number; y: number } | null = null;
  private isDrawing = false;

  constructor(canvas: HTMLCanvasElement, selectionManager: SelectionManager, previewCallback?: RectanglePreviewCallback) {
    this.canvas = canvas;
    this.selectionManager = selectionManager;
    this.previewCallback = previewCallback;
  }

  // 设置预览回调
  setPreviewCallback(callback: RectanglePreviewCallback) {
    this.previewCallback = callback;
  }

  // 清除预览回调
  clearPreviewCallback() {
    this.previewCallback = undefined;
  }

  // 开始矩形选择
  startSelection(x: number, y: number) {
    // 边界检查
    const clampedX = Math.max(0, Math.min(x, this.canvas.width - 1));
    const clampedY = Math.max(0, Math.min(y, this.canvas.height - 1));
    
    this.startPoint = { x: clampedX, y: clampedY };
    this.isDrawing = true;
    this.updatePreview(clampedX, clampedY);
  }

  // 更新矩形选择
  updateSelection(x: number, y: number) {
    if (!this.isDrawing || !this.startPoint) return;
    
    // 边界检查
    const clampedX = Math.max(0, Math.min(x, this.canvas.width - 1));
    const clampedY = Math.max(0, Math.min(y, this.canvas.height - 1));
    
    this.updatePreview(clampedX, clampedY);
  }

  // 完成矩形选择
  finishSelection(x: number, y: number, mode: SelectionMode = SelectionMode.NEW): boolean {
    if (!this.isDrawing || !this.startPoint) {
      this.clearSelection();
      return false;
    }

    // 边界检查
    const clampedX = Math.max(0, Math.min(x, this.canvas.width - 1));
    const clampedY = Math.max(0, Math.min(y, this.canvas.height - 1));

    // 计算矩形区域
    const left = Math.min(this.startPoint.x, clampedX);
    const top = Math.min(this.startPoint.y, clampedY);
    const right = Math.max(this.startPoint.x, clampedX);
    const bottom = Math.max(this.startPoint.y, clampedY);

    // 检查是否是有效的矩形（最小2x2像素）
    if (right - left < 2 || bottom - top < 2) {
      this.clearSelection();
      return false;
    }

    this.isDrawing = false;
    this.updatePreview(clampedX, clampedY, false); // 更新预览状态为非绘制中

    // 创建选区遮罩
    const mask = this.createSelectionMask(left, top, right, bottom);
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
      this.previewCallback(
        this.startPoint.x,
        this.startPoint.y,
        endX,
        endY,
        isDrawing
      );
    }
  }

  // 清除预览
  private clearPreview() {
    if (this.previewCallback) {
      this.previewCallback(0, 0, 0, 0, false);
    }
  }

  // 创建矩形选区遮罩
  private createSelectionMask(left: number, top: number, right: number, bottom: number): Uint8Array {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const mask = new Uint8Array(width * height);

    // 填充矩形区域
    for (let y = top; y < bottom; y++) {
      for (let x = left; x < right; x++) {
        const index = y * width + x;
        if (index >= 0 && index < mask.length) {
          mask[index] = 1;
        }
      }
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
