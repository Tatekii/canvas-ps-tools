import { useCallback } from 'react'
import { MagicWandTool } from '../utils/MagicWandTool'
import { LassoTool } from '../utils/LassoTool'
import { SelectionManager } from '../utils/SelectionManager'
import { SelectionRenderer } from '../utils/SelectionRenderer'
import { SelectionMode } from '../utils/SelectionTypes'
import { useLassoHandler } from './useLassoHandler'
import { useMagicWandHandler } from './useMagicWandHandler'

interface UseMouseEventProps {
  selectedTool: string
  image: HTMLImageElement | null
  magicWandTool: MagicWandTool | null
  lassoTool: LassoTool | null
  selectionManager: SelectionManager | null
  selectionRenderer: SelectionRenderer | null
  currentMode: SelectionMode
  onSelectionChange: (hasSelection: boolean, area?: number) => void
  setSelection: (selection: ImageData | null) => void
  canvasRef: React.RefObject<HTMLCanvasElement>
  containerRef?: React.RefObject<HTMLElement> // 添加容器引用
  transformPoint?: (x: number, y: number) => { x: number; y: number }
}

interface UseMouseEventReturn {
  handleMouseDown: (event: React.MouseEvent<HTMLCanvasElement>) => void
  handleMouseMove: (event: React.MouseEvent<HTMLCanvasElement>) => void
  handleMouseUp: (event: React.MouseEvent<HTMLCanvasElement>) => void
  isDrawing: boolean
}

/**
 * 统一的鼠标事件处理Hook
 * 
 * 这个Hook作为顶层协调器，负责：
 * - 坐标转换和基础验证
 * - 根据当前工具分发事件到对应的处理器
 * - 管理全局绘制状态
 * - 提供统一的鼠标事件接口
 */
export function useMouseEvent({
  selectedTool,
  image,
  magicWandTool,
  lassoTool,
  selectionManager,
  selectionRenderer,
  currentMode,
  onSelectionChange,
  setSelection,
  canvasRef,
  containerRef,
  transformPoint
}: UseMouseEventProps): UseMouseEventReturn {

  // 套索工具处理器
  const lassoHandler = useLassoHandler({
    lassoTool,
    selectionManager,
    selectionRenderer,
    currentMode,
    onSelectionChange,
    setSelection,
    enabled: selectedTool === 'lasso'
  })

  // 魔术棒工具处理器
  const magicWandHandler = useMagicWandHandler({
    magicWandTool,
    selectionManager,
    selectionRenderer,
    currentMode,
    onSelectionChange,
    setSelection,
    enabled: selectedTool === 'magic-wand'
  })

  // 鼠标坐标转换函数
  const getMousePos = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    // 优先使用容器的边界框，这样可以避免CSS变换对坐标计算的影响
    const container = containerRef?.current
    const canvas = canvasRef.current
    
    if (container && canvas) {
      const containerRect = container.getBoundingClientRect()
      
      // 计算相对于容器的鼠标位置
      const screenPos = {
        x: event.clientX - containerRect.left,
        y: event.clientY - containerRect.top,
      }
      
      // 如果有变换函数，转换到画布坐标系
      if (transformPoint) {
        return transformPoint(screenPos.x, screenPos.y)
      }
      
      return screenPos
    }
    
    // 降级到使用画布边界框
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      
      // 计算相对于画布元素的鼠标位置
      const screenPos = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
      
      // 如果有变换函数，转换到画布坐标系
      if (transformPoint) {
        return transformPoint(screenPos.x, screenPos.y)
      }
      
      return screenPos
    }
    
    return { x: 0, y: 0 }
  }, [canvasRef, containerRef, transformPoint])

  // 鼠标按下事件
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return

    const pos = getMousePos(event)
    const nativeEvent = event.nativeEvent

    // 根据当前工具分发事件
    switch (selectedTool) {
      case 'magic-wand':
        magicWandHandler.handleMouseDown(pos.x, pos.y, nativeEvent)
        break
      case 'lasso':
        lassoHandler.handleMouseDown(pos.x, pos.y)
        break
      default:
        // 可以在这里添加其他工具的处理
        break
    }
  }, [image, selectedTool, getMousePos, magicWandHandler, lassoHandler])

  // 鼠标移动事件
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return

    const pos = getMousePos(event)

    // 只有套索工具需要处理鼠标移动
    if (selectedTool === 'lasso') {
      lassoHandler.handleMouseMove(pos.x, pos.y)
    }
  }, [image, selectedTool, getMousePos, lassoHandler])

  // 鼠标释放事件
  const handleMouseUp = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return

    const nativeEvent = event.nativeEvent

    // 只有套索工具需要处理鼠标释放
    if (selectedTool === 'lasso') {
      lassoHandler.handleMouseUp(nativeEvent)
    }
  }, [image, selectedTool, lassoHandler])

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isDrawing: lassoHandler.isDrawing
  }
}
