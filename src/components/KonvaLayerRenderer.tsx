import React from 'react'
import { Group, Layer, Image as KonvaImage } from 'react-konva'
import { useLayerStore } from '../stores/layerStore'
import type { ImageLayer } from '../stores/types'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface KonvaLayerRendererProps {
  // 暂时移除debug参数，将来需要时再添加
}

/**
 * Konva多图层渲染组件
 * 负责将layerStore中的图层渲染到Konva Stage中
 * 
 * 架构设计：
 * Stage
 *   └── Layer (图层容器)
 *       ├── Group (用户图层1)
 *       │   ├── Image (图像内容)
 *       │   └── ... (编辑内容：选区、画笔、变换控制等)
 *       ├── Group (用户图层2)
 *       │   ├── Image (图像内容)  
 *       │   └── ... (编辑内容)
 *       └── Layer (通用工具预览层)
 *           └── ... (工具预览内容)
 */
export const KonvaLayerRenderer: React.FC<KonvaLayerRendererProps> = () => {
  // 获取所有图层
  const layers = useLayerStore((state) => state.layers)
  const activeLayerId = useLayerStore((state) => state.activeLayerId)

  // 创建图像元素的辅助函数
  const createImageFromImageData = React.useCallback((imageData: ImageData): HTMLImageElement => {
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height
    
    const ctx = canvas.getContext('2d')!
    ctx.putImageData(imageData, 0, 0)
    
    const img = new Image()
    img.src = canvas.toDataURL()
    return img
  }, [])

  // 渲染单个图层组
  const renderLayerGroup = React.useCallback((layer: ImageLayer) => {
    const image = createImageFromImageData(layer.imageData)
    const isActive = layer.id === activeLayerId
    
    return (
      <Group
        key={layer.id}
        // Group 级别的变换 - 应用到整个图层组
        x={layer.transform.x}
        y={layer.transform.y}
        scaleX={layer.transform.scale}
        scaleY={layer.transform.scale}
        rotation={layer.transform.rotation}
        // Group 级别的显示属性
        visible={layer.visible}
        opacity={layer.opacity}
        // 交互属性
        listening={isActive && !layer.locked}
        draggable={isActive && !layer.locked}
      >
        {/* 图像层 - 显示图层的实际内容 */}
        <KonvaImage
          image={image}
          x={0} // 相对于 Group 的位置
          y={0}
          width={layer.displayWidth}
          height={layer.displayHeight}
          listening={false} // 图像本身不响应事件，由 Group 处理
          // 暂时移除混合模式，等Konva更新支持
          // globalCompositeOperation={layer.blendMode}
        />

        {/* 编辑层内容 - 只在激活时显示 */}
        {isActive && (
          <>
            {/* 这里将来可以添加更多编辑内容：
                - 该图层的画笔预览  
                - 该图层的变换控制点
                - 该图层的蒙版编辑
                - 图层边界框
            */}
          </>
        )}
      </Group>
    )
  }, [activeLayerId, createImageFromImageData])

  if (layers.length === 0) {
    return null
  }

  return (
    <Layer>
      {/* 按索引顺序渲染图层，索引越大层级越高 */}
      {layers.map((layer) => renderLayerGroup(layer))}
    </Layer>
  )
}

export default KonvaLayerRenderer
