import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import Konva from 'konva'
import { 
  Viewport, 
  Workspace, 
  Point, 
  CoordinateSystem 
} from './types'
import { 
  CANVAS_CONFIG, 
  DEFAULT_VIEWPORT, 
  DEFAULT_WORKSPACE 
} from './config'

/**
 * 画布状态接口 - 管理视口、工作区和坐标转换
 */
interface CanvasState {
  // 视口状态 - 用户看到的固定窗口
  viewport: Viewport
  
  // 工作区状态 - 虚拟的无限画布
  workspace: Workspace
  
  // Konva Stage 引用 (用于坐标转换和操作)
  stageRef: React.RefObject<Konva.Stage> | null
  
  // 画布就绪状态
  isReady: boolean
  
  // Actions - 视口操作
  setViewport: (viewport: Partial<Viewport>) => void
  updateViewportTransform: (transform: { x?: number; y?: number; scale?: number }) => void
  resetViewport: () => void
  
  // Actions - 工作区操作  
  setWorkspace: (workspace: Partial<Workspace>) => void
  
  // Actions - Konva集成
  setStageRef: (ref: React.RefObject<Konva.Stage>) => void
  setReady: (ready: boolean) => void
  
  // Actions - 缩放操作 (与Konva Stage同步)
  zoomIn: (center?: Point) => void
  zoomOut: (center?: Point) => void
  zoomToFit: (bounds: { width: number; height: number }) => void
  resetZoom: () => void
  
  // Actions - 平移操作
  panTo: (point: Point) => void
  panBy: (delta: Point) => void
  centerView: () => void
  
  // 坐标转换工具 (与Konva集成)
  transformPoint: (point: Point, from: CoordinateSystem, to: CoordinateSystem) => Point | null
  getViewportBounds: () => { x: number; y: number; width: number; height: number }
  isPointInViewport: (point: Point, system: CoordinateSystem) => boolean
}

/**
 * 坐标转换工具函数
 */
const createCoordinateTransformer = (
  viewport: Viewport,
  stageRef: React.RefObject<Konva.Stage> | null
) => {
  /**
   * 转换坐标点在不同坐标系之间
   */
  const transformPoint = (
    point: Point, 
    from: CoordinateSystem, 
    to: CoordinateSystem
  ): Point | null => {
    if (!stageRef?.current) return null
    
    // 如果相同坐标系，直接返回
    if (from === to) return { ...point }
    
    let result = { ...point }
    
    // 先转换到工作区坐标 (作为中间坐标系)
    if (from === 'viewport') {
      // 视口坐标 -> 工作区坐标
      // 考虑视口的位置和缩放
      result = {
        x: (point.x / viewport.scale) + viewport.x,
        y: (point.y / viewport.scale) + viewport.y
      }
    } else if (from === 'layer') {
      // 图层坐标 -> 工作区坐标 (图层坐标就是工作区坐标)
      result = { ...point }
    }
    
    // 再从工作区坐标转换到目标坐标系
    if (to === 'viewport') {
      // 工作区坐标 -> 视口坐标
      result = {
        x: (result.x - viewport.x) * viewport.scale,
        y: (result.y - viewport.y) * viewport.scale
      }
    } else if (to === 'layer') {
      // 工作区坐标 -> 图层坐标 (相同)
      result = { ...result }
    }
    
    return result
  }
  
  /**
   * 获取当前视口在工作区中的边界
   */
  const getViewportBounds = () => {
    return {
      x: viewport.x,
      y: viewport.y,
      width: viewport.width / viewport.scale,
      height: viewport.height / viewport.scale
    }
  }
  
  /**
   * 检查点是否在视口内
   */
  const isPointInViewport = (point: Point, system: CoordinateSystem): boolean => {
    if (!stageRef?.current) return false
    
    // 转换到视口坐标进行判断
    const viewportPoint = transformPoint(point, system, 'viewport')
    if (!viewportPoint) return false
    
    return (
      viewportPoint.x >= 0 && 
      viewportPoint.x <= viewport.width &&
      viewportPoint.y >= 0 && 
      viewportPoint.y <= viewport.height
    )
  }
  
  return {
    transformPoint,
    getViewportBounds,
    isPointInViewport
  }
}

