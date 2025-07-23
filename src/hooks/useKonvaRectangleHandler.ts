import { useCallback, useRef } from 'react'
import { RectangleSelectionTool } from '../utils/RectangleSelectionTool'
import { SelectionManager } from '../utils/SelectionManager'
import { KonvaSelectionRenderer } from '../components/KonvaSelectionOverlay'
import { getSelectionModeFromEvent } from '../utils/KeyboardUtils'
import { SelectionMode } from '../utils/SelectionTypes'

interface UseKonvaRectangleHandlerProps {
  rectangleTool: RectangleSelectionTool | null
  selectionManager: SelectionManager | null
  konvaSelectionRenderer: KonvaSelectionRenderer | null
  currentMode: SelectionMode
  onSelectionChange: (hasSelection: boolean, area?: number) => void
  setSelection: (selection: ImageData | null) => void
  enabled: boolean
}

interface UseKonvaRectangleHandlerReturn {
  handleMouseDown: (x: number, y: number) => void
  handleMouseMove: (x: number, y: number) => void
  handleMouseUp: (x: number, y: number, event: MouseEvent) => void
  isDrawing: boolean
}

/**
 * Konva矩形选区工具鼠标事件处理Hook
 * 
 * 负责处理矩形选区工具的完整鼠标交互流程：
 * - 开始绘制矩形选区
 * - 实时更新矩形预览
 * - 完成矩形选区并生成选区
 * - 更新选区状态和渲染
 */
export function useKonvaRectangleHandler({
  rectangleTool,
  selectionManager,
  konvaSelectionRenderer,
  currentMode,
  onSelectionChange,
  setSelection,
  enabled
}: UseKonvaRectangleHandlerProps): UseKonvaRectangleHandlerReturn {
  const isDrawingRef = useRef(false)

  const handleMouseDown = useCallback((x: number, y: number) => {
    if (!enabled || !rectangleTool) return
    
    isDrawingRef.current = true
    rectangleTool.startSelection(x, y)
  }, [enabled, rectangleTool])

  const handleMouseMove = useCallback((x: number, y: number) => {
    if (!enabled || !rectangleTool || !isDrawingRef.current) return
    
    rectangleTool.updateSelection(x, y)
  }, [enabled, rectangleTool])

  const handleMouseUp = useCallback((x: number, y: number, event: MouseEvent) => {
    if (!enabled || !rectangleTool || !isDrawingRef.current || !selectionManager) return
    
    isDrawingRef.current = false
    
    // 根据按键确定选区模式
    const eventMode = getSelectionModeFromEvent(event)
    const actualMode = eventMode || currentMode
    
    const success = rectangleTool.finishSelection(x, y, actualMode)

    if (success) {
      const currentSelection = selectionManager.getCurrentSelectionAsImageData()
      
      if (selectionManager.hasSelection() && currentSelection) {
        setSelection(currentSelection)
        
        // 使用Konva渲染器更新选区显示
        if (konvaSelectionRenderer) {
          konvaSelectionRenderer.renderSelection(currentSelection)
        }
        
        const area = selectionManager.getSelectionArea()
        onSelectionChange(true, area)
      } else {
        // 选区为空，清除状态
        setSelection(null)
        
        // 清除选区显示
        if (konvaSelectionRenderer) {
          konvaSelectionRenderer.clearSelection()
        }
        
        onSelectionChange(false)
      }
    } else {
      onSelectionChange(false)
    }
  }, [enabled, rectangleTool, selectionManager, konvaSelectionRenderer, currentMode, onSelectionChange, setSelection])

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isDrawing: isDrawingRef.current
  }
}
