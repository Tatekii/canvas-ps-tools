# 活动图层功能增强文档

## 概述

为了更好地支持魔术棒选择、笔刷绘制等工具操作，我们增强了图层面板的"当前选中图层"功能，提供了专门的工具数据访问接口。

## 🎯 核心功能

### 1. 活动图层信息展示

**位置**: 图层面板顶部的"当前活动图层"区域

**显示内容**:
- 图层名称、尺寸、位置
- 缩放比例、不透明度、混合模式
- 工具相关状态（可见性、锁定状态、像素数据可用性）

### 2. 工具专用数据访问

```typescript
// 获取活动图层的工具专用数据
const activeLayerData = useActiveLayerForTools()

// 数据结构
{
  layer: ImageLayer | null,      // 图层对象
  imageData: ImageData | null,   // 像素数据
  isVisible: boolean,            // 可见性
  isLocked: boolean,             // 锁定状态
  bounds: Rectangle,             // 图层边界
  pixelData: Uint8ClampedArray,  // 原始像素数据
  width: number,                 // 图像宽度
  height: number,                // 图像高度
  opacity: number,               // 不透明度
  blendMode: BlendMode           // 混合模式
}
```

### 3. 像素颜色访问

```typescript
// 获取活动图层指定坐标的像素颜色
const getPixelColor = useGetPixelColor()
const color = getPixelColor(x, y) // 返回 {r, g, b, a, effectiveAlpha}

// 获取所有可见图层合成后的颜色
const getCompositeColor = useGetCompositePixelColor()
const compositeColor = getCompositeColor(x, y)
```

## 🛠️ 工具集成示例

### 魔术棒工具

```typescript
import { useMagicWandTool } from '../hooks/useToolDataAccess'

const MagicWandComponent = () => {
  const {
    isToolAvailable,
    activeLayerInfo,
    getActiveLayerPixel,
    magicWandSelect
  } = useMagicWandTool()

  const handleClick = (x: number, y: number) => {
    if (!isToolAvailable) {
      alert('请选择一个可见且未锁定的图层')
      return
    }

    const selection = magicWandSelect(x, y, 32) // 容差32
    console.log('选区结果:', selection)
  }

  return (
    <div>
      <div>活动图层: {activeLayerInfo.name}</div>
      <div>状态: {isToolAvailable ? '可用' : '不可用'}</div>
      {/* 工具UI */}
    </div>
  )
}
```

### 笔刷工具

```typescript
import { useBrushTool } from '../hooks/useToolDataAccess'

const BrushComponent = () => {
  const {
    canDraw,
    targetLayer,
    getDebugInfo
  } = useBrushTool()

  const handlePaint = (x: number, y: number) => {
    if (!canDraw) {
      console.warn('无法在当前图层绘制:', getDebugInfo())
      return
    }

    console.log('绘制目标:', targetLayer)
    // 执行绘制操作
  }

  return (
    <div>
      <div>绘制状态: {canDraw ? '就绪' : '不可用'}</div>
      {targetLayer && (
        <div>目标图层: {targetLayer.layerName}</div>
      )}
    </div>
  )
}
```

### 通用工具数据访问

```typescript
import { useToolDataAccess } from '../hooks/useToolDataAccess'

const ToolComponent = () => {
  const {
    activeLayer,
    isActiveLayerReady,
    getPixelFromActiveLayer,
    getStatusMessage
  } = useToolDataAccess()

  return (
    <div>
      <div>状态: {getStatusMessage()}</div>
      <div>图层: {activeLayer?.name || '无'}</div>
      <div>就绪: {isActiveLayerReady ? '是' : '否'}</div>
    </div>
  )
}
```

## 📊 UI 增强

### 图层面板新增区域

```typescript
// 在LayerPanel.tsx中新增的活动图层信息区域
{activeLayer && (
  <div className="mb-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
    <div className="flex items-center gap-2 mb-3">
      <Target className="w-4 h-4 text-green-400" />
      <span className="text-sm font-medium text-green-400">当前活动图层</span>
    </div>
    
    {/* 基础信息 */}
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-400">名称:</span>
        <span className="text-white font-medium">{activeLayer.name}</span>
      </div>
      {/* 更多属性... */}
    </div>
    
    {/* 工具相关信息 */}
    <div className="mt-3 pt-3 border-t border-gray-600">
      <div className="flex items-center gap-2 mb-2">
        <ImageIcon className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-medium text-blue-400">工具数据</span>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">工具可用:</span>
          <span className={toolAvailable ? "text-green-400" : "text-red-400"}>
            {toolAvailable ? "可用" : "不可用"}
          </span>
        </div>
      </div>
    </div>
  </div>
)}
```

## 🔧 新增的Store Hooks

### 图层存储增强

```typescript
// 新增的hooks
export const useActiveLayerId = () => useLayerStore(state => state.activeLayerId)

export const useActiveLayerForTools = () => {
  // 返回工具专用的活动图层数据结构
}

export const useGetPixelColor = () => {
  // 返回获取像素颜色的函数
}

export const useGetCompositePixelColor = () => {
  // 返回获取合成颜色的函数
}
```

## 🎮 用户体验

### 工具状态指示

1. **绿色**: 工具可用，图层数据准备就绪
2. **红色**: 工具不可用（图层不可见/锁定/未选择）
3. **橙色**: 部分可用（如图层锁定但可见）

### 实时信息更新

- 图层选择改变时自动更新活动图层信息
- 图层属性修改时实时反映在面板中
- 工具状态根据当前图层状态动态变化

### 调试支持

每个工具都提供`getDebugInfo()`函数，便于开发调试：

```typescript
const debugInfo = magicWandTool.getDebugInfo()
console.log('魔术棒工具状态:', debugInfo)
// 输出: { activeLayer: 'Layer 1', toolReady: true, bounds: {...} }
```

## 🚀 性能优化

1. **选择器优化**: 使用Zustand的选择器避免不必要的重渲染
2. **数据缓存**: 工具数据计算结果缓存在store中
3. **按需计算**: 只在需要时计算像素边界和工具状态

## 📈 后续扩展

### 计划功能

1. **多图层工具**: 支持跨图层操作的工具
2. **工具预设**: 保存和加载工具配置
3. **批量操作**: 对多个图层执行相同操作
4. **历史记录**: 记录工具操作历史用于撤销/重做

### API扩展

```typescript
// 未来可能的API扩展
useMultiLayerSelection()    // 多图层选择
useLayerGroupOperations()   // 图层组操作
useToolHistory()           // 工具操作历史
useAdvancedPixelAccess()   // 高级像素访问（支持HDR等）
```

## ✅ 验证结果

- **编译状态**: ✅ 成功，无TypeScript错误
- **类型安全**: ✅ 完整的类型定义和检查
- **性能表现**: ✅ 优化的选择器，避免过度渲染
- **用户体验**: ✅ 直观的状态指示和实时更新

这个增强的活动图层功能为所有工具提供了统一、高效的数据访问接口，特别是为魔术棒、笔刷等需要像素级操作的工具提供了强大的数据支持！
