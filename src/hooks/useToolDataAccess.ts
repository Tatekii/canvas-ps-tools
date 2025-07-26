import { useCallback } from 'react'
import { 
  useActiveLayerForTools, 
  useGetPixelColor, 
  useGetCompositePixelColor 
} from '../stores'

/**
 * 魔术棒工具专用Hook
 * 演示如何使用活动图层数据进行像素选择
 */
export const useMagicWandTool = () => {
  const activeLayerData = useActiveLayerForTools()
  const getPixelColor = useGetPixelColor()
  const getCompositeColor = useGetCompositePixelColor()

  // 检查工具是否可用
  const isToolAvailable = useCallback(() => {
    return (
      activeLayerData.layer !== null &&
      activeLayerData.isVisible &&
      !activeLayerData.isLocked
    )
  }, [activeLayerData])

  // 获取指定坐标的像素颜色（仅当前活动图层）
  const getActiveLayerPixel = useCallback((x: number, y: number) => {
    if (!isToolAvailable()) {
      console.warn('魔术棒工具：活动图层不可用')
      return null
    }

    return getPixelColor(x, y)
  }, [isToolAvailable, getPixelColor])

  // 获取指定坐标的合成颜色（所有可见图层）
  const getCompositePixel = useCallback((x: number, y: number) => {
    return getCompositeColor(x, y)
  }, [getCompositeColor])

  // 魔术棒选择算法（简化版本）
  const magicWandSelect = useCallback((
    startX: number, 
    startY: number, 
    tolerance: number = 32,
    useComposite: boolean = false
  ) => {
    if (!isToolAvailable()) {
      console.warn('魔术棒工具：活动图层不可用')
      return null
    }

    const getColor = useComposite ? getCompositePixel : getActiveLayerPixel
    const startColor = getColor(startX, startY)
    
    if (!startColor) {
      console.warn('魔术棒工具：无法获取起始点颜色')
      return null
    }

    console.log('魔术棒选择开始:', {
      position: { x: startX, y: startY },
      startColor,
      tolerance,
      useComposite,
      layerInfo: {
        name: activeLayerData.layer?.name,
        size: `${activeLayerData.width} × ${activeLayerData.height}`,
        bounds: activeLayerData.bounds
      }
    })

    // 这里应该实现实际的洪水填充算法
    // 现在只是返回一个示例选区
    return {
      type: 'magic-wand' as const,
      bounds: {
        x: Math.max(0, startX - 50),
        y: Math.max(0, startY - 50),
        width: 100,
        height: 100
      },
      startPoint: { x: startX, y: startY },
      startColor,
      tolerance,
      pixelCount: 2500 // 示例像素数量
    }
  }, [isToolAvailable, getActiveLayerPixel, getCompositePixel, activeLayerData])

  return {
    // 状态
    isToolAvailable: isToolAvailable(),
    activeLayerInfo: {
      name: activeLayerData.layer?.name || 'No Layer',
      size: activeLayerData.layer ? `${activeLayerData.width} × ${activeLayerData.height}` : 'N/A',
      visible: activeLayerData.isVisible,
      locked: activeLayerData.isLocked,
      bounds: activeLayerData.bounds
    },
    
    // 工具函数
    getActiveLayerPixel,
    getCompositePixel,
    magicWandSelect,
    
    // 工具设置检查
    canUseOnActiveLayer: () => isToolAvailable(),
    canUseCompositeMode: () => true, // 合成模式总是可用的
    
    // 调试信息
    getDebugInfo: () => ({
      activeLayer: activeLayerData.layer?.name || 'None',
      pixelDataSize: activeLayerData.layer ? 
        `${activeLayerData.width} × ${activeLayerData.height}` : 'N/A',
      isVisible: activeLayerData.isVisible,
      isLocked: activeLayerData.isLocked,
      bounds: activeLayerData.bounds,
      toolReady: isToolAvailable()
    })
  }
}

/**
 * 笔刷工具专用Hook
 * 演示如何使用活动图层数据进行绘制
 */
export const useBrushTool = () => {
  const activeLayerData = useActiveLayerForTools()

  // 检查是否可以在当前图层绘制
  const canDrawOnActiveLayer = useCallback(() => {
    return (
      activeLayerData.layer !== null &&
      activeLayerData.isVisible &&
      !activeLayerData.isLocked
    )
  }, [activeLayerData])

  // 获取绘制目标信息
  const getDrawTarget = useCallback(() => {
    if (!canDrawOnActiveLayer()) {
      return null
    }

    return {
      layerId: activeLayerData.layer!.id,
      layerName: activeLayerData.layer!.name,
      bounds: activeLayerData.bounds!,
      opacity: activeLayerData.opacity!,
      blendMode: activeLayerData.blendMode!
    }
  }, [canDrawOnActiveLayer, activeLayerData])

  return {
    // 状态
    canDraw: canDrawOnActiveLayer(),
    targetLayer: getDrawTarget(),
    
    // 调试信息
    getDebugInfo: () => ({
      activeLayer: activeLayerData.layer?.name || 'None',
      canDraw: canDrawOnActiveLayer(),
      reason: !canDrawOnActiveLayer() ? 
        (activeLayerData.layer === null ? 'No active layer' :
         !activeLayerData.isVisible ? 'Layer not visible' :
         activeLayerData.isLocked ? 'Layer is locked' : 'Unknown') : 'Ready'
    })
  }
}

/**
 * 通用工具数据访问Hook
 * 为所有工具提供统一的数据访问接口
 */
export const useToolDataAccess = () => {
  const activeLayerData = useActiveLayerForTools()
  const getPixelColor = useGetPixelColor()
  const getCompositeColor = useGetCompositePixelColor()

  return {
    // 活动图层信息
    activeLayer: activeLayerData.layer,
    isActiveLayerReady: activeLayerData.layer !== null && 
                       activeLayerData.isVisible && 
                       !activeLayerData.isLocked,
    
    // 数据访问函数
    getPixelFromActiveLayer: getPixelColor,
    getCompositePixel: getCompositeColor,
    
    // 图层属性
    layerBounds: activeLayerData.bounds,
    layerOpacity: activeLayerData.opacity,
    layerBlendMode: activeLayerData.blendMode,
    
    // 状态检查
    hasActiveLayer: () => activeLayerData.layer !== null,
    isLayerVisible: () => activeLayerData.isVisible,
    isLayerLocked: () => activeLayerData.isLocked,
    
    // 调试和工具提示
    getStatusMessage: () => {
      if (!activeLayerData.layer) return '请选择一个图层'
      if (!activeLayerData.isVisible) return '当前图层不可见'
      if (activeLayerData.isLocked) return '当前图层已锁定'
      return '图层数据可用'
    }
  }
}
