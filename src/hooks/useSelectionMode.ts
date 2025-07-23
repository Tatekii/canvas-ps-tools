import { useState, useCallback, useMemo } from 'react'
import { useKeyboardListener } from './useKeyboardListener'
import { SelectionMode } from '../utils/SelectionTypes'
import { EditTools } from '../constants'

interface UseSelectionModeProps {
  /** 当前选择的工具 */
  selectedTool: string
  /** 是否有图片加载 */
  hasImage: boolean
  /** 是否启用键盘快捷键控制 */
  enableKeyboardControl?: boolean
}

interface UseSelectionModeReturn {
  /** 当前选区模式 */
  currentMode: SelectionMode
  /** 当前键盘快捷键提示文本 */
  shortcutText: string
  /** 手动设置选区模式 */
  setMode: (mode: SelectionMode) => void
  /** 获取模式显示名称 */
  getModeName: (mode: SelectionMode) => string
  /** 重置为NEW模式 */
  resetMode: () => void
}

/**
 * 选区模式管理Hook
 * 
 * 功能：
 * - 管理当前选区模式状态
 * - 监听键盘事件自动切换模式（可选）
 * - 生成快捷键提示文本
 * - 提供手动模式管理方法
 * - 跨平台快捷键支持
 * 
 * @param props 配置参数
 * @returns 选区模式状态和管理方法
 */
export function useSelectionMode({
  selectedTool,
  hasImage,
  enableKeyboardControl = true
}: UseSelectionModeProps): UseSelectionModeReturn {
  
  // 内部状态管理
  const [currentMode, setCurrentMode] = useState<SelectionMode>(SelectionMode.NEW)
  const [shortcutText, setShortcutText] = useState<string>('')
  
  // 检查是否应该启用键盘监听
  // 修复：为所有选择工具启用键盘快捷键
  const shouldEnableKeyboard = enableKeyboardControl && hasImage && (
    selectedTool === EditTools.MAGIC_WAND || 
    selectedTool === EditTools.LASSO ||
    selectedTool === EditTools.RECTANGLE_SELECT ||
    selectedTool === EditTools.ELLIPSE_SELECT ||
    selectedTool === EditTools.BRUSH_SELECT
  )
  
  // 平台检测
  const platform = useMemo(() => 
    navigator.userAgent.toLowerCase().includes('mac') ? 'mac' as const : 'win' as const, 
    []
  )

  // 根据键盘事件计算模式和提示文本
  const handleKeyboardEvent = useCallback((event: KeyboardEvent) => {
    // 只处理修饰键相关事件
    if (!['Shift', 'Control', 'Meta', 'Alt'].includes(event.key)) {
      return
    }
    
    const isShiftPressed = event.shiftKey
    const isCtrlPressed = event.ctrlKey
    const isCmdPressed = event.metaKey
    
    // 根据平台选择主要修饰键
    const primaryModifier = platform === 'mac' ? isCmdPressed : isCtrlPressed
    const secondaryModifier = platform === 'mac' ? isCtrlPressed : false
    
    let targetMode = SelectionMode.NEW
    let newShortcutText = ''
    
    // 按键优先级：组合键 > 单个修饰键 > 默认模式
    if (isShiftPressed && primaryModifier) {
      targetMode = SelectionMode.INTERSECT
      newShortcutText = `Hold ${platform === 'mac' ? 'Cmd+Shift' : 'Ctrl+Shift'} to INTERSECT selection`
    } else if (primaryModifier) {
      targetMode = SelectionMode.SUBTRACT
      newShortcutText = `Hold ${platform === 'mac' ? 'Cmd' : 'Ctrl'} to SUBTRACT from selection`
    } else if (isShiftPressed) {
      targetMode = SelectionMode.ADD
      newShortcutText = 'Hold Shift to ADD to selection'
    } else if (platform === 'mac' && secondaryModifier) {
      // macOS下Ctrl键也可以用于减选
      targetMode = SelectionMode.SUBTRACT
      newShortcutText = 'Hold Ctrl to SUBTRACT from selection'
    }
    
    setCurrentMode(targetMode)
    setShortcutText(newShortcutText)
  }, [platform])

  // 键盘松开时重置
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    // 只处理修饰键相关事件
    if (!['Shift', 'Control', 'Meta', 'Alt'].includes(event.key)) {
      return
    }
    
    setCurrentMode(SelectionMode.NEW)
    setShortcutText('')
  }, [])

  // 使用键盘监听Hook
  useKeyboardListener({
    onKeyDown: handleKeyboardEvent,
    onKeyUp: handleKeyUp,
    enabled: shouldEnableKeyboard,
    exclude: 'input, textarea, select, [contenteditable="true"]'
  })

  // 手动设置选区模式
  const setMode = useCallback((mode: SelectionMode) => {
    setCurrentMode(mode)
    // 手动设置时清除快捷键提示
    setShortcutText('')
  }, [])

  // 重置为NEW模式
  const resetMode = useCallback(() => {
    setCurrentMode(SelectionMode.NEW)
    setShortcutText('')
  }, [])

  // 获取模式显示名称
  const getModeName = useCallback((mode: SelectionMode): string => {
    switch (mode) {
      case SelectionMode.NEW:
        return '新建选区'
      case SelectionMode.ADD:
        return '添加到选区'
      case SelectionMode.SUBTRACT:
        return '从选区减去'
      case SelectionMode.INTERSECT:
        return '与选区交集'
      default:
        return '未知模式'
    }
  }, [])

  return {
    currentMode,
    shortcutText,
    setMode,
    getModeName,
    resetMode
  }
}
