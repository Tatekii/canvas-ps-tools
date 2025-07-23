import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { ImageLayer, LayerStore, LayerCreateOptions, BlendMode } from './types'

/**
 * 图层管理状态存储
 * 处理多图层的创建、删除、排序、可见性等操作
 */
export const useLayerStore = create<LayerStore>()(
  subscribeWithSelector((set, get) => ({
    // 状态
    layers: [],
    activeLayerId: null,
    layerIdCounter: 0,
    
    // 图层基础操作
    addLayer: (imageData: ImageData, options: LayerCreateOptions = {}) => {
      const { layerIdCounter } = get()
      const id = `layer_${layerIdCounter}`
      
      // 从 ImageData 获取尺寸信息
      const originalWidth = imageData.width
      const originalHeight = imageData.height
      
      // 创建新图层
      const newLayer: ImageLayer = {
        id,
        name: options.name || `Layer ${layerIdCounter + 1}`,
        imageData,
        transform: {
          x: options.transform?.x ?? 0,
          y: options.transform?.y ?? 0,
          scale: options.transform?.scale ?? 1,
          rotation: options.transform?.rotation ?? 0
        },
        opacity: options.opacity ?? 1,
        blendMode: options.blendMode || 'normal',
        visible: options.visible ?? true,
        locked: options.locked ?? false,
        zIndex: options.zIndex ?? get().layers.length,
        originalWidth,
        originalHeight,
        displayWidth: originalWidth,
        displayHeight: originalHeight,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      set((state) => ({
        layers: [...state.layers, newLayer],
        layerIdCounter: state.layerIdCounter + 1,
        activeLayerId: newLayer.id // 新添加的图层自动成为活动图层
      }))
      
      return newLayer.id
    },
    
    removeLayer: (layerId: string) => {
      const { layers, activeLayerId } = get()
      
      if (layers.length <= 1) {
        console.warn('Cannot remove the last layer')
        return false
      }
      
      const layerIndex = layers.findIndex(layer => layer.id === layerId)
      if (layerIndex === -1) return false
      
      const newLayers = layers.filter(layer => layer.id !== layerId)
      
      // 如果删除的是活动图层，选择新的活动图层
      let newActiveLayerId = activeLayerId
      if (activeLayerId === layerId) {
        // 优先选择删除图层下方的图层，如果没有则选择上方的
        const nextIndex = Math.min(layerIndex, newLayers.length - 1)
        newActiveLayerId = newLayers[nextIndex]?.id || null
      }
      
      set({
        layers: newLayers,
        activeLayerId: newActiveLayerId
      })
      
      return true
    },
    
    duplicateLayer: (layerId: string) => {
      const { layers } = get()
      const sourceLayer = layers.find(layer => layer.id === layerId)
      if (!sourceLayer) return null
      
      // 创建图层副本
      const duplicatedLayerId = get().addLayer(sourceLayer.imageData, {
        name: `${sourceLayer.name} copy`,
        transform: { ...sourceLayer.transform },
        opacity: sourceLayer.opacity,
        blendMode: sourceLayer.blendMode,
        visible: sourceLayer.visible,
        locked: false, // 副本默认不锁定
        zIndex: sourceLayer.zIndex + 1
      })
      
      // 调整其他图层的 z-index
      get().reorderLayers()
      
      return duplicatedLayerId
    },
    
    // 图层属性更新
    updateLayerTransform: (layerId: string, transform: Partial<ImageLayer['transform']>) => {
      set((state) => ({
        layers: state.layers.map(layer =>
          layer.id === layerId
            ? { ...layer, transform: { ...layer.transform, ...transform } }
            : layer
        )
      }))
    },
    
    updateLayerOpacity: (layerId: string, opacity: number) => {
      const clampedOpacity = Math.max(0, Math.min(1, opacity))
      set((state) => ({
        layers: state.layers.map(layer =>
          layer.id === layerId
            ? { ...layer, opacity: clampedOpacity }
            : layer
        )
      }))
    },
    
    updateLayerBlendMode: (layerId: string, blendMode: BlendMode) => {
      set((state) => ({
        layers: state.layers.map(layer =>
          layer.id === layerId
            ? { ...layer, blendMode }
            : layer
        )
      }))
    },
    
    updateLayerVisibility: (layerId: string, visible: boolean) => {
      set((state) => ({
        layers: state.layers.map(layer =>
          layer.id === layerId
            ? { ...layer, visible }
            : layer
        )
      }))
    },
    
    updateLayerLock: (layerId: string, locked: boolean) => {
      set((state) => ({
        layers: state.layers.map(layer =>
          layer.id === layerId
            ? { ...layer, locked }
            : layer
        )
      }))
    },
    
    renameLayer: (layerId: string, name: string) => {
      set((state) => ({
        layers: state.layers.map(layer =>
          layer.id === layerId
            ? { ...layer, name }
            : layer
        )
      }))
    },
    
    // 图层选择
    setActiveLayer: (layerId: string) => {
      const { layers } = get()
      const layer = layers.find(l => l.id === layerId)
      if (layer && !layer.locked) {
        set({ activeLayerId: layerId })
      }
    },
    
    selectNextLayer: () => {
      const { layers, activeLayerId } = get()
      if (!activeLayerId) return
      
      const currentIndex = layers.findIndex(layer => layer.id === activeLayerId)
      const nextIndex = (currentIndex + 1) % layers.length
      const nextLayer = layers[nextIndex]
      
      if (nextLayer && !nextLayer.locked) {
        set({ activeLayerId: nextLayer.id })
      }
    },
    
    selectPreviousLayer: () => {
      const { layers, activeLayerId } = get()
      if (!activeLayerId) return
      
      const currentIndex = layers.findIndex(layer => layer.id === activeLayerId)
      const prevIndex = currentIndex === 0 ? layers.length - 1 : currentIndex - 1
      const prevLayer = layers[prevIndex]
      
      if (prevLayer && !prevLayer.locked) {
        set({ activeLayerId: prevLayer.id })
      }
    },
    
    // 图层排序
    moveLayerUp: (layerId: string) => {
      const { layers } = get()
      const layerIndex = layers.findIndex(layer => layer.id === layerId)
      if (layerIndex === -1 || layerIndex === layers.length - 1) return false
      
      const newLayers = [...layers]
      const [movedLayer] = newLayers.splice(layerIndex, 1)
      newLayers.splice(layerIndex + 1, 0, movedLayer)
      
      // 更新 z-index
      newLayers.forEach((layer, index) => {
        layer.zIndex = index
      })
      
      set({ layers: newLayers })
      return true
    },
    
    moveLayerDown: (layerId: string) => {
      const { layers } = get()
      const layerIndex = layers.findIndex(layer => layer.id === layerId)
      if (layerIndex <= 0) return false
      
      const newLayers = [...layers]
      const [movedLayer] = newLayers.splice(layerIndex, 1)
      newLayers.splice(layerIndex - 1, 0, movedLayer)
      
      // 更新 z-index
      newLayers.forEach((layer, index) => {
        layer.zIndex = index
      })
      
      set({ layers: newLayers })
      return true
    },
    
    moveLayerToTop: (layerId: string) => {
      const { layers } = get()
      const layerIndex = layers.findIndex(layer => layer.id === layerId)
      if (layerIndex === -1 || layerIndex === layers.length - 1) return false
      
      const newLayers = [...layers]
      const [movedLayer] = newLayers.splice(layerIndex, 1)
      newLayers.push(movedLayer)
      
      // 更新 z-index
      newLayers.forEach((layer, index) => {
        layer.zIndex = index
      })
      
      set({ layers: newLayers })
      return true
    },
    
    moveLayerToBottom: (layerId: string) => {
      const { layers } = get()
      const layerIndex = layers.findIndex(layer => layer.id === layerId)
      if (layerIndex <= 0) return false
      
      const newLayers = [...layers]
      const [movedLayer] = newLayers.splice(layerIndex, 1)
      newLayers.unshift(movedLayer)
      
      // 更新 z-index
      newLayers.forEach((layer, index) => {
        layer.zIndex = index
      })
      
      set({ layers: newLayers })
      return true
    },
    
    reorderLayers: () => {
      set((state) => ({
        layers: state.layers
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((layer, index) => ({ ...layer, zIndex: index }))
      }))
    },
    
    // 图层查询
    getLayerById: (layerId: string) => {
      return get().layers.find(layer => layer.id === layerId) || null
    },
    
    getActiveLayer: () => {
      const { layers, activeLayerId } = get()
      if (!activeLayerId) return null
      return layers.find(layer => layer.id === activeLayerId) || null
    },
    
    getVisibleLayers: () => {
      return get().layers.filter(layer => layer.visible)
    },
    
    getLayersByZIndex: () => {
      return [...get().layers].sort((a, b) => a.zIndex - b.zIndex)
    },
    
    // 图层合并
    mergeLayers: (layerIds: string[]) => {
      const { layers } = get()
      
      if (layerIds.length < 2) {
        console.warn('Need at least 2 layers to merge')
        return null
      }
      
      const layersToMerge = layerIds
        .map(id => layers.find(layer => layer.id === id))
        .filter(Boolean) as ImageLayer[]
      
      if (layersToMerge.length !== layerIds.length) {
        console.warn('Some layers not found')
        return null
      }
      
      // TODO: 实现实际的图层合并逻辑
      // 这里需要将多个图层的像素数据合并成一个新的 ImageData
      console.log('Layer merging not implemented yet')
      
      return null
    },
    
    flattenAllLayers: () => {
      const { layers } = get()
      
      if (layers.length <= 1) return null
      
      // TODO: 实现将所有可见图层合并为单一图层的逻辑
      console.log('Layer flattening not implemented yet')
      
      return null
    },
    
    // 批量操作
    showAllLayers: () => {
      set((state) => ({
        layers: state.layers.map(layer => ({ ...layer, visible: true }))
      }))
    },
    
    hideAllLayers: () => {
      set((state) => ({
        layers: state.layers.map(layer => ({ ...layer, visible: false }))
      }))
    },
    
    lockAllLayers: () => {
      set((state) => ({
        layers: state.layers.map(layer => ({ ...layer, locked: true }))
      }))
    },
    
    unlockAllLayers: () => {
      set((state) => ({
        layers: state.layers.map(layer => ({ ...layer, locked: false }))
      }))
    },
    
    // 清空操作
    clearAllLayers: () => {
      set({
        layers: [],
        activeLayerId: null,
        layerIdCounter: 0
      })
    }
  }))
)

/**
 * 便捷的选择器 hooks
 */

// 获取所有图层
export const useLayers = () => useLayerStore((state) => state.layers)

// 获取活动图层
export const useActiveLayer = () => useLayerStore((state) => {
  const { layers, activeLayerId } = state
  return activeLayerId ? layers.find(layer => layer.id === activeLayerId) || null : null
})

// 获取可见图层
export const useVisibleLayers = () => useLayerStore((state) => 
  state.layers.filter(layer => layer.visible)
)

// 获取图层操作函数
export const useLayerActions = () => useLayerStore((state) => ({
  addLayer: state.addLayer,
  removeLayer: state.removeLayer,
  duplicateLayer: state.duplicateLayer,
  setActiveLayer: state.setActiveLayer,
  updateLayerTransform: state.updateLayerTransform,
  updateLayerOpacity: state.updateLayerOpacity,
  updateLayerVisibility: state.updateLayerVisibility,
  renameLayer: state.renameLayer
}))

// 获取图层排序函数
export const useLayerReorder = () => useLayerStore((state) => ({
  moveLayerUp: state.moveLayerUp,
  moveLayerDown: state.moveLayerDown,
  moveLayerToTop: state.moveLayerToTop,
  moveLayerToBottom: state.moveLayerToBottom,
  reorderLayers: state.reorderLayers
}))
