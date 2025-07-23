import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { PreviewData } from '../components/KonvaToolPreview'

/**
 * 图像和画布状态存储接口
 */
export interface ImageCanvasStore {
  // 图像状态
  image: HTMLImageElement | null
  imageDimensions: { width: number; height: number } | null
  
  // 画布状态
  centeredPosition: { x: number; y: number } | null
  
  // 预览数据
  previewData: PreviewData | null
  
  // 设置方法
  setImage: (image: HTMLImageElement | null) => void
  setImageDimensions: (dimensions: { width: number; height: number } | null) => void
  setCenteredPosition: (position: { x: number; y: number } | null) => void
  setPreviewData: (data: PreviewData | null) => void
  
  // 清理方法
  clearImageData: () => void
}

/**
 * 图像和画布状态存储实现
 */
export const useImageCanvasStore = create<ImageCanvasStore>()(
  subscribeWithSelector((set) => ({
    // 初始状态
    image: null,
    imageDimensions: null,
    centeredPosition: null,
    previewData: null,
    
    // 设置方法
    setImage: (image) => set({ image }),
    setImageDimensions: (dimensions) => set({ imageDimensions: dimensions }),
    setCenteredPosition: (position) => set({ centeredPosition: position }),
    setPreviewData: (data) => set({ previewData: data }),
    
    // 清理方法
    clearImageData: () => set({
      image: null,
      imageDimensions: null,
      centeredPosition: null,
      previewData: null
    })
  }))
)

// Individual state selectors for stable references
export const useImage = () => useImageCanvasStore((state) => state.image)
export const useImageDimensions = () => useImageCanvasStore((state) => state.imageDimensions)
export const useCenteredPosition = () => useImageCanvasStore((state) => state.centeredPosition)
export const usePreviewData = () => useImageCanvasStore((state) => state.previewData)

// Action selectors
export const useSetImage = () => useImageCanvasStore((state) => state.setImage)
export const useSetImageDimensions = () => useImageCanvasStore((state) => state.setImageDimensions)
export const useSetCenteredPosition = () => useImageCanvasStore((state) => state.setCenteredPosition)
export const useSetPreviewData = () => useImageCanvasStore((state) => state.setPreviewData)
export const useClearImageData = () => useImageCanvasStore((state) => state.clearImageData)
