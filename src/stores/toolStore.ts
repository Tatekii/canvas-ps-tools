import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

/**
 * 工具类型定义
 */
export type ToolType = 
  | 'selection'      // 选择工具 (包含矩形、椭圆、套索、魔棒、笔刷选择)
  | 'brush'          // 笔刷工具
  | 'eraser'         // 橡皮擦工具
  | 'text'           // 文字工具
  | 'shape'          // 形状工具
  | 'eyedropper'     // 吸管工具
  | 'hand'           // 抓手工具 (平移)
  | 'zoom'           // 缩放工具

export type SelectionToolType =
  | 'rectangle'      // 矩形选择
  | 'ellipse'        // 椭圆选择  
  | 'lasso'          // 套索选择
  | 'magic-wand'     // 魔棒选择
  | 'brush'          // 笔刷选择

/**
 * 工具参数配置
 */
export interface BrushToolConfig {
  size: number        // 笔刷大小 (1-100)
  hardness: number    // 硬度 (0-100)
  opacity: number     // 不透明度 (0-100)
  flow: number        // 流量 (0-100)
  spacing: number     // 间距 (1-300)
  color: string       // 颜色
}

export interface EraserToolConfig {
  size: number        // 橡皮擦大小 (1-100)
  hardness: number    // 硬度 (0-100)
  opacity: number     // 不透明度 (0-100)
  mode: 'normal' | 'background' | 'block' // 橡皮擦模式
}

export interface SelectionToolConfig {
  feather: number     // 羽化值 (0-250)
  antiAlias: boolean  // 抗锯齿
  contiguous: boolean // 连续选择 (仅魔棒工具)
  tolerance: number   // 容差 (0-255, 仅魔棒工具)
  sampleAllLayers: boolean // 对所有图层取样 (仅魔棒工具)
}

export interface TextToolConfig {
  fontFamily: string  // 字体
  fontSize: number    // 字号
  fontWeight: 'normal' | 'bold' | 'lighter' | 'bolder'
  fontStyle: 'normal' | 'italic'
  color: string       // 文字颜色
  align: 'left' | 'center' | 'right' | 'justify'
  lineHeight: number  // 行高
  letterSpacing: number // 字间距
}

/**
 * 工具状态存储接口
 */
export interface ToolStore {
  // 当前工具状态
  activeTool: ToolType
  activeSelectionTool: SelectionToolType
  
  // 工具配置
  brushConfig: BrushToolConfig
  eraserConfig: EraserToolConfig
  selectionConfig: SelectionToolConfig
  textConfig: TextToolConfig
  
  // 工具快捷键状态
  isSpacePressed: boolean    // 空格键按下 (临时切换到抓手工具)
  isAltPressed: boolean      // Alt键按下 (吸管工具等)
  isShiftPressed: boolean    // Shift键按下 (约束操作)
  isCtrlPressed: boolean     // Ctrl/Cmd键按下 (复制等)
  
  // 工具操作
  setActiveTool: (tool: ToolType) => void
  setActiveSelectionTool: (tool: SelectionToolType) => void
  
  // 配置更新
  updateBrushConfig: (config: Partial<BrushToolConfig>) => void
  updateEraserConfig: (config: Partial<EraserToolConfig>) => void
  updateSelectionConfig: (config: Partial<SelectionToolConfig>) => void
  updateTextConfig: (config: Partial<TextToolConfig>) => void
  
  // 快捷键状态管理
  setKeyPressed: (key: 'space' | 'alt' | 'shift' | 'ctrl', pressed: boolean) => void
  
  // 工具预设
  saveBrushPreset: (name: string, config: BrushToolConfig) => void
  loadBrushPreset: (name: string) => void
  getBrushPresets: () => Record<string, BrushToolConfig>
  
  // 重置配置
  resetToolConfigs: () => void
}

/**
 * 默认工具配置
 */
const DEFAULT_BRUSH_CONFIG: BrushToolConfig = {
  size: 20,
  hardness: 100,
  opacity: 100,
  flow: 100,
  spacing: 25,
  color: '#000000'
}

const DEFAULT_ERASER_CONFIG: EraserToolConfig = {
  size: 20,
  hardness: 100,
  opacity: 100,
  mode: 'normal'
}

const DEFAULT_SELECTION_CONFIG: SelectionToolConfig = {
  feather: 0,
  antiAlias: true,
  contiguous: true,
  tolerance: 32,
  sampleAllLayers: false
}

const DEFAULT_TEXT_CONFIG: TextToolConfig = {
  fontFamily: 'Arial, sans-serif',
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  color: '#000000',
  align: 'left',
  lineHeight: 1.2,
  letterSpacing: 0
}

/**
 * 工具状态存储实现
 */
