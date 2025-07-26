import { useEffect, useCallback } from 'react'
import { useLayerStore } from '../stores/layerStore'
import { useWorkspaceActions } from '../stores/canvasStore'
import type { Rectangle } from '../stores/types'

/**
 * 工作区集成 Hook
 * 监听图层变化，自动调整工作区尺寸
 */
export const useWorkspaceIntegration = () => {
  const layers = useLayerStore((state) => state.layers)
  const { autoExpandForContent, fitWorkspaceToContent } = useWorkspaceActions()

  // 计算所有图层的联合边界
  const calculateContentBounds = useCallback((): Rectangle | null => {
    if (layers.length === 0) return null

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    layers.forEach((layer) => {
      if (!layer.visible) return

      const { transform, displayWidth, displayHeight } = layer
      
      // 计算图层的边界（考虑变换）
      const layerMinX = transform.x
      const layerMinY = transform.y
      const layerMaxX = transform.x + displayWidth * transform.scale
      const layerMaxY = transform.y + displayHeight * transform.scale

      minX = Math.min(minX, layerMinX)
      minY = Math.min(minY, layerMinY)
      maxX = Math.max(maxX, layerMaxX)
      maxY = Math.max(maxY, layerMaxY)
    })

    if (!isFinite(minX)) return null

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }, [layers])

  // 监听图层变化，自动扩展工作区
  useEffect(() => {
    const contentBounds = calculateContentBounds()
    if (contentBounds) {
      autoExpandForContent(contentBounds)
    }
  }, [calculateContentBounds, autoExpandForContent])

  return {
    calculateContentBounds,
    fitWorkspaceToContent: () => {
      const contentBounds = calculateContentBounds()
      if (contentBounds) {
        // 实现适配所有内容的工作区调整
        fitWorkspaceToContent()
      }
    }
  }
}

/**
 * 图层管理增强 Hook
 * 提供与工作区集成的图层操作
 */
export const useEnhancedLayerActions = () => {
  const { addLayer, ...layerActions } = useLayerStore()
  const { autoExpandForContent } = useWorkspaceActions()

  const addLayerWithWorkspaceUpdate = (
    imageData: ImageData, 
    options?: Parameters<typeof addLayer>[1]
  ) => {
    const layerId = addLayer(imageData, options)
    
    // 计算新图层的边界并触发工作区扩展
    const layer = useLayerStore.getState().getLayerById(layerId)
    if (layer) {
      const contentBounds = {
        x: layer.transform.x,
        y: layer.transform.y,
        width: layer.displayWidth * layer.transform.scale,
        height: layer.displayHeight * layer.transform.scale
      }
      autoExpandForContent(contentBounds)
    }
    
    return layerId
  }

  return {
    ...layerActions,
    addLayer: addLayerWithWorkspaceUpdate
  }
}
