import { useCallback } from 'react'
import { MagicWandTool } from '../utils/MagicWandTool'
import { SelectionManager } from '../utils/SelectionManager'
import { SelectionRenderer } from '../utils/SelectionRenderer'
import { getSelectionModeFromEvent } from '../utils/KeyboardUtils'
import { SelectionMode } from '../utils/SelectionTypes'

interface UseMagicWandHandlerProps {
  magicWandTool: MagicWandTool | null
  selectionManager: SelectionManager | null
  selectionRenderer: SelectionRenderer | null
  currentMode: SelectionMode
  onSelectionChange: (hasSelection: boolean, area?: number) => void
  setSelection: (selection: ImageData | null) => void
  enabled: boolean
}

interface UseMagicWandHandlerReturn {
  handleMouseDown: (x: number, y: number, event: MouseEvent) => void
}

/**
 * 魔术棒工具鼠标事件处理Hook
 * 
 * 负责处理魔术棒工具的鼠标点击事件：
 * - 根据点击位置和按键状态确定选区模式
 * - 执行颜色选择
 * - 更新选区状态和渲染
 */
export function useMagicWandHandler({
  magicWandTool,
  selectionManager,
  selectionRenderer,
  currentMode,
  onSelectionChange,
  setSelection,
  enabled
}: UseMagicWandHandlerProps): UseMagicWandHandlerReturn {

  const handleMouseDown = useCallback((x: number, y: number, event: MouseEvent) => {
    if (!enabled || !magicWandTool || !selectionManager) return
    
    // 根据按键确定选区模式
    const eventMode = getSelectionModeFromEvent(event)
    const actualMode = eventMode || currentMode

    const success = magicWandTool.select(x, y, actualMode)

    if (success) {
      // 获取当前选区用于渲染和状态更新
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
  }, [enabled, magicWandTool, selectionManager, selectionRenderer, currentMode, onSelectionChange, setSelection])

  return {
    handleMouseDown
  }
}
