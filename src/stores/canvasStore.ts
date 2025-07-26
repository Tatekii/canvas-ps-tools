import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import Konva from 'konva'
import { 
  Viewport, 
  Workspace, 
  Point, 
  Rectangle,
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
  setWorkspaceBounds: (bounds: Rectangle) => void
  expandWorkspace: (bounds: Rectangle) => void
  autoExpandForContent: (contentBounds: Rectangle) => void
  fitWorkspaceToContent: () => void
  resetWorkspace: () => void
  
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
        
        // Stage 通过受控属性自动更新，不需要手动同步
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
    
    setWorkspaceBounds: (bounds) =>
      set((state) => ({
        workspace: { ...state.workspace, bounds }
      })),
    
    expandWorkspace: (bounds) => {
      const { workspace } = get()
      
      // 计算新的工作区边界
      const newBounds = {
        x: Math.min(workspace.bounds.x, bounds.x),
        y: Math.min(workspace.bounds.y, bounds.y),
        width: Math.max(
          workspace.bounds.x + workspace.bounds.width, 
          bounds.x + bounds.width
        ) - Math.min(workspace.bounds.x, bounds.x),
        height: Math.max(
          workspace.bounds.y + workspace.bounds.height,
          bounds.y + bounds.height
        ) - Math.min(workspace.bounds.y, bounds.y)
      }
      
      // 限制在最大尺寸内
      newBounds.width = Math.min(newBounds.width, CANVAS_CONFIG.workspace.maxSize.width)
      newBounds.height = Math.min(newBounds.height, CANVAS_CONFIG.workspace.maxSize.height)
      
      get().setWorkspaceBounds(newBounds)
    },
    
    autoExpandForContent: (contentBounds) => {
      const { workspace } = get()
      
      if (!workspace.autoExpand) return
      
      const padding = CANVAS_CONFIG.workspace.expandPadding
      const expandedBounds = {
        x: contentBounds.x - padding,
        y: contentBounds.y - padding,
        width: contentBounds.width + padding * 2,
        height: contentBounds.height + padding * 2
      }
      
      // 检查是否需要扩展
      const needsExpansion = (
        expandedBounds.x < workspace.bounds.x ||
        expandedBounds.y < workspace.bounds.y ||
        expandedBounds.x + expandedBounds.width > workspace.bounds.x + workspace.bounds.width ||
        expandedBounds.y + expandedBounds.height > workspace.bounds.y + workspace.bounds.height
      )
      
      if (needsExpansion) {
        get().expandWorkspace(expandedBounds)
      }
    },
    
    fitWorkspaceToContent: () => {
      // 这个函数需要访问图层数据，暂时留空
      // 将在集成layerStore时实现
      console.log('fitWorkspaceToContent: 需要图层数据支持')
    },
    
    resetWorkspace: () => {
      set({ workspace: { ...DEFAULT_WORKSPACE } })
    },
    
    // Konva集成
    setStageRef: (ref) => set({ stageRef: ref }),
    setReady: (ready) => set({ isReady: ready }),
    
    // 缩放操作 - 简化为只更新 store 状态
    zoomIn: (center) => {
      const state = get()
      const { viewport } = state
      
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
      
      // 只更新状态，Stage 通过受控属性自动更新
      set((state) => ({
        viewport: {
          ...state.viewport,
          scale: newScale,
          x: newPos.x,
          y: newPos.y
        }
      }))
    },
    
    zoomOut: (center) => {
      const state = get()
      const { viewport } = state
      
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
      
      // 只更新状态，Stage 通过受控属性自动更新
      set((state) => ({
        viewport: {
          ...state.viewport,
          scale: newScale,
          x: newPos.x,
          y: newPos.y
        }
      }))
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
      const defaultViewport = { ...DEFAULT_VIEWPORT }
      set({ viewport: defaultViewport })
    },
    
    // 平移操作 - 简化为只更新 store 状态
    panTo: (point) => {
      set((state) => ({
        viewport: { ...state.viewport, x: point.x, y: point.y }
      }))
    },
    
    panBy: (delta) => {
      const { viewport } = get()
      const newPos = {
        x: viewport.x + delta.x,
        y: viewport.y + delta.y
      }
      
      set((state) => ({
        viewport: { ...state.viewport, x: newPos.x, y: newPos.y }
      }))
    },
    
    centerView: () => {
      const { workspace } = get()
      const centeredPos = {
        x: (workspace.bounds.width - CANVAS_CONFIG.viewport.width) / 2,
        y: (workspace.bounds.height - CANVAS_CONFIG.viewport.height) / 2
      }
      
      set((state) => ({
        viewport: { ...state.viewport, x: centeredPos.x, y: centeredPos.y }
      }))
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

// Individual coordinate transform hooks for stable references
export const useTransformPoint = () => useCanvasStore((state) => state.transformPoint)
export const useGetViewportBounds = () => useCanvasStore((state) => state.getViewportBounds)
export const useIsPointInViewport = () => useCanvasStore((state) => state.isPointInViewport)

// 获取缩放控制函数 - 使用稳定的选择器
export const useZoomControls = () => {
  const zoomIn = useCanvasStore((state) => state.zoomIn)
  const zoomOut = useCanvasStore((state) => state.zoomOut)
  const zoomToFit = useCanvasStore((state) => state.zoomToFit)
  const resetZoom = useCanvasStore((state) => state.resetZoom)
  const scale = useCanvasStore((state) => state.viewport.scale)
  
  return { zoomIn, zoomOut, zoomToFit, resetZoom, scale }
}

// 获取平移控制函数 - 使用稳定的选择器
export const usePanControls = () => {
  const panTo = useCanvasStore((state) => state.panTo)
  const panBy = useCanvasStore((state) => state.panBy)
  const centerView = useCanvasStore((state) => state.centerView)
  const x = useCanvasStore((state) => state.viewport.x)
  const y = useCanvasStore((state) => state.viewport.y)
  
  return { panTo, panBy, centerView, position: { x, y } }
}

// Individual action selectors for stable references
export const useSetStageRef = () => useCanvasStore((state) => state.setStageRef)
export const useSetReady = () => useCanvasStore((state) => state.setReady)
export const usePanTo = () => useCanvasStore((state) => state.panTo)
export const usePanBy = () => useCanvasStore((state) => state.panBy)
export const useCenterView = () => useCanvasStore((state) => state.centerView)
export const useUpdateViewportTransform = () => useCanvasStore((state) => state.updateViewportTransform)

// 工作区管理 hooks
export const useWorkspaceActions = () => {
  const setWorkspace = useCanvasStore((state) => state.setWorkspace)
  const setWorkspaceBounds = useCanvasStore((state) => state.setWorkspaceBounds)
  const expandWorkspace = useCanvasStore((state) => state.expandWorkspace)
  const autoExpandForContent = useCanvasStore((state) => state.autoExpandForContent)
  const fitWorkspaceToContent = useCanvasStore((state) => state.fitWorkspaceToContent)
  const resetWorkspace = useCanvasStore((state) => state.resetWorkspace)
  
  return {
    setWorkspace,
    setWorkspaceBounds,
    expandWorkspace,
    autoExpandForContent,
    fitWorkspaceToContent,
    resetWorkspace
  }
}
