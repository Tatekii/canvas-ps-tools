import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Point, Rectangle } from './types'

/**
 * 选区类型定义
 */
export type SelectionType = 'rectangle' | 'ellipse' | 'lasso' | 'magic-wand' | 'brush'

export interface SelectionBounds extends Rectangle {
  minX: number
  minY: number  
  maxX: number
  maxY: number
}

export interface SelectionData {
  id: string
  type: SelectionType
  layerId: string          // 所属图层ID
  bounds: SelectionBounds  // 选区边界
  mask: ImageData         // 选区遮罩 (alpha通道表示选择程度)
  area: number            // 选区面积 (像素数)
  createdAt: Date
  
  // 变换信息
  transform: {
    x: number
    y: number
    scale: number
    rotation: number
  }
}

/**
 * 蚂蚁线动画状态
 */
export interface MarchingAnts {
  enabled: boolean
  offset: number          // 动画偏移量
  speed: number           // 动画速度
  dashLength: number      // 虚线长度
  animationId?: number    // 动画ID
}

/**
 * 选区存储接口
 */
export interface SelectionStore {
  // 选区状态
  activeSelection: SelectionData | null
  selectionHistory: SelectionData[]  // 选区历史 (支持撤销)
  currentHistoryIndex: number
  
  // 蚂蚁线动画
  marchingAnts: MarchingAnts
  
  // 选区模式
  selectionMode: 'new' | 'add' | 'subtract' | 'intersect'
  
  // 选区操作
  createSelection: (
    type: SelectionType, 
    layerId: string, 
    bounds: Rectangle, 
    mask?: ImageData
  ) => string
  
  updateSelection: (selectionId: string, updates: Partial<SelectionData>) => void
  clearSelection: () => void
  deleteSelection: (selectionId: string) => void
  
  // 选区变换
  moveSelection: (deltaX: number, deltaY: number) => void
  scaleSelection: (scaleX: number, scaleY: number, center?: Point) => void
  rotateSelection: (angle: number, center?: Point) => void
  
  // 选区修改
  expandSelection: (pixels: number) => void
  contractSelection: (pixels: number) => void
  featherSelection: (radius: number) => void
  smoothSelection: (radius: number) => void
  
  // 选区组合操作
  addToSelection: (mask: ImageData, bounds: Rectangle) => void
  subtractFromSelection: (mask: ImageData, bounds: Rectangle) => void
  intersectWithSelection: (mask: ImageData, bounds: Rectangle) => void
  
  // 选区模式管理
  setSelectionMode: (mode: SelectionStore['selectionMode']) => void
  
  // 选区反选和全选
  invertSelection: () => void
  selectAll: (layerId: string) => void
  
  // 选区边界检测
  isPointInSelection: (point: Point) => boolean
  getSelectionBounds: () => Rectangle | null
  getSelectionCenter: () => Point | null
  
  // 选区历史管理
  undoSelection: () => void
  redoSelection: () => void
  canUndoSelection: () => boolean
  canRedoSelection: () => boolean
  
  // 蚂蚁线动画控制
  startMarchingAnts: () => void
  stopMarchingAnts: () => void
  updateMarchingAnts: (delta: number) => void
  
  // 选区转换
  selectionToPath: () => Path2D | null
  pathToSelection: (path: Path2D, layerId: string) => string
  
  // 选区存储和加载
  saveSelection: (name: string) => void
  loadSelection: (name: string) => void
  getSavedSelections: () => Record<string, SelectionData>
}

/**
 * 默认蚂蚁线配置
 */
const DEFAULT_MARCHING_ANTS: MarchingAnts = {
  enabled: true,
  offset: 0,
  speed: 2,        // 像素/帧
  dashLength: 6
}

/**
 * 工具函数
 */
