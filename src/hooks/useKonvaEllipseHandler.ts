import { useCallback, useRef } from 'react'
import { EllipseSelectionTool } from '../utils/EllipseSelectionTool'
import { SelectionManager } from '../utils/SelectionManager'
import { SelectionRenderer } from '../utils/SelectionRenderer'
import { KonvaSelectionRenderer } from '../components/KonvaSelectionOverlay'
import { getSelectionModeFromEvent } from '../utils/KeyboardUtils'
import { SelectionMode } from '../utils/SelectionTypes'

interface UseKonvaEllipseHandlerProps {
  ellipseTool: EllipseSelectionTool | null
  selectionManager: SelectionManager | null
  selectionRenderer: SelectionRenderer | null
  konvaSelectionRenderer: KonvaSelectionRenderer | null
  useKonvaRenderer: boolean
  currentMode: SelectionMode
  onSelectionChange: (hasSelection: boolean, area?: number) => void
  setSelection: (selection: ImageData | null) => void
  enabled: boolean
}

interface UseKonvaEllipseHandlerReturn {
  handleMouseDown: (x: number, y: number) => void
  handleMouseMove: (x: number, y: number) => void
  handleMouseUp: (x: number, y: number, event: MouseEvent) => void
  isDrawing: boolean
}

/**
 * Konva椭圆选区工具鼠标事件处理Hook
 * 
 * 负责处理椭圆选区工具的完整鼠标交互流程：
 * - 开始绘制椭圆选区
 * - 实时更新椭圆预览
 * - 完成椭圆选区并生成选区
 * - 更新选区状态和渲染
 */
export function useKonvaEllipseHandler({
  ellipseTool,
  selectionManager,
  selectionRenderer,
  konvaSelectionRenderer,
  useKonvaRenderer,
  currentMode,
  onSelectionChange,
  setSelection,
  enabled
}: UseKonvaEllipseHandlerProps): UseKonvaEllipseHandlerReturn {
  const isDrawingRef = useRef(false)

  const handleMouseDown = useCallback((x: number, y: number) => {
    if (!enabled || !ellipseTool) return
    
    isDrawingRef.current = true
    ellipseTool.startSelection(x, y)
  }, [enabled, ellipseTool])

  const handleMouseMove = useCallback((x: number, y: number) => {
    if (!enabled || !ellipseTool || !isDrawingRef.current) return
    
    ellipseTool.updateSelection(x, y)
  }, [enabled, ellipseTool])

  const handleMouseUp = useCallback((x: number, y: number, event: MouseEvent) => {
    if (!enabled || !ellipseTool || !isDrawingRef.current || !selectionManager) return
    
    isDrawingRef.current = false
    
    // 根据按键确定选区模式
    const eventMode = getSelectionModeFromEvent(event)
    const actualMode = eventMode || currentMode
    
    const success = ellipseTool.finishSelection(x, y, actualMode)

    if (success) {
      const currentSelection = selectionManager.getCurrentSelectionAsImageData()
      
      if (selectionManager.hasSelection() && currentSelection) {
        setSelection(currentSelection)
        
        // 根据渲染器类型更新选区显示
        if (useKonvaRenderer && konvaSelectionRenderer) {
          konvaSelectionRenderer.renderSelection(currentSelection)
        } else if (selectionRenderer) {
          selectionRenderer.renderSelection(currentSelection)
        }
        
        const area = selectionManager.getSelectionArea()
        onSelectionChange(true, area)
      } else {
        // 选区为空，清除状态
        setSelection(null)
        
        // 清除选区显示
        if (useKonvaRenderer && konvaSelectionRenderer) {
          konvaSelectionRenderer.clearSelection()
        } else if (selectionRenderer) {
          selectionRenderer.clearSelection()
        }
        
        onSelectionChange(false)
      }
    } else {
      onSelectionChange(false)
    }
  }, [enabled, ellipseTool, selectionManager, selectionRenderer, konvaSelectionRenderer, useKonvaRenderer, currentMode, onSelectionChange, setSelection])

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isDrawing: isDrawingRef.current
  }
}
