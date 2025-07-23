/**
 * Zustand 状态管理存储统一导出
 * 
 * 这个文件提供了所有状态存储的统一入口点，
 * 包括画布、图层、工具和选区管理。
 */

// 核心存储导出
export { useCanvasStore } from './canvasStore'
export { useLayerStore } from './layerStore'
export { useToolStore } from './toolStore'
export { useSelectionStore } from './selectionStore'

// 类型定义导出
export type * from './types'

// 配置常量导出
export { CANVAS_CONFIG } from './config'

// 便捷 hooks 导出 - 画布相关
export {
  useViewport,
  useWorkspace,
  useCanvasReady,
  useCoordinateTransform,
  useZoomControls,
  usePanControls
} from './canvasStore'

// 便捷 hooks 导出 - 图层相关
export {
  useLayers,
  useActiveLayer,
  useVisibleLayers,
  useLayerActions,
  useLayerReorder
} from './layerStore'

// 便捷 hooks 导出 - 工具相关
export {
  useActiveTool,
  useActiveSelectionTool,
  useBrushConfig,
  useEraserConfig,
  useSelectionConfig,
  useTextConfig,
  useKeyboardState,
  useToolActions,
  useEffectiveTool
} from './toolStore'

// 便捷 hooks 导出 - 选区相关
export {
  useActiveSelection,
  useSelectionBounds,
  useMarchingAnts,
  useSelectionMode,
  useSelectionActions,
  useSelectionHistory,
  useMarchingAntsControls
} from './selectionStore'

// 工具类型导出
export type {
  ToolType,
  SelectionToolType,
  BrushToolConfig,
  EraserToolConfig,
  SelectionToolConfig,
  TextToolConfig
} from './toolStore'

export type {
  SelectionType,
  SelectionBounds,
  SelectionData as SelectionStoreData,
  MarchingAnts
} from './selectionStore'
