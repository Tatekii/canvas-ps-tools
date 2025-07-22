import { useCallback } from 'react'
import { LassoTool } from '../utils/LassoTool'
import { SelectionManager } from '../utils/SelectionManager'
import { SelectionRenderer } from '../utils/SelectionRenderer'
import { KonvaSelectionRenderer } from '../components/KonvaSelectionOverlay'
import { getSelectionModeFromEvent } from '../utils/KeyboardUtils'
import { SelectionMode } from '../utils/SelectionTypes'

interface UseKonvaLassoHandlerProps {
  lassoTool: LassoTool | null
  selectionManager: SelectionManager | null
  selectionRenderer: SelectionRenderer | null
  konvaSelectionRenderer: KonvaSelectionRenderer | null
  useKonvaRenderer: boolean
  currentMode: SelectionMode
  onSelectionChange: (hasSelection: boolean, area?: number) => void
  setSelection: (selection: ImageData | null) => void
  enabled: boolean
}

interface UseKonvaLassoHandlerReturn {
  handleMouseDown: (x: number, y: number) => void
  handleMouseMove: (x: number, y: number) => void
  handleMouseUp: (event: MouseEvent) => void
}

/**
 * Konva套索工具鼠标事件处理Hook
 * 
 * 负责处理套索工具的完整鼠标交互流程：
 * - 开始绘制路径
 * - 实时更新路径
 * - 完成路径并生成选区
 * - 更新选区状态和渲染
 */
export function useKonvaLassoHandler({
  lassoTool,
  selectionManager,
  selectionRenderer,
  konvaSelectionRenderer,
  useKonvaRenderer,
  currentMode,
  onSelectionChange,
  setSelection,
  enabled
}: UseKonvaLassoHandlerProps): UseKonvaLassoHandlerReturn {

  const handleMouseDown = useCallback((x: number, y: number) => {
    if (!enabled || !lassoTool) return
    
    lassoTool.startPath(x, y)
  }, [enabled, lassoTool])

  const handleMouseMove = useCallback((x: number, y: number) => {
    if (!enabled || !lassoTool) return
    
    lassoTool.addPoint(x, y)
  }, [enabled, lassoTool])

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!enabled || !lassoTool || !selectionManager) return
    
    // 根据按键确定选区模式
    const eventMode = getSelectionModeFromEvent(event)
    const actualMode = eventMode || currentMode
    
    const success = lassoTool.finishPath(actualMode)

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
  }, [enabled, lassoTool, selectionManager, selectionRenderer, konvaSelectionRenderer, useKonvaRenderer, currentMode, onSelectionChange, setSelection])

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  }
}