/**
 * 画布状态 Store
 */
export const useCanvasStore = create<CanvasState>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    viewport: { ...DEFAULT_VIEWPORT },
    workspace: { ...DEFAULT_WORKSPACE },
    stageRef: null,
    isReady: false,
    
    // 视口操作
    setViewport: (newViewport) => 
      set((state) => ({
        viewport: { ...state.viewport, ...newViewport }
      })),
    
    updateViewportTransform: (transform) => {
      const { stageRef } = get()
      
      set((state) => {
        const newViewport = {
          ...state.viewport,
          ...transform
        }
        
        // 限制缩放范围
        if (newViewport.scale) {
          newViewport.scale = Math.max(
            CANVAS_CONFIG.viewport.minScale,
            Math.min(CANVAS_CONFIG.viewport.maxScale, newViewport.scale)
          )
        }
        
        // 同步到 Konva Stage
        if (stageRef?.current) {
          if (newViewport.scale !== undefined) {
            stageRef.current.scale({ x: newViewport.scale, y: newViewport.scale })
          }
          if (newViewport.x !== undefined || newViewport.y !== undefined) {
            stageRef.current.position({ 
              x: newViewport.x ?? state.viewport.x, 
              y: newViewport.y ?? state.viewport.y 
            })
          }
          stageRef.current.batchDraw()
        }
        
        return { viewport: newViewport }
      })
    },
    
    resetViewport: () => {
      const { stageRef } = get()
      const defaultViewport = { ...DEFAULT_VIEWPORT }
      
      set({ viewport: defaultViewport })
      
      // 同步到 Konva Stage
      if (stageRef?.current) {
        const stage = stageRef.current
        stage.scale({ x: defaultViewport.scale, y: defaultViewport.scale })
        stage.position({ x: defaultViewport.x, y: defaultViewport.y })
        stage.batchDraw()
      }
    },
    
    // 工作区操作
    setWorkspace: (newWorkspace) =>
      set((state) => ({
        workspace: { ...state.workspace, ...newWorkspace }
      })),
    
    // Konva集成
    setStageRef: (ref) => set({ stageRef: ref }),
    setReady: (ready) => set({ isReady: ready }),
    
    // 缩放操作
    zoomIn: (center) => {
      const state = get()
      const { viewport, stageRef } = state
      
      if (!stageRef?.current) return
      
      const scaleBy = CANVAS_CONFIG.viewport.scaleStep
      const oldScale = viewport.scale
      const newScale = Math.min(CANVAS_CONFIG.viewport.maxScale, oldScale * scaleBy)
      
      if (newScale === oldScale) return // 已达到最大缩放
      
      // 如果没有指定中心点，使用视口中心
      const zoomCenter = center || {
        x: viewport.width / 2,
        y: viewport.height / 2
      }
      
      // 计算缩放后的位置调整
      const mousePointTo = {
        x: (zoomCenter.x - viewport.x) / oldScale,
        y: (zoomCenter.y - viewport.y) / oldScale,
      }
      
      const newPos = {
        x: zoomCenter.x - mousePointTo.x * newScale,
        y: zoomCenter.y - mousePointTo.y * newScale,
      }
      
      // 更新状态
      get().updateViewportTransform({
        scale: newScale,
        x: newPos.x,
        y: newPos.y
      })
    },
    
    zoomOut: (center) => {
      const state = get()
      const { viewport, stageRef } = state
      
      if (!stageRef?.current) return
      
      const scaleBy = CANVAS_CONFIG.viewport.scaleStep
      const oldScale = viewport.scale
      const newScale = Math.max(CANVAS_CONFIG.viewport.minScale, oldScale / scaleBy)
      
      if (newScale === oldScale) return // 已达到最小缩放
      
      // 如果没有指定中心点，使用视口中心
      const zoomCenter = center || {
        x: viewport.width / 2,
        y: viewport.height / 2
      }
      
      // 计算缩放后的位置调整
      const mousePointTo = {
        x: (zoomCenter.x - viewport.x) / oldScale,
        y: (zoomCenter.y - viewport.y) / oldScale,
      }
      
      const newPos = {
        x: zoomCenter.x - mousePointTo.x * newScale,
        y: zoomCenter.y - mousePointTo.y * newScale,
      }
      
      // 更新状态
      get().updateViewportTransform({
        scale: newScale,
        x: newPos.x,
        y: newPos.y
      })
    },
    
    zoomToFit: (bounds) => {
      const { viewport } = get()
      
      // 计算合适的缩放比例
      const scaleX = viewport.width / bounds.width
      const scaleY = viewport.height / bounds.height
      const scale = Math.min(scaleX, scaleY, CANVAS_CONFIG.viewport.maxScale) * 0.9 // 留点边距
      
      // 计算居中位置
      const x = (viewport.width - bounds.width * scale) / 2
      const y = (viewport.height - bounds.height * scale) / 2
      
      get().updateViewportTransform({ scale, x, y })
    },
    
    resetZoom: () => {
      get().resetViewport()
    },
    
    // 平移操作
    panTo: (point) => {
      get().updateViewportTransform({ x: point.x, y: point.y })
    },
    
    panBy: (delta) => {
      const { viewport } = get()
      get().updateViewportTransform({
        x: viewport.x + delta.x,
        y: viewport.y + delta.y
      })
    },
    
    centerView: () => {
      const { workspace } = get()
      const centeredPos = {
        x: (workspace.width - CANVAS_CONFIG.viewport.width) / 2,
        y: (workspace.height - CANVAS_CONFIG.viewport.height) / 2
      }
      get().panTo(centeredPos)
    },
    
    // 坐标转换 (使用当前状态)
    transformPoint: (point, from, to) => {
      const { viewport, stageRef } = get()
      const transformer = createCoordinateTransformer(viewport, stageRef)
      return transformer.transformPoint(point, from, to)
    },
    
    getViewportBounds: () => {
      const { viewport, stageRef } = get()
      const transformer = createCoordinateTransformer(viewport, stageRef)
      return transformer.getViewportBounds()
    },
    
    isPointInViewport: (point, system) => {
      const { viewport, stageRef } = get()
      const transformer = createCoordinateTransformer(viewport, stageRef)
      return transformer.isPointInViewport(point, system)
    }
  }))
)

/**
 * 便捷的选择器 hooks
 */

// 获取视口状态
export const useViewport = () => useCanvasStore((state) => state.viewport)

// 获取工作区状态  
export const useWorkspace = () => useCanvasStore((state) => state.workspace)

// 获取画布就绪状态
export const useCanvasReady = () => useCanvasStore((state) => state.isReady)

// 获取坐标转换函数
export const useCoordinateTransform = () => useCanvasStore((state) => ({
  transformPoint: state.transformPoint,
  getViewportBounds: state.getViewportBounds,
  isPointInViewport: state.isPointInViewport
}))

// 获取缩放控制函数
export const useZoomControls = () => useCanvasStore((state) => ({
  zoomIn: state.zoomIn,
  zoomOut: state.zoomOut,
  zoomToFit: state.zoomToFit,
  resetZoom: state.resetZoom,
  scale: state.viewport.scale
}))

// 获取平移控制函数
export const usePanControls = () => useCanvasStore((state) => ({
  panTo: state.panTo,
  panBy: state.panBy,
  centerView: state.centerView,
  position: { x: state.viewport.x, y: state.viewport.y }
}))
