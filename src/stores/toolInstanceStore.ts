import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { MagicWandTool } from '../utils/MagicWandTool'
import { LassoTool } from '../utils/LassoTool'
import { RectangleSelectionTool } from '../utils/RectangleSelectionTool'
import { EllipseSelectionTool } from '../utils/EllipseSelectionTool'
import { BrushSelectionTool } from '../utils/BrushSelectionTool'
import { SelectionManager } from '../utils/SelectionManager'
import { PreviewData } from '../components/KonvaToolPreview'

/**
 * 工具实例存储接口
 * 管理各种选择工具的实例，这些工具需要依赖 canvas 和 selectionManager
 */
export interface ToolInstanceStore {
  // 工具实例
  magicWandTool: MagicWandTool | null
  lassoTool: LassoTool | null
  rectangleTool: RectangleSelectionTool | null
  ellipseTool: EllipseSelectionTool | null
  brushTool: BrushSelectionTool | null
  
  // 依赖项
  hiddenCanvas: HTMLCanvasElement | null
  selectionManager: SelectionManager | null
  
  // 初始化工具实例
  initializeTools: (
    hiddenCanvas: HTMLCanvasElement, 
    selectionManager: SelectionManager,
    tolerance: number,
    setPreviewData: (data: PreviewData | null) => void
  ) => void
  
  // 清理工具实例
  clearTools: () => void
  
  // 设置单个依赖项
  setHiddenCanvas: (canvas: HTMLCanvasElement | null) => void
  setSelectionManager: (manager: SelectionManager | null) => void
}

/**
 * 工具实例存储实现
 */
export const useToolInstanceStore = create<ToolInstanceStore>()(
  subscribeWithSelector((set) => ({
    // 初始状态
    magicWandTool: null,
    lassoTool: null,
    rectangleTool: null,
    ellipseTool: null,
    brushTool: null,
    hiddenCanvas: null,
    selectionManager: null,
    
    // 初始化所有工具实例
    initializeTools: (hiddenCanvas: HTMLCanvasElement, selectionManager: SelectionManager, tolerance: number, setPreviewData: (data: PreviewData | null) => void) => {
      
      // 创建预览回调函数
      const lassoPreviewCallback = (points: [number, number][], isDrawing: boolean) => {
        if (isDrawing && points.length > 0) {
          setPreviewData({
            type: "lasso",
            data: {
              points,
              isDrawing,
            },
          })
        } else {
          setPreviewData(null)
        }
      }

      const rectanglePreviewCallback = (
        startX: number,
        startY: number,
        endX: number,
        endY: number,
        isDrawing: boolean
      ) => {
        if (isDrawing) {
          setPreviewData({
            type: "rectangle",
            data: {
              startX,
              startY,
              endX,
              endY,
              isDrawing,
            },
          })
        } else {
          setPreviewData(null)
        }
      }

      const ellipsePreviewCallback = (
        centerX: number,
        centerY: number,
        radiusX: number,
        radiusY: number,
        isDrawing: boolean
      ) => {
        if (isDrawing) {
          setPreviewData({
            type: "ellipse",
            data: {
              centerX,
              centerY,
              radiusX,
              radiusY,
              isDrawing,
            },
          })
        } else {
          setPreviewData(null)
        }
      }

      const brushPreviewCallback = (points: [number, number][], brushSize: number, isDrawing: boolean) => {
        if (isDrawing) {
          setPreviewData({
            type: "brush",
            data: {
              points,
              brushSize,
              isDrawing,
            },
          })
        } else {
          setPreviewData(null)
        }
      }

      set({
        hiddenCanvas,
        selectionManager,
        magicWandTool: new MagicWandTool(hiddenCanvas, selectionManager, tolerance),
        lassoTool: new LassoTool(hiddenCanvas, selectionManager, lassoPreviewCallback),
        rectangleTool: new RectangleSelectionTool(hiddenCanvas, selectionManager, rectanglePreviewCallback),
        ellipseTool: new EllipseSelectionTool(hiddenCanvas, selectionManager, ellipsePreviewCallback),
        brushTool: new BrushSelectionTool(hiddenCanvas, selectionManager, brushPreviewCallback)
      })
    },
    
    // 清理所有工具实例
    clearTools: () => {
      set({
        magicWandTool: null,
        lassoTool: null,
        rectangleTool: null,
        ellipseTool: null,
        brushTool: null,
        hiddenCanvas: null,
        selectionManager: null
      })
    },
    
    // 设置单个依赖项
    setHiddenCanvas: (canvas) => set({ hiddenCanvas: canvas }),
    setSelectionManager: (manager) => set({ selectionManager: manager })
  }))
)

// Individual tool instance selectors for stable references
export const useMagicWandTool = () => useToolInstanceStore((state) => state.magicWandTool)
export const useLassoTool = () => useToolInstanceStore((state) => state.lassoTool)
export const useRectangleTool = () => useToolInstanceStore((state) => state.rectangleTool)
export const useEllipseTool = () => useToolInstanceStore((state) => state.ellipseTool)
export const useBrushTool = () => useToolInstanceStore((state) => state.brushTool)

// Dependency selectors
export const useHiddenCanvas = () => useToolInstanceStore((state) => state.hiddenCanvas)
export const useSelectionManagerFromStore = () => useToolInstanceStore((state) => state.selectionManager)

// Action selectors
export const useInitializeTools = () => useToolInstanceStore((state) => state.initializeTools)
export const useClearTools = () => useToolInstanceStore((state) => state.clearTools)
export const useSetHiddenCanvas = () => useToolInstanceStore((state) => state.setHiddenCanvas)
export const useSetSelectionManager = () => useToolInstanceStore((state) => state.setSelectionManager)
