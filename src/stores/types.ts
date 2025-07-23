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
  zIndex: number // 图层在层级中的顺序 (越大越在上层)
  
  // 尺寸信息 (基于原始图片计算)
  originalWidth: number
  originalHeight: number
  displayWidth: number  // 考虑最大尺寸限制后的显示尺寸
  displayHeight: number
  
  // 元数据
  createdAt: Date
  updatedAt: Date
}

// 选区数据
export interface SelectionData {
  id: string
  layerId: string // 所属图层ID
  imageData: ImageData
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  area: number // 选区面积
  createdAt: Date
}

// 视口配置 - 用户看到的固定窗口
export interface Viewport {
  width: number      // 视口宽度 (固定 1080)
  height: number     // 视口高度 (固定 768)
  x: number          // 视口在工作区中的位置
  y: number
  scale: number      // 视口缩放级别 (0.1 - 5.0)
}

// 工作区配置 - 虚拟的无限画布空间
export interface Workspace {
  width: number      // 工作区宽度 (16000)
  height: number     // 工作区高度 (16000)
  backgroundColor: string // 背景色
  gridVisible: boolean    // 是否显示网格
  gridSize: number        // 网格大小
  snapToGrid: boolean     // 是否吸附到网格
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
    width: number        // 1080
    height: number       // 768
    minScale: number     // 0.1
    maxScale: number     // 5.0
    scaleStep: number    // 1.2
  }
  
  // 工作区配置
  workspace: {
    width: number        // 16000
    height: number       // 16000
    backgroundColor: string
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
  zIndex?: number
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
  reorderLayers: () => void
  
  // 图层查询
  getLayerById: (layerId: string) => ImageLayer | null
  getActiveLayer: () => ImageLayer | null
  getVisibleLayers: () => ImageLayer[]
  getLayersByZIndex: () => ImageLayer[]
  
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
