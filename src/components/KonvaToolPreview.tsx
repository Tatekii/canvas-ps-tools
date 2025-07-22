import React, { useEffect, useState, useRef } from 'react'
import { Shape, Group, Line, Rect } from 'react-konva'
import Konva from 'konva'

// 通用工具预览数据接口
export interface ToolPreviewData {
  type: 'lasso' | 'rectangle' | 'ellipse' | 'polygon'
  data: unknown
}

// 套索预览数据
export interface LassoPreviewData extends ToolPreviewData {
  type: 'lasso'
  data: {
    points: [number, number][]
    isDrawing: boolean
  }
}

// 矩形预览数据
export interface RectanglePreviewData extends ToolPreviewData {
  type: 'rectangle'
  data: {
    startX: number
    startY: number
    endX: number
    endY: number
    isDrawing: boolean
  }
}

// 椭圆预览数据
export interface EllipsePreviewData extends ToolPreviewData {
  type: 'ellipse'
  data: {
    centerX: number
    centerY: number
    radiusX: number
    radiusY: number
    isDrawing: boolean
  }
}

export type PreviewData = LassoPreviewData | RectanglePreviewData | EllipsePreviewData

interface KonvaToolPreviewProps {
  previewData: PreviewData | null
}

export const KonvaToolPreview: React.FC<KonvaToolPreviewProps> = ({
  previewData
}) => {
  const [dashOffset, setDashOffset] = useState(0)
  const animationRef = useRef<number | null>(null)

  // 预览动画效果
  useEffect(() => {
    if (!previewData || !previewData.data.isDrawing) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      return
    }

    const animate = () => {
      setDashOffset(prev => {
        const newOffset = prev + 0.5 // 动画速度
        return newOffset >= 20 ? 0 : newOffset // 重置偏移量
      })
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [previewData])

  // 清理动画
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  if (!previewData || !previewData.data.isDrawing) {
    return null
  }

  // 渲染套索预览
  const renderLassoPreview = (data: LassoPreviewData['data']) => {
    const { points } = data
    
    if (points.length === 0) return null

    // 单点时绘制圆点
    if (points.length === 1) {
      return (
        <Shape
          sceneFunc={(context: Konva.Context) => {
            const ctx = context._context
            ctx.save()
            ctx.fillStyle = '#00ff00'
            ctx.beginPath()
            ctx.arc(points[0][0], points[0][1], 3, 0, 2 * Math.PI)
            ctx.fill()
            ctx.restore()
          }}
          listening={false}
        />
      )
    }

    // 多点时绘制路径
    const linePoints: number[] = []
    points.forEach(point => {
      linePoints.push(point[0], point[1])
    })

    return (
      <Line
        points={linePoints}
        stroke="#00ff00"
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
        dash={[5, 5]}
        dashOffset={dashOffset}
        listening={false}
      />
    )
  }

  // 渲染矩形预览
  const renderRectanglePreview = (data: RectanglePreviewData['data']) => {
    const { startX, startY, endX, endY } = data
    
    const x = Math.min(startX, endX)
    const y = Math.min(startY, endY)
    const width = Math.abs(endX - startX)
    const height = Math.abs(endY - startY)

    return (
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        stroke="#00ff00"
        strokeWidth={2}
        dash={[5, 5]}
        dashOffset={dashOffset}
        listening={false}
        fill="transparent"
      />
    )
  }

  // 渲染椭圆预览
  const renderEllipsePreview = (data: EllipsePreviewData['data']) => {
    const { centerX, centerY, radiusX, radiusY } = data

    return (
      <Shape
        sceneFunc={(context: Konva.Context) => {
          const ctx = context._context
          ctx.save()
          ctx.strokeStyle = '#00ff00'
          ctx.lineWidth = 2
          ctx.setLineDash([5, 5])
          ctx.lineDashOffset = dashOffset
          
          ctx.beginPath()
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
          ctx.stroke()
          ctx.restore()
        }}
        listening={false}
      />
    )
  }

  // 根据类型渲染对应的预览
  const renderPreview = () => {
    switch (previewData.type) {
      case 'lasso':
        return renderLassoPreview(previewData.data)
      case 'rectangle':
        return renderRectanglePreview(previewData.data)
      case 'ellipse':
        return renderEllipsePreview(previewData.data)
      default:
        return null
    }
  }

  return (
    <Group>
      {renderPreview()}
    </Group>
  )
}

// 通用工具预览渲染器类
export class KonvaToolPreviewRenderer {
  private previewData: PreviewData | null = null
  private onPreviewChange?: (data: PreviewData | null) => void

  constructor(onPreviewChange?: (data: PreviewData | null) => void) {
    this.onPreviewChange = onPreviewChange
  }

  // 更新套索预览
  updateLassoPreview(points: [number, number][], isDrawing: boolean) {
    const data: LassoPreviewData = {
      type: 'lasso',
      data: { points, isDrawing }
    }
    this.previewData = data
    if (this.onPreviewChange) {
      this.onPreviewChange(data)
    }
  }

  // 更新矩形预览
  updateRectanglePreview(startX: number, startY: number, endX: number, endY: number, isDrawing: boolean) {
    const data: RectanglePreviewData = {
      type: 'rectangle',
      data: { startX, startY, endX, endY, isDrawing }
    }
    this.previewData = data
    if (this.onPreviewChange) {
      this.onPreviewChange(data)
    }
  }

  // 更新椭圆预览
  updateEllipsePreview(centerX: number, centerY: number, radiusX: number, radiusY: number, isDrawing: boolean) {
    const data: EllipsePreviewData = {
      type: 'ellipse',
      data: { centerX, centerY, radiusX, radiusY, isDrawing }
    }
    this.previewData = data
    if (this.onPreviewChange) {
      this.onPreviewChange(data)
    }
  }

  // 清除预览
  clearPreview() {
    this.previewData = null
    if (this.onPreviewChange) {
      this.onPreviewChange(null)
    }
  }

  // 获取当前预览数据
  getCurrentPreview(): PreviewData | null {
    return this.previewData
  }

  // 销毁渲染器
  destroy() {
    this.clearPreview()
  }
}
