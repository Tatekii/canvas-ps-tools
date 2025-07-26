import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

/**
 * 工具类型定义 - 重新设计的架构
 * 工具是基类，行为模式决定工具的具体操作
 */

// 基础工具类型 - 这些是具体的工具
export type BaseToolType = 
  | 'rectangle'      // 矩形工具 (可选择/可绘制)
  | 'ellipse'        // 椭圆工具 (可选择/可绘制)
  | 'lasso'          // 套索工具 (仅选择)
  | 'magic-wand'     // 魔棒工具 (仅选择)
  | 'brush'          // 笔刷工具 (可选择/可绘制)
  | 'eraser'         // 橡皮擦工具 (仅绘制)
  | 'text'           // 文字工具 (仅绘制)
  | 'eyedropper'     // 吸管工具 (仅取色)
  | 'hand'           // 抓手工具 (仅平移)

// 工具行为模式 - 决定工具的操作方式
export type ToolBehavior = 
  | 'select'         // 选择模式 - 创建选区
  | 'draw'           // 绘制模式 - 在图层上绘制
  | 'erase'          // 擦除模式 - 擦除像素
  | 'sample'         // 取样模式 - 获取颜色
  | 'transform'      // 变换模式 - 移动/缩放视图

// 组合的工具状态 - 工具 + 行为模式
export interface ToolState {
  tool: BaseToolType
  behavior: ToolBehavior
}

// 工具能力映射 - 定义每个工具支持的行为
export const TOOL_CAPABILITIES: Record<BaseToolType, ToolBehavior[]> = {
  'rectangle': ['select', 'draw'],      // 矩形可以选择或绘制矩形
  'ellipse': ['select', 'draw'],        // 椭圆可以选择或绘制椭圆
  'lasso': ['select'],                  // 套索只能选择
  'magic-wand': ['select'],             // 魔棒只能选择
  'brush': ['select', 'draw'],          // 笔刷可以选择或绘制
  'eraser': ['erase'],                  // 橡皮擦只能擦除
  'text': ['draw'],                     // 文字只能绘制
  'eyedropper': ['sample'],             // 吸管只能取样
  'hand': ['transform'],                // 抓手只能变换视图
}

// 便捷类型 - 向后兼容
export type SelectionToolType = Extract<BaseToolType, 'rectangle' | 'ellipse' | 'lasso' | 'magic-wand' | 'brush'>
export type DrawingToolType = Extract<BaseToolType, 'rectangle' | 'ellipse' | 'brush' | 'eraser' | 'text'>

// 工具组合的便捷函数
export const createToolState = (tool: BaseToolType, behavior?: ToolBehavior): ToolState => {
  const supportedBehaviors = TOOL_CAPABILITIES[tool]
  const finalBehavior = behavior && supportedBehaviors.includes(behavior) 
    ? behavior 
    : supportedBehaviors[0] // 默认使用第一个支持的行为
  
  return { tool, behavior: finalBehavior }
}

