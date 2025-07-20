import { SelectionMode } from './SelectionTypes';

/**
 * 通用选区管理器
 * 负责处理所有选区的合并、交集、差集等操作
 * 与具体的选择工具解耦
 */
export class SelectionManager {
  private width: number;
  private height: number;
  private currentSelection: Uint8Array | null = null;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /**
   * 更新画布尺寸
   */
  updateDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.currentSelection = null; // 清空选区
  }

  /**
   * 获取当前选区
   */
  getCurrentSelection(): Uint8Array | null {
    return this.currentSelection;
  }

  /**
   * 获取当前选区的ImageData格式
   */
  getCurrentSelectionAsImageData(): ImageData | null {
    if (!this.currentSelection) return null;

    const imageData = new ImageData(this.width, this.height);
    for (let i = 0; i < this.currentSelection.length; i++) {
      const dataIndex = i * 4;
      if (this.currentSelection[i]) {
        imageData.data[dataIndex] = 255;     // R
        imageData.data[dataIndex + 1] = 255; // G
        imageData.data[dataIndex + 2] = 255; // B
        imageData.data[dataIndex + 3] = 255; // A
      }
    }

    return imageData;
  }

  /**
   * 应用新的选区，根据模式与现有选区合并
   */
  applySelection(newSelection: Uint8Array, mode: SelectionMode): void {
    if (!this.currentSelection || mode === SelectionMode.NEW) {
      // 新建选区或没有现有选区
      this.currentSelection = new Uint8Array(newSelection);
      return;
    }

    // 使用Canvas API进行高效的选区合并
    this.currentSelection = this.mergeSelectionsWithCanvas(this.currentSelection, newSelection, mode);
  }

  /**
   * 使用Canvas API高效合并选区
   */
  private mergeSelectionsWithCanvas(existing: Uint8Array, newSelection: Uint8Array, mode: SelectionMode): Uint8Array {
    // 创建临时canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.width;
    tempCanvas.height = this.height;
    const ctx = tempCanvas.getContext('2d');
    
    if (!ctx) {
      // 降级到手动合并
      return this.mergeSelectionsManually(existing, newSelection, mode);
    }

    // 清除画布
    ctx.clearRect(0, 0, this.width, this.height);

    // 将现有选区转换为ImageData并绘制
    const existingImageData = this.createImageDataFromMask(existing);
    
    // 创建临时画布来正确处理合成操作
    const tempCanvas2 = document.createElement('canvas');
    tempCanvas2.width = this.width;
    tempCanvas2.height = this.height;
    const ctx2 = tempCanvas2.getContext('2d');
    
    if (!ctx2) {
      return this.mergeSelectionsManually(existing, newSelection, mode);
    }

    // 在第一个画布上绘制现有选区
    ctx.putImageData(existingImageData, 0, 0);

    // 在第二个画布上绘制新选区
    const newImageData = this.createImageDataFromMask(newSelection);
    ctx2.putImageData(newImageData, 0, 0);

    // 根据模式进行合成
    switch (mode) {
      case SelectionMode.ADD:
        // 并集：使用 lighter 混合模式实现真正的并集
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(tempCanvas2, 0, 0);
        break;
      case SelectionMode.SUBTRACT:
        // 差集：从现有选区中移除新选区
        ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(tempCanvas2, 0, 0);
        break;
      case SelectionMode.INTERSECT:
        // 交集：只保留两个选区的重叠部分
        ctx.globalCompositeOperation = 'source-in';
        ctx.drawImage(tempCanvas2, 0, 0);
        break;
      default:
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(tempCanvas2, 0, 0);
    }

    // 获取合并结果
    const resultImageData = ctx.getImageData(0, 0, this.width, this.height);
    return this.createMaskFromImageData(resultImageData);
  }

  /**
   * 降级的手动合并方法
   */
  private mergeSelectionsManually(existing: Uint8Array, newSelection: Uint8Array, mode: SelectionMode): Uint8Array {
    const result = new Uint8Array(this.width * this.height);
    
    for (let i = 0; i < result.length; i++) {
      const existingPixel = existing[i];
      const newPixel = newSelection[i];

      switch (mode) {
        case SelectionMode.ADD:
          result[i] = existingPixel || newPixel ? 1 : 0;
          break;
        case SelectionMode.SUBTRACT:
          result[i] = existingPixel && !newPixel ? 1 : 0;
          break;
        case SelectionMode.INTERSECT:
          result[i] = existingPixel && newPixel ? 1 : 0;
          break;
        default:
          result[i] = newPixel;
      }
    }

    return result;
  }

  /**
   * 从遮罩创建ImageData
   */
  private createImageDataFromMask(mask: Uint8Array): ImageData {
    const imageData = new ImageData(this.width, this.height);
    for (let i = 0; i < mask.length; i++) {
      const dataIndex = i * 4;
      if (mask[i]) {
        imageData.data[dataIndex] = 255;     // R
        imageData.data[dataIndex + 1] = 255; // G
        imageData.data[dataIndex + 2] = 255; // B
        imageData.data[dataIndex + 3] = 255; // A
      }
    }
    return imageData;
  }

  /**
   * 从ImageData创建遮罩
   */
  private createMaskFromImageData(imageData: ImageData): Uint8Array {
    const mask = new Uint8Array(this.width * this.height);
    for (let i = 0; i < mask.length; i++) {
      const dataIndex = i * 4;
      // 检查alpha通道判断是否被选中
      mask[i] = imageData.data[dataIndex + 3] > 128 ? 1 : 0;
    }
    return mask;
  }

  /**
   * 从ImageData应用选区
   */
  applySelectionFromImageData(imageData: ImageData, mode: SelectionMode): void {
    const mask = new Uint8Array(this.width * this.height);
    
    for (let i = 0; i < mask.length; i++) {
      const dataIndex = i * 4;
      // 检查alpha通道判断是否被选中
      mask[i] = imageData.data[dataIndex + 3] > 128 ? 1 : 0;
    }

    this.applySelection(mask, mode);
  }

  /**
   * 清空选区
   */
  clearSelection(): void {
    this.currentSelection = null;
  }

  /**
   * 反转选区
   */
  invertSelection(): void {
    if (!this.currentSelection) {
      // 如果没有选区，创建全选
      this.currentSelection = new Uint8Array(this.width * this.height);
      this.currentSelection.fill(1);
      return;
    }

    // 反转现有选区
    for (let i = 0; i < this.currentSelection.length; i++) {
      this.currentSelection[i] = this.currentSelection[i] ? 0 : 1;
    }
  }

  /**
   * 全选
   */
  selectAll(): void {
    this.currentSelection = new Uint8Array(this.width * this.height);
    this.currentSelection.fill(1);
  }

  /**
   * 检查是否有选区
   */
  hasSelection(): boolean {
    if (!this.currentSelection) return false;
    
    // 检查是否有任何像素被选中
    for (let i = 0; i < this.currentSelection.length; i++) {
      if (this.currentSelection[i]) return true;
    }
    return false;
  }

  /**
   * 获取选区面积（像素数）
   */
  getSelectionArea(): number {
    if (!this.currentSelection) return 0;
    
    let area = 0;
    for (let i = 0; i < this.currentSelection.length; i++) {
      if (this.currentSelection[i]) area++;
    }
    return area;
  }

  /**
   * 扩展选区（膨胀操作）
   */
  expandSelection(pixels: number): void {
    if (!this.currentSelection || pixels <= 0) return;

    const original = new Uint8Array(this.currentSelection);
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const index = y * this.width + x;
        
        if (!original[index]) {
          // 检查周围是否有选中的像素
          let shouldSelect = false;
          
          for (let dy = -pixels; dy <= pixels && !shouldSelect; dy++) {
            for (let dx = -pixels; dx <= pixels && !shouldSelect; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              
              if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                const nIndex = ny * this.width + nx;
                if (original[nIndex] && Math.abs(dx) + Math.abs(dy) <= pixels) {
                  shouldSelect = true;
                }
              }
            }
          }
          
          if (shouldSelect) {
            this.currentSelection[index] = 1;
          }
        }
      }
    }
  }

  /**
   * 收缩选区（腐蚀操作）
   */
  contractSelection(pixels: number): void {
    if (!this.currentSelection || pixels <= 0) return;

    const original = new Uint8Array(this.currentSelection);
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const index = y * this.width + x;
        
        if (original[index]) {
          // 检查周围是否有未选中的像素
          let shouldDeselect = false;
          
          for (let dy = -pixels; dy <= pixels && !shouldDeselect; dy++) {
            for (let dx = -pixels; dx <= pixels && !shouldDeselect; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              
              if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                const nIndex = ny * this.width + nx;
                if (!original[nIndex] && Math.abs(dx) + Math.abs(dy) <= pixels) {
                  shouldDeselect = true;
                }
              } else if (Math.abs(dx) + Math.abs(dy) <= pixels) {
                // 边界外视为未选中
                shouldDeselect = true;
              }
            }
          }
          
          if (shouldDeselect) {
            this.currentSelection[index] = 0;
          }
        }
      }
    }
  }
}
