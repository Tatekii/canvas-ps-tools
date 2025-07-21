import { useCallback, useRef } from 'react'
import { LassoTool } from '../utils/LassoTool'
import { SelectionManager } from '../utils/SelectionManager'
import { SelectionRenderer } from '../utils/SelectionRenderer'
import { getSelectionModeFromEvent } from '../utils/KeyboardUtils'
import { SelectionMode } from '../utils/SelectionTypes'

interface UseLassoHandlerProps {
  lassoTool: LassoTool | null
  selectionManager: SelectionManager | null
  selectionRenderer: SelectionRenderer | null
  currentMode: SelectionMode
  onSelectionChange: (hasSelection: boolean, area?: number) => void
  setSelection: (selection: ImageData | null) => void
  enabled: boolean
}

interface UseLassoHandlerReturn {
  handleMouseDown: (x: number, y: number) => void
  handleMouseMove: (x: number, y: number) => void
  handleMouseUp: (event: MouseEvent) => void
  isDrawing: boolean
}

/**
 * 套索工具鼠标事件处理Hook
 * 
 * 负责处理套索工具的完整鼠标交互流程：
 * - 开始绘制路径
 * - 实时更新路径
 * - 完成路径并生成选区
 * - 更新选区状态和渲染
 */
export function useLassoHandler({
  lassoTool,
  selectionManager,
  selectionRenderer,
  currentMode,
  onSelectionChange,
  setSelection,
  enabled
}: UseLassoHandlerProps): UseLassoHandlerReturn {
  const isDrawingRef = useRef(false)

  const handleMouseDown = useCallback((x: number, y: number) => {
    if (!enabled || !lassoTool) return
    
    isDrawingRef.current = true
    lassoTool.startPath(x, y)
  }, [enabled, lassoTool])

  const handleMouseMove = useCallback((x: number, y: number) => {
    if (!enabled || !lassoTool || !isDrawingRef.current) return
    
    lassoTool.addPoint(x, y)
  }, [enabled, lassoTool])

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!enabled || !lassoTool || !isDrawingRef.current || !selectionManager) return
    
    isDrawingRef.current = false
    const mode = getSelectionModeFromEvent(event) || currentMode
    const success = lassoTool.finishPath(mode)

    if (success) {
      // 获取当前选区用于渲染
      const currentSelection = selectionManager.getCurrentSelectionAsImageData()
      
      // 检查是否真的有选区（不是空选区）
      if (selectionManager.hasSelection() && currentSelection) {
        setSelection(currentSelection)
        if (selectionRenderer) {
          selectionRenderer.renderSelection(currentSelection)
          const area = selectionManager.getSelectionArea()
          onSelectionChange(true, area)
        }
      } else {
        // 选区为空，清除状态
        setSelection(null)
        if (selectionRenderer) {
          selectionRenderer.clearSelection()
        }
        onSelectionChange(false)
      }
    } else {
      onSelectionChange(false)
    }
  }, [enabled, lassoTool, selectionManager, selectionRenderer, currentMode, onSelectionChange, setSelection])

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isDrawing: isDrawingRef.current
  }
}
