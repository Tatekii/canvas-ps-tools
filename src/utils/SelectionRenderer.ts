export class SelectionRenderer {
  private canvas: HTMLCanvasElement;
  private animationId: number | null = null;
  private selection: ImageData | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  renderSelection(selection: ImageData) {
    this.selection = selection;
    this.startAnimation();
  }

  clearSelection() {
    this.selection = null;
    this.stopAnimation();
    
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  destroy() {
    this.clearSelection();
  }

  private stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private startAnimation() {
    this.stopAnimation();

    let offset = 0;
    const speed = 0.25; // 动画速度，值越小越慢
    
    const animate = () => {
      if (!this.selection) {
        this.stopAnimation();
        return;
      }
      
      this.drawMarchingAnts(offset);
      offset += speed; // 使用可调节的速度
      if (offset >= 12) { // 重置偏移量，避免数值过大
        offset = 0;
      }
      this.animationId = requestAnimationFrame(animate);
    };

    animate();
  }

  private drawMarchingAnts(offset: number) {
    const ctx = this.canvas.getContext('2d');
    if (!ctx || !this.selection) return;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const width = this.selection.width;
    const height = this.selection.height;
    const data = this.selection.data;

    // 创建路径数据
    const edges = this.findEdges(data, width, height);
    
    if (edges.length === 0) return;

    // 设置线条样式
    ctx.lineWidth = 1;
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';

    // 绘制白色虚线（主线）
    ctx.strokeStyle = '#ffffff';
    ctx.setLineDash([6, 6]); // 6像素实线，6像素空隙
    ctx.lineDashOffset = -offset; // 负值让虚线向前流动
    
    ctx.beginPath();
    for (const edge of edges) {
      ctx.moveTo(edge.startX + 0.5, edge.startY + 0.5); // +0.5 for crisp lines
      ctx.lineTo(edge.endX + 0.5, edge.endY + 0.5);
    }
    ctx.stroke();

    // 绘制黑色虚线（对比线，相位相反）
    ctx.strokeStyle = '#000000';
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = -offset + 6; // 相位相反，形成流动效果
    
    ctx.beginPath();
    for (const edge of edges) {
      ctx.moveTo(edge.startX + 0.5, edge.startY + 0.5);
      ctx.lineTo(edge.endX + 0.5, edge.endY + 0.5);
    }
    ctx.stroke();

    // 重置虚线设置
    ctx.setLineDash([]);
  }

  private findEdges(data: Uint8ClampedArray, width: number, height: number) {
    const edges: Array<{startX: number, startY: number, endX: number, endY: number}> = [];
    
    // 创建一个二维数组来标记选中的像素
    const selected = new Array(height);
    for (let y = 0; y < height; y++) {
      selected[y] = new Array(width);
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4 + 3; // Alpha channel
        selected[y][x] = data[index] > 0;
      }
    }
    
    // 查找水平边界
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (selected[y][x]) {
          // 检查上边界
          if (y === 0 || !selected[y - 1][x]) {
            edges.push({ startX: x, startY: y, endX: x + 1, endY: y });
          }
          // 检查下边界
          if (y === height - 1 || !selected[y + 1][x]) {
            edges.push({ startX: x, startY: y + 1, endX: x + 1, endY: y + 1 });
          }
        }
      }
    }
    
    // 查找垂直边界
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        if (selected[y][x]) {
          // 检查左边界
          if (x === 0 || !selected[y][x - 1]) {
            edges.push({ startX: x, startY: y, endX: x, endY: y + 1 });
          }
          // 检查右边界
          if (x === width - 1 || !selected[y][x + 1]) {
            edges.push({ startX: x + 1, startY: y, endX: x + 1, endY: y + 1 });
          }
        }
      }
    }

    return this.optimizeEdges(edges);
  }

  // 优化边缘，合并连续的线段
  private optimizeEdges(edges: Array<{startX: number, startY: number, endX: number, endY: number}>) {
    const optimized: Array<{startX: number, startY: number, endX: number, endY: number}> = [];
    
    // 分别处理水平和垂直线段
    const horizontal = edges.filter(e => e.startY === e.endY);
    const vertical = edges.filter(e => e.startX === e.endX);
    
    // 合并水平线段
    horizontal.sort((a, b) => a.startY - b.startY || a.startX - b.startX);
    let current: {startX: number, startY: number, endX: number, endY: number} | null = null;
    
    for (const edge of horizontal) {
      if (current && current.startY === edge.startY && current.endX === edge.startX) {
        // 延长当前线段
        current.endX = edge.endX;
      } else {
        // 开始新线段
        if (current) optimized.push(current);
        current = { ...edge };
      }
    }
    if (current) optimized.push(current);
    
    // 合并垂直线段
    vertical.sort((a, b) => a.startX - b.startX || a.startY - b.startY);
    current = null;
    
    for (const edge of vertical) {
      if (current && current.startX === edge.startX && current.endY === edge.startY) {
        // 延长当前线段
        current.endY = edge.endY;
      } else {
        // 开始新线段
        if (current) optimized.push(current);
        current = { ...edge };
      }
    }
    if (current) optimized.push(current);
    
    return optimized;
  }
}