export const useToolStore = create<ToolStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    activeTool: 'selection',
    activeSelectionTool: 'rectangle',
    
    // 工具配置
    brushConfig: { ...DEFAULT_BRUSH_CONFIG },
    eraserConfig: { ...DEFAULT_ERASER_CONFIG },
    selectionConfig: { ...DEFAULT_SELECTION_CONFIG },
    textConfig: { ...DEFAULT_TEXT_CONFIG },
    
    // 快捷键状态
    isSpacePressed: false,
    isAltPressed: false,
    isShiftPressed: false,
    isCtrlPressed: false,
    
    // 工具操作
    setActiveTool: (tool: ToolType) => {
      set({ activeTool: tool })
    },
    
    setActiveSelectionTool: (tool: SelectionToolType) => {
      set({ activeSelectionTool: tool })
      // 自动切换到选择工具
      if (get().activeTool !== 'selection') {
        set({ activeTool: 'selection' })
      }
    },
    
    // 配置更新
    updateBrushConfig: (config: Partial<BrushToolConfig>) => {
      set((state) => ({
        brushConfig: { ...state.brushConfig, ...config }
      }))
    },
    
    updateEraserConfig: (config: Partial<EraserToolConfig>) => {
      set((state) => ({
        eraserConfig: { ...state.eraserConfig, ...config }
      }))
    },
    
    updateSelectionConfig: (config: Partial<SelectionToolConfig>) => {
      set((state) => ({
        selectionConfig: { ...state.selectionConfig, ...config }
      }))
    },
    
    updateTextConfig: (config: Partial<TextToolConfig>) => {
      set((state) => ({
        textConfig: { ...state.textConfig, ...config }
      }))
    },
    
    // 快捷键状态管理
    setKeyPressed: (key: 'space' | 'alt' | 'shift' | 'ctrl', pressed: boolean) => {
      switch (key) {
        case 'space':
          set({ isSpacePressed: pressed })
          break
        case 'alt':
          set({ isAltPressed: pressed })
          break
        case 'shift':
          set({ isShiftPressed: pressed })
          break
        case 'ctrl':
          set({ isCtrlPressed: pressed })
          break
      }
    },
    
    // 笔刷预设管理 (简化版，实际应该存储到 localStorage)
    saveBrushPreset: (name: string, config: BrushToolConfig) => {
      // TODO: 实现保存到 localStorage
      console.log(`Saving brush preset "${name}":`, config)
    },
    
    loadBrushPreset: (name: string) => {
      // TODO: 实现从 localStorage 加载
      console.log(`Loading brush preset "${name}"`)
    },
    
    getBrushPresets: () => {
      // TODO: 实现从 localStorage 获取预设列表
      return {}
    },
    
    // 重置配置
    resetToolConfigs: () => {
      set({
        brushConfig: { ...DEFAULT_BRUSH_CONFIG },
        eraserConfig: { ...DEFAULT_ERASER_CONFIG },
        selectionConfig: { ...DEFAULT_SELECTION_CONFIG },
        textConfig: { ...DEFAULT_TEXT_CONFIG }
      })
    }
  }))
)

/**
 * 便捷的选择器 hooks
 */

// 获取当前工具
export const useActiveTool = () => useToolStore((state) => state.activeTool)

// 获取当前选择工具
export const useActiveSelectionTool = () => useToolStore((state) => state.activeSelectionTool)

// 获取工具配置
export const useBrushConfig = () => useToolStore((state) => state.brushConfig)
export const useEraserConfig = () => useToolStore((state) => state.eraserConfig)
export const useSelectionConfig = () => useToolStore((state) => state.selectionConfig)
export const useTextConfig = () => useToolStore((state) => state.textConfig)

// 获取快捷键状态
export const useKeyboardState = () => useToolStore((state) => ({
  isSpacePressed: state.isSpacePressed,
  isAltPressed: state.isAltPressed,
  isShiftPressed: state.isShiftPressed,
  isCtrlPressed: state.isCtrlPressed
}))

// 获取工具操作函数
export const useToolActions = () => useToolStore((state) => ({
  setActiveTool: state.setActiveTool,
  setActiveSelectionTool: state.setActiveSelectionTool,
  updateBrushConfig: state.updateBrushConfig,
  updateEraserConfig: state.updateEraserConfig,
  updateSelectionConfig: state.updateSelectionConfig,
  updateTextConfig: state.updateTextConfig,
  setKeyPressed: state.setKeyPressed,
  resetToolConfigs: state.resetToolConfigs
}))

// 计算出的工具状态 (考虑快捷键临时切换)
export const useEffectiveTool = () => useToolStore((state) => {
  const { activeTool, isSpacePressed, isAltPressed } = state
  
  // 空格键临时切换到抓手工具
  if (isSpacePressed) {
    return 'hand'
  }
  
  // Alt键临时切换到吸管工具 (仅在笔刷/橡皮擦工具时)
  if (isAltPressed && (activeTool === 'brush' || activeTool === 'eraser')) {
    return 'eyedropper'
  }
  
  return activeTool
})
