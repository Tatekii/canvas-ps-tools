import React, { useEffect, useState, useRef } from 'react'
import { Shape, Group } from 'react-konva'
import Konva from 'konva'

interface KonvaSelectionOverlayProps {
  selection: ImageData | null
  animationFPS?: number // 可选的帧率控制
  onFPSChange?: (fps: number) => void // 帧率变化回调
}

export const KonvaSelectionOverlay: React.FC<KonvaSelectionOverlayProps> = ({
  selection,
  animationFPS = 30,
  onFPSChange
}) => {
  const [dashOffset, setDashOffset] = useState(0)
  const [targetFPS, setTargetFPS] = useState(animationFPS) // 使用props初始化帧率
  const animationRef = useRef<number | null>(null)
  const edgesCache = useRef<Array<{x1: number, y1: number, x2: number, y2: number}> | null>(null)
  const lastSelectionData = useRef<ImageData | null>(null)

  // 同步外部FPS变化
  useEffect(() => {
    setTargetFPS(animationFPS)
  }, [animationFPS])

  // 帧率变化时通知外部
  useEffect(() => {
    onFPSChange?.(targetFPS)
  }, [targetFPS, onFPSChange])

  // 蚂蚁线动画 - 优化版本，使用state管理帧率
  useEffect(() => {
    if (!selection) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      return
    }

    let lastTime = 0
    const frameInterval = 1000 / targetFPS // 使用state中的帧率

    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= frameInterval) {
        setDashOffset(prev => {
          const newOffset = prev + 0.5 // 稍微加快速度以补偿较低的帧率
          return newOffset >= 12 ? 0 : newOffset // 重置偏移量
        })
        lastTime = currentTime
      }
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [selection, targetFPS]) // 添加targetFPS为依赖

  // 清理动画和缓存
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      // 清理缓存
      edgesCache.current = null
      lastSelectionData.current = null
    }
  }, [])

  if (!selection) {
    return null
  }

  // 绘制选区边界的函数 - 优化版本
  const drawSelectionBorder = (context: Konva.Context) => {
    const ctx = context._context
    const { width, height, data } = selection
    
    // 保存原始状态
    ctx.save()
    
    // 检查是否需要重新计算边界（缓存优化）
    let edges = edgesCache.current
    if (!edges || lastSelectionData.current !== selection) {
      // 创建二维数组标记选中的像素
      const selected = new Array(height)
      for (let y = 0; y < height; y++) {
        selected[y] = new Array(width)
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4 + 3 // Alpha channel
          selected[y][x] = data[index] > 0
        }
      }
      
      // 收集所有边界线段
      edges = []
      
      // 收集水平边界
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (selected[y][x]) {
            // 上边界
            if (y === 0 || !selected[y - 1][x]) {
              edges.push({x1: x, y1: y, x2: x + 1, y2: y})
            }
            // 下边界
            if (y === height - 1 || !selected[y + 1][x]) {
              edges.push({x1: x, y1: y + 1, x2: x + 1, y2: y + 1})
            }
          }
        }
      }
      
      // 收集垂直边界
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          if (selected[y][x]) {
            // 左边界
            if (x === 0 || !selected[y][x - 1]) {
              edges.push({x1: x, y1: y, x2: x, y2: y + 1})
            }
            // 右边界
            if (x === width - 1 || !selected[y][x + 1]) {
              edges.push({x1: x + 1, y1: y, x2: x + 1, y2: y + 1})
            }
          }
        }
      }
      
      // 缓存计算结果
      edgesCache.current = edges
      lastSelectionData.current = selection
    }
    
    // 第一层：白色虚线
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 1
    ctx.setLineDash([6, 6])
    ctx.lineDashOffset = -dashOffset
    
    ctx.beginPath()
    edges.forEach(edge => {
      ctx.moveTo(edge.x1, edge.y1)
      ctx.lineTo(edge.x2, edge.y2)
    })
    ctx.stroke()
    
    // 第二层：黑色虚线（相位相反）
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 1
    ctx.setLineDash([6, 6])
    ctx.lineDashOffset = -dashOffset + 6 // 相位相反，形成蚂蚁线效果
    
    ctx.beginPath()
    edges.forEach(edge => {
      ctx.moveTo(edge.x1, edge.y1)
      ctx.lineTo(edge.x2, edge.y2)
    })
    ctx.stroke()
    
    // 恢复状态
    ctx.restore()
  }

  // 绘制蒙版的函数
  const drawMask = (context: Konva.Context) => {
    const ctx = context._context
    const { width, height, data } = selection
    
    // 保存原始状态
    ctx.save()
    
    // 设置蒙版样式
    ctx.fillStyle = 'rgba(0, 123, 255, 0.3)' // 半透明蓝色蒙版
    
    // 绘制选中的像素
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4 + 3 // Alpha channel
        if (data[index] > 0) {
          ctx.fillRect(x, y, 1, 1)
        }
      }
    }
    
    // 恢复状态
    ctx.restore()
  }

  return (
    <Group>
      {/* 蒙版层 */}
      <Shape
        sceneFunc={drawMask}
        listening={false}
        perfectDrawEnabled={false}
      />
      {/* 边界线层 */}
      <Shape
        sceneFunc={drawSelectionBorder}
        listening={false}
        perfectDrawEnabled={false}
      />
    </Group>
  )
}

// 新的Konva选区渲染器类，兼容现有接口
export class KonvaSelectionRenderer {
  private selection: ImageData | null = null
  private onSelectionChange?: (selection: ImageData | null) => void

  constructor(onSelectionChange?: (selection: ImageData | null) => void) {
    this.onSelectionChange = onSelectionChange
  }

  renderSelection(selection: ImageData) {
    this.selection = selection
    if (this.onSelectionChange) {
      this.onSelectionChange(selection)
    }
  }

  clearSelection() {
    this.selection = null
    if (this.onSelectionChange) {
      this.onSelectionChange(null)
    }
  }

  destroy() {
    this.clearSelection()
  }

  getCurrentSelection(): ImageData | null {
    return this.selection
  }
}
