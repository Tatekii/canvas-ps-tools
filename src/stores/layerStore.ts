import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import type { ImageLayer, LayerStore, LayerCreateOptions, BlendMode } from "./types"

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
					rotation: options.transform?.rotation ?? 0,
				},
				opacity: options.opacity ?? 1,
				blendMode: options.blendMode || "normal",
				visible: options.visible ?? true,
				locked: options.locked ?? false,
				// 移除 zIndex - 使用数组索引表示层级（新图层添加到末尾，层级最高）
				originalWidth,
				originalHeight,
				displayWidth: originalWidth,
				displayHeight: originalHeight,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			set((state) => ({
				layers: [...state.layers, newLayer],
				layerIdCounter: state.layerIdCounter + 1,
				activeLayerId: newLayer.id, // 新添加的图层自动成为活动图层
			}))

			return newLayer.id
		},

		removeLayer: (layerId: string) => {
			const { layers, activeLayerId } = get()

			if (layers.length <= 1) {
				console.warn("Cannot remove the last layer")
				return false
			}

			const layerIndex = layers.findIndex((layer) => layer.id === layerId)
			if (layerIndex === -1) return false

			const newLayers = layers.filter((layer) => layer.id !== layerId)

			// 如果删除的是活动图层，选择新的活动图层
			let newActiveLayerId = activeLayerId
			if (activeLayerId === layerId) {
				// 优先选择删除图层下方的图层，如果没有则选择上方的
				const nextIndex = Math.min(layerIndex, newLayers.length - 1)
				newActiveLayerId = newLayers[nextIndex]?.id || null
			}

			set({
				layers: newLayers,
				activeLayerId: newActiveLayerId,
			})

			return true
		},

		duplicateLayer: (layerId: string) => {
			const { layers } = get()
			const sourceLayer = layers.find((layer) => layer.id === layerId)
			if (!sourceLayer) return null

			// 创建图层副本（新图层会自动添加到顶部）
			const duplicatedLayerId = get().addLayer(sourceLayer.imageData, {
				name: `${sourceLayer.name} copy`,
				transform: { ...sourceLayer.transform },
				opacity: sourceLayer.opacity,
				blendMode: sourceLayer.blendMode,
				visible: sourceLayer.visible,
				locked: false, // 副本默认不锁定
				// 移除 zIndex - 新图层自动添加到数组末尾（最高层级）
			})

			return duplicatedLayerId
		},

		// 图层属性更新
		updateLayerTransform: (layerId: string, transform: Partial<ImageLayer["transform"]>) => {
			set((state) => ({
				layers: state.layers.map((layer) =>
					layer.id === layerId ? { ...layer, transform: { ...layer.transform, ...transform } } : layer
				),
			}))
		},

		updateLayerOpacity: (layerId: string, opacity: number) => {
			const clampedOpacity = Math.max(0, Math.min(1, opacity))
			set((state) => ({
				layers: state.layers.map((layer) =>
					layer.id === layerId ? { ...layer, opacity: clampedOpacity } : layer
				),
			}))
		},

		updateLayerBlendMode: (layerId: string, blendMode: BlendMode) => {
			set((state) => ({
				layers: state.layers.map((layer) => (layer.id === layerId ? { ...layer, blendMode } : layer)),
			}))
		},

		updateLayerVisibility: (layerId: string, visible: boolean) => {
			set((state) => ({
				layers: state.layers.map((layer) => (layer.id === layerId ? { ...layer, visible } : layer)),
			}))
		},

		updateLayerLock: (layerId: string, locked: boolean) => {
			set((state) => ({
				layers: state.layers.map((layer) => (layer.id === layerId ? { ...layer, locked } : layer)),
			}))
		},

		renameLayer: (layerId: string, name: string) => {
			set((state) => ({
				layers: state.layers.map((layer) => (layer.id === layerId ? { ...layer, name } : layer)),
			}))
		},

		// 图层选择
		setActiveLayer: (layerId: string) => {
			const { layers } = get()
			const layer = layers.find((l) => l.id === layerId)
			if (layer && !layer.locked) {
				set({ activeLayerId: layerId })
			}
		},

		selectNextLayer: () => {
			const { layers, activeLayerId } = get()
			if (!activeLayerId) return

			const currentIndex = layers.findIndex((layer) => layer.id === activeLayerId)
			const nextIndex = (currentIndex + 1) % layers.length
			const nextLayer = layers[nextIndex]

			if (nextLayer && !nextLayer.locked) {
				set({ activeLayerId: nextLayer.id })
			}
		},

		selectPreviousLayer: () => {
			const { layers, activeLayerId } = get()
			if (!activeLayerId) return

			const currentIndex = layers.findIndex((layer) => layer.id === activeLayerId)
			const prevIndex = currentIndex === 0 ? layers.length - 1 : currentIndex - 1
			const prevLayer = layers[prevIndex]

			if (prevLayer && !prevLayer.locked) {
				set({ activeLayerId: prevLayer.id })
			}
		},

		// 图层排序
		moveLayerUp: (layerId: string) => {
			const { layers } = get()
			const layerIndex = layers.findIndex((layer) => layer.id === layerId)
			if (layerIndex === -1 || layerIndex === layers.length - 1) return false

			const newLayers = [...layers]
			const [movedLayer] = newLayers.splice(layerIndex, 1)
			newLayers.splice(layerIndex + 1, 0, movedLayer)

			// 不再需要更新 zIndex - 数组索引即为层级顺序

			set({ layers: newLayers })
			return true
		},

		moveLayerDown: (layerId: string) => {
			const { layers } = get()
			const layerIndex = layers.findIndex((layer) => layer.id === layerId)
			if (layerIndex <= 0) return false

			const newLayers = [...layers]
			const [movedLayer] = newLayers.splice(layerIndex, 1)
			newLayers.splice(layerIndex - 1, 0, movedLayer)

			// 不再需要更新 zIndex - 数组索引即为层级顺序

			set({ layers: newLayers })
			return true
		},

		moveLayerToTop: (layerId: string) => {
			const { layers } = get()
			const layerIndex = layers.findIndex((layer) => layer.id === layerId)
			if (layerIndex === -1 || layerIndex === layers.length - 1) return false

			const newLayers = [...layers]
			const [movedLayer] = newLayers.splice(layerIndex, 1)
			newLayers.push(movedLayer)

			// 不再需要更新 zIndex - 数组索引即为层级顺序

			set({ layers: newLayers })
			return true
		},

		moveLayerToBottom: (layerId: string) => {
			const { layers } = get()
			const layerIndex = layers.findIndex((layer) => layer.id === layerId)
			if (layerIndex <= 0) return false

			const newLayers = [...layers]
			const [movedLayer] = newLayers.splice(layerIndex, 1)
			newLayers.unshift(movedLayer)

			// 不再需要更新 zIndex - 数组索引即为层级顺序

			set({ layers: newLayers })
			return true
		},

		// 将图层移动到指定位置（用于拖拽重排序）
		// 移动到目标layer位置之"前"!
		moveLayer: (layerId: string, targetLayerId: string) => {
			const { layers } = get()

			// const currentIndex = layers.findIndex((layer) => layer.id === layerId)
			let currentIndex = -1
			let newIndex = -1

			if (layerId === targetLayerId) {
				return false
			}

			const len = layers.length
			for (let i = 0; i < len; i++) {
				const layer = layers[i]
				if (layer.id === layerId) {
					currentIndex = i
					continue
				}

				if (layer.id === targetLayerId) {
					newIndex = i
					continue
				}

				// 提前终止
				if (currentIndex > -1 && newIndex > -1) {
					break
				}
			}

			if (currentIndex === newIndex || currentIndex === -1 || newIndex === -1) {
				console.warn("layer搜素出错,移动失败", layerId, "=>", targetLayerId, { currentIndex, newIndex })
				return false
			}

			const newLayers = [...layers]
			// 从原位置删除
			const [movedLayer] = newLayers.splice(currentIndex, 1)
			// 在新位置插入
			newLayers.splice(newIndex, 0, movedLayer)

			// 不再需要更新 zIndex - 数组索引即为层级顺序
			set({ layers: newLayers })
			return true
		},

		reorderLayers: () => {
			// 不再需要重新排序 - 数组索引本身就是层级顺序
			// 这个方法保留是为了向后兼容，但实际上什么都不做
		},

		// 图层查询
		getLayerById: (layerId: string) => {
			return get().layers.find((layer) => layer.id === layerId) || null
		},

		getActiveLayer: () => {
			const { layers, activeLayerId } = get()
			if (!activeLayerId) return null
			return layers.find((layer) => layer.id === activeLayerId) || null
		},

		getVisibleLayers: () => {
			return get().layers.filter((layer) => layer.visible)
		},

		// 移除 getLayersByZIndex - 直接使用 layers 数组即可

		// 图层合并
		mergeLayers: (layerIds: string[]) => {
			const { layers } = get()

			if (layerIds.length < 2) {
				console.warn("Need at least 2 layers to merge")
				return null
			}

			const layersToMerge = layerIds
				.map((id) => layers.find((layer) => layer.id === id))
				.filter(Boolean) as ImageLayer[]

			if (layersToMerge.length !== layerIds.length) {
				console.warn("Some layers not found")
				return null
			}

			// TODO: 实现实际的图层合并逻辑
			// 这里需要将多个图层的像素数据合并成一个新的 ImageData
			console.log("Layer merging not implemented yet")

			return null
		},

		flattenAllLayers: () => {
			const { layers } = get()

			if (layers.length <= 1) return null

			// TODO: 实现将所有可见图层合并为单一图层的逻辑
			console.log("Layer flattening not implemented yet")

			return null
		},

		// 批量操作
		showAllLayers: () => {
			set((state) => ({
				layers: state.layers.map((layer) => ({ ...layer, visible: true })),
			}))
		},

		hideAllLayers: () => {
			set((state) => ({
				layers: state.layers.map((layer) => ({ ...layer, visible: false })),
			}))
		},

		lockAllLayers: () => {
			set((state) => ({
				layers: state.layers.map((layer) => ({ ...layer, locked: true })),
			}))
		},

		unlockAllLayers: () => {
			set((state) => ({
				layers: state.layers.map((layer) => ({ ...layer, locked: false })),
			}))
		},

		// 清空操作
		clearAllLayers: () => {
			set({
				layers: [],
				activeLayerId: null,
				layerIdCounter: 0,
			})
		},
	}))
)

