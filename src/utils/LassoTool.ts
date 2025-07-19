export class LassoTool {
  private canvas: HTMLCanvasElement;
  private path: [number, number][] = [];
  private isDrawing = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
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

  finishPath(): ImageData | null {
    if (this.path.length < 3) {
      this.clearPath();
      return null;
    }

    this.isDrawing = false;
    const selection = this.createSelection();
    this.clearPath();
    return selection;
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

  private createSelection(): ImageData {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const selectionData = new ImageData(width, height);

    // 使用扫描线算法填充多边形
    for (let y = 0; y < height; y++) {
      const intersections = this.getIntersections(y);
      intersections.sort((a, b) => a - b);

      for (let i = 0; i < intersections.length; i += 2) {
        if (i + 1 < intersections.length) {
          const startX = Math.ceil(intersections[i]);
          const endX = Math.floor(intersections[i + 1]);

          for (let x = startX; x <= endX; x++) {
            if (x >= 0 && x < width) {
              const index = (y * width + x) * 4;
              selectionData.data[index] = 255;     // R
              selectionData.data[index + 1] = 255; // G
              selectionData.data[index + 2] = 255; // B
              selectionData.data[index + 3] = 255; // A
            }
          }
        }
      }
    }

    return selectionData;
  }

  private getIntersections(y: number): number[] {
    const intersections: number[] = [];
    
    for (let i = 0; i < this.path.length; i++) {
      const j = (i + 1) % this.path.length;
      const [x1, y1] = this.path[i];
      const [x2, y2] = this.path[j];

      if ((y1 <= y && y < y2) || (y2 <= y && y < y1)) {
        const x = x1 + (y - y1) * (x2 - x1) / (y2 - y1);
        intersections.push(x);
      }
    }

    return intersections;
  }

  private clearPath() {
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.path = [];
    this.isDrawing = false;
  }

  getSelectionArea(selection: ImageData): number {
    let area = 0;
    for (let i = 3; i < selection.data.length; i += 4) {
      if (selection.data[i] > 0) area++;
    }
    return area;
  }
}