// 检查工具是否支持某种行为
export const toolSupports = (tool: BaseToolType, behavior: ToolBehavior): boolean => {
  return TOOL_CAPABILITIES[tool].includes(behavior)
}

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
  // 当前工具状态 - 使用新的工具状态系统
  currentTool: ToolState
  
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
  
  // 工具操作 - 重新设计的API
  setTool: (tool: BaseToolType, behavior?: ToolBehavior) => void
  setBehavior: (behavior: ToolBehavior) => void
  
  // 便捷的工具切换方法
  setSelectionTool: (tool: SelectionToolType) => void
  setDrawingTool: (tool: DrawingToolType) => void
  
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
    // 初始状态 - 使用新的工具状态系统
    currentTool: createToolState('rectangle', 'select'), // 默认矩形选择工具
    
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
    
    // 工具操作 - 重新设计的API
    setTool: (tool: BaseToolType, behavior?: ToolBehavior) => {
      const newToolState = createToolState(tool, behavior)
      set({ currentTool: newToolState })
    },
    
    setBehavior: (behavior: ToolBehavior) => {
      const { currentTool } = get()
      if (toolSupports(currentTool.tool, behavior)) {
        set({ 
          currentTool: { ...currentTool, behavior } 
        })
      } else {
        console.warn(`Tool ${currentTool.tool} does not support behavior ${behavior}`)
      }
    },
    
    // 便捷的工具切换方法
    setSelectionTool: (tool: SelectionToolType) => {
      const newToolState = createToolState(tool, 'select')
      set({ currentTool: newToolState })
    },
    
    setDrawingTool: (tool: DrawingToolType) => {
      const newToolState = createToolState(tool, 'draw')
      set({ currentTool: newToolState })
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
 * 便捷的选择器 hooks - 重新设计的API
 */

// 获取当前工具状态
export const useCurrentTool = () => useToolStore((state) => state.currentTool)

// 获取当前工具 (向后兼容)
export const useActiveTool = () => useToolStore((state) => state.currentTool.tool)

// 获取当前行为 
export const useCurrentBehavior = () => useToolStore((state) => state.currentTool.behavior)

// 获取当前选择工具 (向后兼容) - 仅当行为是选择时
export const useActiveSelectionTool = () => useToolStore((state) => {
  const { currentTool } = state
  if (currentTool.behavior === 'select') {
    return currentTool.tool as SelectionToolType
  }
  return 'rectangle' // 默认值
})

// 获取工具配置
export const useBrushConfig = () => useToolStore((state) => state.brushConfig)
export const useEraserConfig = () => useToolStore((state) => state.eraserConfig)
export const useSelectionConfig = () => useToolStore((state) => state.selectionConfig)
export const useTextConfig = () => useToolStore((state) => state.textConfig)

// Individual keyboard state hooks for stable references
export const useIsSpacePressed = () => useToolStore((state) => state.isSpacePressed)
export const useIsAltPressed = () => useToolStore((state) => state.isAltPressed)
export const useIsShiftPressed = () => useToolStore((state) => state.isShiftPressed)
export const useIsCtrlPressed = () => useToolStore((state) => state.isCtrlPressed)

// Individual tool action hooks for stable references - 重新设计的API
export const useSetTool = () => useToolStore((state) => state.setTool)
export const useSetBehavior = () => useToolStore((state) => state.setBehavior)
export const useSetSelectionTool = () => useToolStore((state) => state.setSelectionTool)
export const useSetDrawingTool = () => useToolStore((state) => state.setDrawingTool)

// 向后兼容的hooks
export const useSetActiveTool = () => useToolStore((state) => state.setTool)
export const useSetActiveSelectionTool = () => useToolStore((state) => state.setSelectionTool)

export const useUpdateBrushConfig = () => useToolStore((state) => state.updateBrushConfig)
export const useUpdateEraserConfig = () => useToolStore((state) => state.updateEraserConfig)
export const useUpdateSelectionConfig = () => useToolStore((state) => state.updateSelectionConfig)
export const useUpdateTextConfig = () => useToolStore((state) => state.updateTextConfig)
export const useSetKeyPressed = () => useToolStore((state) => state.setKeyPressed)
export const useResetToolConfigs = () => useToolStore((state) => state.resetToolConfigs)

// 计算出的工具状态 (考虑快捷键临时切换)
export const useEffectiveTool = () => useToolStore((state) => {
  const { currentTool, isSpacePressed, isAltPressed } = state
  
  // 空格键临时切换到抓手工具
  if (isSpacePressed) {
    return createToolState('hand', 'transform')
  }
  
  // Alt键临时切换到吸管工具 (仅在笔刷/橡皮擦工具时)
  if (isAltPressed && (currentTool.tool === 'brush' || currentTool.tool === 'eraser')) {
    return createToolState('eyedropper', 'sample')
  }
  
  return currentTool
})

// 合并的工具操作 hooks - 重新设计的API
export const useToolActions = () => {
  const setTool = useToolStore((state) => state.setTool)
  const setBehavior = useToolStore((state) => state.setBehavior)
  const setSelectionTool = useToolStore((state) => state.setSelectionTool)
  const setDrawingTool = useToolStore((state) => state.setDrawingTool)
  const updateBrushConfig = useToolStore((state) => state.updateBrushConfig)
  const updateEraserConfig = useToolStore((state) => state.updateEraserConfig)
  const updateSelectionConfig = useToolStore((state) => state.updateSelectionConfig)
  const updateTextConfig = useToolStore((state) => state.updateTextConfig)
  const setKeyPressed = useToolStore((state) => state.setKeyPressed)
  const resetToolConfigs = useToolStore((state) => state.resetToolConfigs)
  
  return {
    // 新的API
    setTool,
    setBehavior,
    setSelectionTool,
    setDrawingTool,
    // 向后兼容的方法
    setActiveTool: setTool,
    setActiveSelectionTool: setSelectionTool,
    // 配置方法
    updateBrushConfig,
    updateEraserConfig,
    updateSelectionConfig,
    updateTextConfig,
    setKeyPressed,
    resetToolConfigs
  }
}