/**
 * 便捷的选择器 hooks
 */

// 获取所有图层
export const useLayers = () => useLayerStore((state) => state.layers)

// 获取活动图层
export const useActiveLayer = () =>
	useLayerStore((state) => {
		const { layers, activeLayerId } = state
		return activeLayerId ? layers.find((layer) => layer.id === activeLayerId) || null : null
	})

// 获取可见图层
export const useVisibleLayers = () => useLayerStore((state) => state.layers.filter((layer) => layer.visible))

// Individual layer action hooks for stable references
export const useAddLayer = () => useLayerStore((state) => state.addLayer)
export const useRemoveLayer = () => useLayerStore((state) => state.removeLayer)
export const useDuplicateLayer = () => useLayerStore((state) => state.duplicateLayer)
export const useSetActiveLayer = () => useLayerStore((state) => state.setActiveLayer)
export const useUpdateLayerTransform = () => useLayerStore((state) => state.updateLayerTransform)
export const useUpdateLayerOpacity = () => useLayerStore((state) => state.updateLayerOpacity)
export const useUpdateLayerVisibility = () => useLayerStore((state) => state.updateLayerVisibility)
export const useRenameLayer = () => useLayerStore((state) => state.renameLayer)

// Individual layer reorder hooks for stable references
export const useMoveLayerUp = () => useLayerStore((state) => state.moveLayerUp)
export const useMoveLayerDown = () => useLayerStore((state) => state.moveLayerDown)
export const useMoveLayerToTop = () => useLayerStore((state) => state.moveLayerToTop)
export const useMoveLayerToBottom = () => useLayerStore((state) => state.moveLayerToBottom)
export const useMoveLayerToIndex = () => useLayerStore((state) => state.moveLayer)
export const useReorderLayers = () => useLayerStore((state) => state.reorderLayers)
