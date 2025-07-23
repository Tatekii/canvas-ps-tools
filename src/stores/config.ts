import { CanvasConfig } from './types'

/**
 * 画布配置常量 - 为多图层虚拟无限画布设计
 */
export const CANVAS_CONFIG: CanvasConfig = {
  // 视口配置 - 用户看到的固定窗口
  viewport: {
    width: 1080,        // 视口宽度
    height: 768,        // 视口高度
    minScale: 0.1,      // 最小缩放
    maxScale: 5.0,      // 最大缩放
    scaleStep: 1.2,     // 缩放步长
  },
  
  // 工作区配置 - 虚拟的无限画布空间
  workspace: {
    width: 16000,       // 工作区宽度 (足够大支持多图片)
    height: 16000,      // 工作区高度
    backgroundColor: '#f0f0f0', // 工作区背景色
  },
  
  // 单个图片限制 - 比工作区小但比视口大
  image: {
    maxWidth: 8000,     // 单个图片最大显示宽度
    maxHeight: 8000,    // 单个图片最大显示高度
    maxFileSize: 10 * 1024 * 1024, // 10MB 文件大小限制
    supportedTypes: [   // 支持的文件类型
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp'
    ]
  },
  
  // 性能配置
  performance: {
    maxLayers: 50,      // 最大图层数量
    previewQuality: 0.5, // 预览质量 (0-1)
    renderThrottle: 16, // 渲染节流时间 (60fps)
  }
}

/**
 * 默认图层变换
 */
export const DEFAULT_TRANSFORM = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0
}

/**
 * 默认视口状态 - 居中在工作区
 */
export const DEFAULT_VIEWPORT = {
  width: CANVAS_CONFIG.viewport.width,
  height: CANVAS_CONFIG.viewport.height,
  x: (CANVAS_CONFIG.workspace.width - CANVAS_CONFIG.viewport.width) / 2,
  y: (CANVAS_CONFIG.workspace.height - CANVAS_CONFIG.viewport.height) / 2,
  scale: 1
}

/**
 * 默认工作区状态
 */
export const DEFAULT_WORKSPACE = {
  width: CANVAS_CONFIG.workspace.width,
  height: CANVAS_CONFIG.workspace.height,
  backgroundColor: CANVAS_CONFIG.workspace.backgroundColor,
  gridVisible: false,
  gridSize: 20,
  snapToGrid: false
}

/**
 * 图层ID生成器
 */
export const generateLayerId = (): string => {
  return `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 选区ID生成器
 */
export const generateSelectionId = (): string => {
  return `selection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 工具预览ID生成器
 */
export const generatePreviewId = (): string => {
  return `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 计算图片在工作区中的居中位置
 */
export const getCenteredPositionInWorkspace = (
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } => {
  return {
    x: (CANVAS_CONFIG.workspace.width - imageWidth) / 2,
    y: (CANVAS_CONFIG.workspace.height - imageHeight) / 2
  }
}

/**
 * 检查文件类型是否支持
 */
export const isSupportedImageType = (fileType: string): boolean => {
  return CANVAS_CONFIG.image.supportedTypes.includes(fileType)
}

/**
 * 检查文件大小是否符合限制
 */
export const isValidFileSize = (fileSize: number): boolean => {
  return fileSize <= CANVAS_CONFIG.image.maxFileSize
}
