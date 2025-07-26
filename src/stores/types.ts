/**
 * 核心类型定义 - 为多图层虚拟无限画布设计
 */

// 图层变换矩阵
export interface Transform {
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number // 弧度
}

// 图层混合模式
export type BlendMode = 
  | 'normal'
  | 'multiply' 
  | 'screen'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'color-dodge'
  | 'color-burn'
  | 'darken'
  | 'lighten'
  | 'difference'
  | 'exclusion'

// 图层类型
export type LayerType = 'image' | 'shape' | 'text' | 'adjustment'

// Alpha 通道数据 - 用于保存选区为通道
export interface AlphaChannel {
  id: string
  name: string
  mask: ImageData // 通道遮罩数据
  createdAt: Date
}

// 图片图层数据
export interface ImageLayer {
  // 基础信息
  id: string
  name: string
  
  // 图片数据
  imageData: ImageData
  
  // 变换属性
  transform: {
    x: number
    y: number
    scale: number
    rotation: number
  }
  
  // 显示属性
  visible: boolean
  opacity: number // 0-1
  blendMode: BlendMode
  locked: boolean
  // 移除 zIndex - 使用数组索引作为图层顺序
  
  // 尺寸信息 (基于原始图片计算)
  originalWidth: number
  originalHeight: number
  displayWidth: number  // 考虑最大尺寸限制后的显示尺寸
  displayHeight: number
  
  // 元数据
  createdAt: Date
  updatedAt: Date
}

// 选区数据 - 全局唯一的选区，不属于特定图层
export interface SelectionData {
  id: string
  type: 'rectangle' | 'ellipse' | 'lasso' | 'magic-wand' | 'brush'
  mask: ImageData // 选区遮罩 (alpha通道表示选择程度)
  bounds: {
    x: number
    y: number
    width: number
    height: number
    minX: number
    minY: number
    maxX: number
    maxY: number
  }
  area: number // 选区面积 (像素数)
  createdAt: Date
  
  // 变换信息
  transform: {
    x: number
    y: number
    scale: number
    rotation: number
  }
}

// 视口配置 - 用户看到的固定窗口
export interface Viewport {
  width: number      // 视口宽度
  height: number     // 视口高度
  x: number          // 视口在工作区中的位置
  y: number
  scale: number      // 视口缩放级别
}

// 工作区配置 - 有边界的工作空间，支持动态扩展
export interface Workspace {
  bounds: Rectangle      // 当前工作区边界
  backgroundColor: string // 背景色
  gridVisible: boolean    // 是否显示网格
  gridSize: number        // 网格大小
  snapToGrid: boolean     // 是否吸附到网格
  autoExpand: boolean     // 是否自动扩展工作区
}

// 工作区尺寸定义
export interface WorkspaceSize {
  width: number
  height: number
}

// 工具预览数据
export interface ToolPreviewData {
  id: string
  type: 'lasso' | 'rectangle' | 'ellipse' | 'brush' | 'magic-wand'
  data: Record<string, unknown> // 具体的预览数据，根据工具类型而定
  layerId: string // 预览所在的图层
}

// 画布配置常量
export interface CanvasConfig {
  // 视口配置
  viewport: {
    width: number        // 视口宽度
    height: number       // 视口高度
    minScale: number     // 最小缩放
    maxScale: number     // 最大缩放
    scaleStep: number    // 缩放步长
    panSpeed: number     // 平移速度
    wheelZoomSpeed: number // 滚轮缩放速度
    boundaryPadding: number // 边界外的可平移距离
  }
  
  // 工作区配置
  workspace: {
    defaultSize: WorkspaceSize    // 默认工作区尺寸
    maxSize: WorkspaceSize        // 最大工作区尺寸
    minSize: WorkspaceSize        // 最小工作区尺寸
    backgroundColor: string       // 背景色
    autoExpand: boolean          // 是否自动扩展
    expandPadding: number        // 扩展时的边距
    gridSize: number             // 网格大小
    snapToGrid: boolean          // 是否吸附网格
  }
  
  // 图片限制
  image: {
    maxWidth: number     // 8000 - 单个图片的最大显示宽度
    maxHeight: number    // 8000 - 单个图片的最大显示高度
    maxFileSize: number  // 10MB - 文件大小限制
    supportedTypes: string[] // 支持的文件类型
  }
  
  // 性能配置
  performance: {
    maxLayers: number    // 50 - 最大图层数量
    previewQuality: number // 0.5 - 预览质量
    renderThrottle: number // 16ms - 渲染节流时间
  }
}

// 历史记录项 (为撤销重做功能预留)
export interface HistoryItem {
  id: string
  action: string
  layerId?: string
  timestamp: Date
  data: Record<string, unknown> // 操作相关的数据
}

// 坐标系统类型
export type CoordinateSystem = 'viewport' | 'workspace' | 'layer'

// 坐标点
export interface Point {
  x: number
  y: number
}

// 矩形区域
export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

// 图层创建选项
export interface LayerCreateOptions {
  name?: string
  transform?: {
    x?: number
    y?: number
    scale?: number
    rotation?: number
  }
  opacity?: number
  blendMode?: BlendMode
  visible?: boolean
  locked?: boolean
  // 移除 zIndex - 新图层将添加到顶部（数组末尾）
}

// 图层存储接口
export interface LayerStore {
  // 状态
  layers: ImageLayer[]
  activeLayerId: string | null
  layerIdCounter: number
  
  // 图层基础操作
  addLayer: (imageData: ImageData, options?: LayerCreateOptions) => string
  removeLayer: (layerId: string) => boolean
  duplicateLayer: (layerId: string) => string | null
  
  // 图层初始化
  initializeWithDefaultLayer: () => Promise<void>
  addLayerFromFile: (file: File) => Promise<string>
  
  // 图层属性更新
  updateLayerTransform: (layerId: string, transform: Partial<ImageLayer['transform']>) => void
  updateLayerOpacity: (layerId: string, opacity: number) => void
  updateLayerBlendMode: (layerId: string, blendMode: BlendMode) => void
  updateLayerVisibility: (layerId: string, visible: boolean) => void
  updateLayerLock: (layerId: string, locked: boolean) => void
  renameLayer: (layerId: string, name: string) => void
  
  // 图层选择
  setActiveLayer: (layerId: string) => void
  selectNextLayer: () => void
  selectPreviousLayer: () => void
  
  // 图层排序
  moveLayerUp: (layerId: string) => boolean
  moveLayerDown: (layerId: string) => boolean
  moveLayerToTop: (layerId: string) => boolean
  moveLayerToBottom: (layerId: string) => boolean
  moveLayer: (layerId: string, targetLayerId: string) => boolean
  reorderLayers: () => void
  
  // 图层查询
  getLayerById: (layerId: string) => ImageLayer | null
  getActiveLayer: () => ImageLayer | null
  getVisibleLayers: () => ImageLayer[]
  // 移除 getLayersByZIndex - 直接使用 layers 数组即可（索引越大层级越高）
  
  // 图层合并
  mergeLayers: (layerIds: string[]) => string | null
  flattenAllLayers: () => string | null
  
  // 批量操作
  showAllLayers: () => void
  hideAllLayers: () => void
  lockAllLayers: () => void
  unlockAllLayers: () => void
  
  // 清空操作
  clearAllLayers: () => void
}