function generateSelectionId(): string {
  return `selection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function calculateBounds(mask: ImageData): SelectionBounds {
  const { width, height, data } = mask
  let minX = width, minY = height, maxX = 0, maxY = 0
  let hasPixel = false
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha > 0) {
        hasPixel = true
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }
  
  if (!hasPixel) {
    return { x: 0, y: 0, width: 0, height: 0, minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    minX,
    minY,
    maxX,
    maxY
  }
}

function calculateArea(mask: ImageData): number {
  const { data } = mask
  let area = 0
  
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 0) {
      area += data[i] / 255 // 考虑半透明像素
    }
  }
  
  return area
}

/**
 * 选区状态存储实现
 */
export const useSelectionStore = create<SelectionStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    activeSelection: null,
    selectionHistory: [],
    currentHistoryIndex: -1,
    
    marchingAnts: { ...DEFAULT_MARCHING_ANTS },
    selectionMode: 'new',
    
    // 选区操作
    createSelection: (type, layerId, bounds, mask) => {
      const id = generateSelectionId()
      
      // 如果没有提供遮罩，根据类型和边界创建简单遮罩
      let selectionMask = mask
      if (!selectionMask) {
        const canvas = new OffscreenCanvas(bounds.width, bounds.height)
        const ctx = canvas.getContext('2d')!
        
        if (type === 'rectangle') {
          ctx.fillStyle = 'rgba(255,255,255,1)'
          ctx.fillRect(0, 0, bounds.width, bounds.height)
        } else if (type === 'ellipse') {
          ctx.fillStyle = 'rgba(255,255,255,1)'
          ctx.beginPath()
          ctx.ellipse(
            bounds.width / 2, 
            bounds.height / 2, 
            bounds.width / 2, 
            bounds.height / 2, 
            0, 0, Math.PI * 2
          )
          ctx.fill()
        }
        
        selectionMask = ctx.getImageData(0, 0, bounds.width, bounds.height)
      }
      
      const selection: SelectionData = {
        id,
        type,
        layerId,
        bounds: calculateBounds(selectionMask),
        mask: selectionMask,
        area: calculateArea(selectionMask),
        createdAt: new Date(),
        transform: {
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0
        }
      }
      
      set((state) => {
        // 添加到历史记录
        const newHistory = state.selectionHistory.slice(0, state.currentHistoryIndex + 1)
        newHistory.push(selection)
        
        return {
          activeSelection: selection,
          selectionHistory: newHistory,
          currentHistoryIndex: newHistory.length - 1
        }
      })
      
      // 启动蚂蚁线动画
      get().startMarchingAnts()
      
      return id
    },
    
    updateSelection: (selectionId, updates) => {
      set((state) => ({
        activeSelection: state.activeSelection?.id === selectionId
          ? { ...state.activeSelection, ...updates }
          : state.activeSelection
      }))
    },
    
    clearSelection: () => {
      get().stopMarchingAnts()
      set({
        activeSelection: null
      })
    },
    
    deleteSelection: (selectionId) => {
      const { activeSelection } = get()
      if (activeSelection?.id === selectionId) {
        get().clearSelection()
      }
    },
    
    // 选区变换
    moveSelection: (deltaX, deltaY) => {
      set((state) => ({
        activeSelection: state.activeSelection
          ? {
              ...state.activeSelection,
              bounds: {
                ...state.activeSelection.bounds,
                x: state.activeSelection.bounds.x + deltaX,
                y: state.activeSelection.bounds.y + deltaY,
                minX: state.activeSelection.bounds.minX + deltaX,
                minY: state.activeSelection.bounds.minY + deltaY,
                maxX: state.activeSelection.bounds.maxX + deltaX,
                maxY: state.activeSelection.bounds.maxY + deltaY
              },
              transform: {
                ...state.activeSelection.transform,
                x: state.activeSelection.transform.x + deltaX,
                y: state.activeSelection.transform.y + deltaY
              }
            }
          : null
      }))
    },
    
    scaleSelection: (scaleX, scaleY, center) => {
      // TODO: 实现选区缩放
      console.log('Selection scaling not implemented yet', { scaleX, scaleY, center })
    },
    
    rotateSelection: (angle, center) => {
      // TODO: 实现选区旋转
      console.log('Selection rotation not implemented yet', { angle, center })
    },
    
    // 选区修改
    expandSelection: (pixels) => {
      // TODO: 实现选区扩展
      console.log('Selection expansion not implemented yet', { pixels })
    },
    
    contractSelection: (pixels) => {
      // TODO: 实现选区收缩
      console.log('Selection contraction not implemented yet', { pixels })
    },
    
    featherSelection: (radius) => {
      // TODO: 实现选区羽化
      console.log('Selection feathering not implemented yet', { radius })
    },
    
    smoothSelection: (radius) => {
      // TODO: 实现选区平滑
      console.log('Selection smoothing not implemented yet', { radius })
    },
    
    // 选区组合操作
    addToSelection: (mask, bounds) => {
      // TODO: 实现添加到选区
      console.log('Add to selection not implemented yet', { mask, bounds })
    },
    
    subtractFromSelection: (mask, bounds) => {
      // TODO: 实现从选区减去
      console.log('Subtract from selection not implemented yet', { mask, bounds })
    },
    
    intersectWithSelection: (mask, bounds) => {
      // TODO: 实现与选区相交
      console.log('Intersect with selection not implemented yet', { mask, bounds })
    },
    
    // 选区模式管理
    setSelectionMode: (mode) => {
      set({ selectionMode: mode })
    },
    
    // 选区反选和全选
    invertSelection: () => {
      // TODO: 实现选区反选
      console.log('Selection inversion not implemented yet')
    },
    
    selectAll: (layerId) => {
      // TODO: 实现全选
      console.log('Select all not implemented yet', { layerId })
    },
    
    // 选区边界检测
    isPointInSelection: (point) => {
      const { activeSelection } = get()
      if (!activeSelection) return false
      
      const { bounds, mask } = activeSelection
      
      // 检查点是否在边界内
      if (point.x < bounds.x || point.x >= bounds.x + bounds.width ||
          point.y < bounds.y || point.y >= bounds.y + bounds.height) {
        return false
      }
      
      // 检查遮罩
      const localX = Math.floor(point.x - bounds.x)
      const localY = Math.floor(point.y - bounds.y)
      const index = (localY * mask.width + localX) * 4 + 3
      
      return mask.data[index] > 0
    },
    
    getSelectionBounds: () => {
      const { activeSelection } = get()
      return activeSelection ? activeSelection.bounds : null
    },
    
    getSelectionCenter: () => {
      const { activeSelection } = get()
      if (!activeSelection) return null
      
      const { bounds } = activeSelection
      return {
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2
      }
    },
    
    // 选区历史管理
    undoSelection: () => {
      set((state) => {
        if (state.currentHistoryIndex > 0) {
          const newIndex = state.currentHistoryIndex - 1
          return {
            currentHistoryIndex: newIndex,
            activeSelection: state.selectionHistory[newIndex] || null
          }
        }
        return state
      })
    },
    
    redoSelection: () => {
      set((state) => {
        if (state.currentHistoryIndex < state.selectionHistory.length - 1) {
          const newIndex = state.currentHistoryIndex + 1
          return {
            currentHistoryIndex: newIndex,
            activeSelection: state.selectionHistory[newIndex]
          }
        }
        return state
      })
    },
    
    canUndoSelection: () => {
      return get().currentHistoryIndex > 0
    },
    
    canRedoSelection: () => {
      const { currentHistoryIndex, selectionHistory } = get()
      return currentHistoryIndex < selectionHistory.length - 1
    },
    
    // 蚂蚁线动画控制
    startMarchingAnts: () => {
      const { marchingAnts } = get()
      if (!marchingAnts.enabled || marchingAnts.animationId) return
      
      const animate = () => {
        set((state) => ({
          marchingAnts: {
            ...state.marchingAnts,
            offset: (state.marchingAnts.offset + state.marchingAnts.speed) % (state.marchingAnts.dashLength * 2)
          }
        }))
        
        const newAnimationId = requestAnimationFrame(animate)
        set((state) => ({
          marchingAnts: {
            ...state.marchingAnts,
            animationId: newAnimationId
          }
        }))
      }
      
      animate()
    },
    
    stopMarchingAnts: () => {
      const { marchingAnts } = get()
      if (marchingAnts.animationId) {
        cancelAnimationFrame(marchingAnts.animationId)
        set((state) => ({
          marchingAnts: {
            ...state.marchingAnts,
            animationId: undefined,
            offset: 0
          }
        }))
      }
    },
    
    updateMarchingAnts: (delta) => {
      set((state) => ({
        marchingAnts: {
          ...state.marchingAnts,
          offset: (state.marchingAnts.offset + delta) % (state.marchingAnts.dashLength * 2)
        }
      }))
    },
    
    // 选区转换
    selectionToPath: () => {
      // TODO: 实现选区转换为路径
      console.log('Selection to path conversion not implemented yet')
      return null
    },
    
    pathToSelection: (path, layerId) => {
      // TODO: 实现路径转换为选区
      console.log('Path to selection conversion not implemented yet', { path, layerId })
      return generateSelectionId()
    },
    
    // 选区存储和加载
    saveSelection: (name) => {
      // TODO: 实现选区保存到 localStorage
      console.log('Selection saving not implemented yet', { name })
    },
    
    loadSelection: (name) => {
      // TODO: 实现从 localStorage 加载选区
      console.log('Selection loading not implemented yet', { name })
    },
    
    getSavedSelections: () => {
      // TODO: 实现获取已保存的选区列表
      return {}
    }
  }))
)

/**
 * 便捷的选择器 hooks
 */

// 获取当前选区
export const useActiveSelection = () => useSelectionStore((state) => state.activeSelection)

// 获取选区边界
export const useSelectionBounds = () => useSelectionStore((state) => 
  state.activeSelection?.bounds || null
)

// 获取蚂蚁线状态
export const useMarchingAnts = () => useSelectionStore((state) => state.marchingAnts)

// 获取选区模式
export const useSelectionMode = () => useSelectionStore((state) => state.selectionMode)

// 获取选区操作函数
export const useSelectionActions = () => useSelectionStore((state) => ({
  createSelection: state.createSelection,
  updateSelection: state.updateSelection,
  clearSelection: state.clearSelection,
  moveSelection: state.moveSelection,
  setSelectionMode: state.setSelectionMode,
  isPointInSelection: state.isPointInSelection,
  getSelectionBounds: state.getSelectionBounds,
  getSelectionCenter: state.getSelectionCenter
}))

// 获取选区历史操作
export const useSelectionHistory = () => useSelectionStore((state) => ({
  undoSelection: state.undoSelection,
  redoSelection: state.redoSelection,
  canUndoSelection: state.canUndoSelection,
  canRedoSelection: state.canRedoSelection
}))

// 获取蚂蚁线控制函数
export const useMarchingAntsControls = () => useSelectionStore((state) => ({
  startMarchingAnts: state.startMarchingAnts,
  stopMarchingAnts: state.stopMarchingAnts,
  updateMarchingAnts: state.updateMarchingAnts
}))
