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
  useTransformPoint,
  useGetViewportBounds,
  useIsPointInViewport,
  useZoomControls,
  usePanControls,
  useSetStageRef,
  useSetReady,
  usePanTo,
  usePanBy,
  useCenterView,
  useUpdateViewportTransform,
  useWorkspaceActions
} from './canvasStore'

// 便捷 hooks 导出 - 图层相关（核心功能）
export {
  useLayers,
  useActiveLayer,
  useActiveLayerId,
  useVisibleLayers,
  // 工具专用数据访问
  useActiveLayerForTools,
  useGetPixelColor,
  useGetCompositePixelColor,
  // 图层操作
  useAddLayer,
  useRemoveLayer,
  useDuplicateLayer,
  useSetActiveLayer,
  useUpdateLayerTransform,
  useUpdateLayerOpacity,
  useUpdateLayerVisibility,
  useRenameLayer,
  // 图层堆叠顺序
  useMoveLayerUp,
  useMoveLayerDown,
  useMoveLayerToTop,
  useMoveLayerToBottom,
  useMoveLayerToIndex,
  useReorderLayers
} from './layerStore'

// 便捷 hooks 导出 - 工具相关
export {
  // 新的工具系统导出
  useCurrentTool,
  useActiveTool,
  useCurrentBehavior,
  useActiveSelectionTool,
  useEffectiveTool,
  // 配置相关
  useBrushConfig,
  useEraserConfig,
  useSelectionConfig,
  useTextConfig,
  // 键盘状态
  useIsSpacePressed,
  useIsAltPressed,
  useIsShiftPressed,
  useIsCtrlPressed,
  // 操作方法
  useSetTool,
  useSetBehavior,
  useSetSelectionTool,
  useSetDrawingTool,
  useSetActiveTool,
  useSetActiveSelectionTool,
  useUpdateBrushConfig,
  useUpdateEraserConfig,
  useUpdateSelectionConfig,
  useUpdateTextConfig,
  useSetKeyPressed,
  useResetToolConfigs,
  useToolActions,
  // 类型导出
  type BaseToolType,
  type ToolBehavior,
  type ToolState,
  type SelectionToolType,
  type DrawingToolType,
  TOOL_CAPABILITIES,
  createToolState,
  toolSupports
} from './toolStore'

// 便捷 hooks 导出 - 选区相关
export {
  useActiveSelection,
  useSelectionBounds,
  useMarchingAnts,
  useSelectionMode,
  useSelectionActions,
  useSelectionHistory
} from './selectionStore'

// 工具配置类型导出（避免重复）
export type {
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
