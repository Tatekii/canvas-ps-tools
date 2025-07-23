import { useCallback, useRef } from 'react'
import { BrushSelectionTool } from '../utils/BrushSelectionTool'
import { SelectionManager } from '../utils/SelectionManager'
import { KonvaSelectionRenderer } from '../components/KonvaSelectionOverlay'
import { getSelectionModeFromEvent } from '../utils/KeyboardUtils'
import { SelectionMode } from '../utils/SelectionTypes'

interface UseKonvaBrushHandlerProps {
  brushTool: BrushSelectionTool | null
  selectionManager: SelectionManager | null
  konvaSelectionRenderer: KonvaSelectionRenderer | null
  onSelectionChange: (hasSelection: boolean, area?: number) => void
  setSelection: (selection: ImageData | null) => void
  enabled: boolean
}

interface UseKonvaBrushHandlerReturn {
  handleMouseDown: (x: number, y: number) => void
  handleMouseMove: (x: number, y: number) => void
  handleMouseUp: (event: MouseEvent) => void
  isDrawing: boolean
}

/**
 * Konva画笔选区工具鼠标事件处理Hook
 * 
 * 负责处理画笔选区工具的完整鼠标交互流程：
 * - 开始绘制画笔路径
 * - 实时更新画笔路径
 * - 完成画笔路径并生成选区
 * - 更新选区状态和渲染
 */
export function useKonvaBrushHandler({
  brushTool,
  selectionManager,
  konvaSelectionRenderer,
  onSelectionChange,
  setSelection,
  enabled
}: UseKonvaBrushHandlerProps): UseKonvaBrushHandlerReturn {
  const isDrawingRef = useRef(false)

  const handleMouseDown = useCallback((x: number, y: number) => {
    if (!enabled || !brushTool) return
    
    isDrawingRef.current = true
    brushTool.startDrawing(x, y)
  }, [enabled, brushTool])

  const handleMouseMove = useCallback((x: number, y: number) => {
    if (!enabled || !brushTool || !isDrawingRef.current) return
    
    brushTool.addPoint(x, y)
  }, [enabled, brushTool])

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!enabled || !brushTool || !isDrawingRef.current || !selectionManager) return
    
    isDrawingRef.current = false
    
    // 根据按键确定选区模式
    // 修复：正确处理getSelectionModeFromEvent可能返回null的情况
    const eventMode = getSelectionModeFromEvent(event)
    const actualMode = eventMode !== null ? eventMode : SelectionMode.NEW
    
    const success = brushTool.finishDrawing(actualMode)

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
  }, [enabled, brushTool, selectionManager, konvaSelectionRenderer, onSelectionChange, setSelection])

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isDrawing: isDrawingRef.current
  }
}
