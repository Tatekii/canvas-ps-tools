import { useCallback } from 'react'
import { MagicWandTool } from '../utils/MagicWandTool'
import { SelectionManager } from '../utils/SelectionManager'
import { SelectionRenderer } from '../utils/SelectionRenderer'
import { KonvaSelectionRenderer } from '../components/KonvaSelectionOverlay'
import { getSelectionModeFromEvent } from '../utils/KeyboardUtils'
import { SelectionMode } from '../utils/SelectionTypes'

interface UseKonvaMagicWandHandlerProps {
  magicWandTool: MagicWandTool | null
  selectionManager: SelectionManager | null
  selectionRenderer: SelectionRenderer | null
  konvaSelectionRenderer: KonvaSelectionRenderer | null
  useKonvaRenderer: boolean
  currentMode: SelectionMode
  onSelectionChange: (hasSelection: boolean, area?: number) => void
  setSelection: (selection: ImageData | null) => void
  enabled: boolean
}

interface UseKonvaMagicWandHandlerReturn {
  handleMouseDown: (x: number, y: number, event: MouseEvent) => void
}

/**
 * Konva魔术棒工具鼠标事件处理Hook
 * 
 * 负责处理魔术棒工具的鼠标点击事件：
 * - 根据点击位置和按键状态确定选区模式
 * - 执行颜色选择
 * - 更新选区状态和渲染
 */
export function useKonvaMagicWandHandler({
  magicWandTool,
  selectionManager,
  selectionRenderer,
  konvaSelectionRenderer,
  useKonvaRenderer,
  currentMode,
  onSelectionChange,
  setSelection,
  enabled
}: UseKonvaMagicWandHandlerProps): UseKonvaMagicWandHandlerReturn {

  const handleMouseDown = useCallback((x: number, y: number, event: MouseEvent) => {
    if (!enabled || !magicWandTool || !selectionManager) return
    
    // 根据按键确定选区模式
    const eventMode = getSelectionModeFromEvent(event)
    const actualMode = eventMode || currentMode

    const success = magicWandTool.select(x, y, actualMode)

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
  }, [enabled, magicWandTool, selectionManager, selectionRenderer, konvaSelectionRenderer, useKonvaRenderer, currentMode, onSelectionChange, setSelection])

  return {
    handleMouseDown
  }
}
