import React from "react"
import { useLayerStore, useActiveLayerForTools } from "../stores/layerStore"
import { Eye, EyeOff, Lock, Unlock, Trash2, Plus, GripVertical, Target, ImageIcon, Info, Pointer } from "lucide-react"
import type { ImageLayer } from "../stores/types"

interface LayerPanelProps {
	className?: string
}

/**
 * 图层面板组件
 * 提供图层管理功能：创建、删除、显示/隐藏、重命名等
 */
export const LayerPanel: React.FC<LayerPanelProps> = ({ className }) => {
	// 订阅图层状态
	const layers = useLayerStore((state) => state.layers)
	const activeLayerId = useLayerStore((state) => state.activeLayerId)

	// 图层操作函数
	const setActiveLayer = useLayerStore((state) => state.setActiveLayer)
	const updateLayerVisibility = useLayerStore((state) => state.updateLayerVisibility)
	const updateLayerLock = useLayerStore((state) => state.updateLayerLock)
	const removeLayer = useLayerStore((state) => state.removeLayer)
	const renameLayer = useLayerStore((state) => state.renameLayer)
	const moveLayer = useLayerStore((state) => state.moveLayer)

	// 图层重命名状态
	const [editingLayerId, setEditingLayerId] = React.useState<string | null>(null)
	const [editingName, setEditingName] = React.useState("")

	// 拖拽状态
	const [draggedLayerId, setDraggedLayerId] = React.useState<string | null>(null)
	const [dragOverLayerId, setDragOverLayerId] = React.useState<string | null>(null)
	const [dragHandleHoveredLayerId, setDragHandleHoveredLayerId] = React.useState<string | null>(null)

	// 添加活动图层和工具相关hooks
	const activeLayer = useLayerStore((state) => {
		const { layers, activeLayerId } = state
		return activeLayerId ? layers.find((layer) => layer.id === activeLayerId) || null : null
	})

	// 使用已定义的工具专用hook，避免重复计算
	const activeLayerForTools = useActiveLayerForTools()

	// 切换可见性的辅助函数
	const toggleVisibility = (layerId: string) => {
		const layer = layers.find((l) => l.id === layerId)
		if (layer) {
			updateLayerVisibility(layerId, !layer.visible)
		}
	}

	// 切换锁定的辅助函数
	const toggleLock = (layerId: string) => {
		const layer = layers.find((l) => l.id === layerId)
		if (layer) {
			updateLayerLock(layerId, !layer.locked)
		}
	}

	// 开始重命名
	const startRename = (layer: ImageLayer) => {
		setEditingLayerId(layer.id)
		setEditingName(layer.name)
	}

	// 完成重命名
	const finishRename = () => {
		if (editingLayerId && editingName.trim()) {
			renameLayer(editingLayerId, editingName.trim())
		}
		setEditingLayerId(null)
		setEditingName("")
	}

	// 取消重命名
	const cancelRename = () => {
		setEditingLayerId(null)
		setEditingName("")
	}

	// 处理键盘事件
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			finishRename()
		} else if (e.key === "Escape") {
			cancelRename()
		}
	}

	// 拖拽事件处理
	const handleDragStart = (e: React.DragEvent, layerId: string) => {
		setDraggedLayerId(layerId)
		e.dataTransfer.effectAllowed = "move"
		e.dataTransfer.setData("text/plain", layerId)
	}

	const handleDragOver = (e: React.DragEvent, layerId: string) => {
		e.preventDefault()
		e.dataTransfer.dropEffect = "move"
		setDragOverLayerId(layerId)
	}

	const handleDragLeave = () => {
		setDragOverLayerId(null)
	}

	const handleDrop = (e: React.DragEvent, targetLayerId: string) => {
		e.preventDefault()

		if (draggedLayerId) {
			moveLayer(draggedLayerId, targetLayerId)
		}

		setDraggedLayerId(null)
		setDragOverLayerId(null)
	}

	const handleDragEnd = () => {
		setDraggedLayerId(null)
		setDragOverLayerId(null)
	}

	// 拖拽手柄鼠标事件
	const handleDragHandleMouseEnter = (layerId: string) => {
		setDragHandleHoveredLayerId(layerId)
	}

	const handleDragHandleMouseLeave = () => {
		setDragHandleHoveredLayerId(null)
	}

	// 创建测试图层
	const createTestLayer = () => {
		// 创建一个简单的测试图像数据
		const canvas = document.createElement("canvas")
		canvas.width = 200
		canvas.height = 150
		const ctx = canvas.getContext("2d")!

		// 绘制一个彩色矩形作为测试图层
		const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7"]
		const color = colors[layers.length % colors.length]
		ctx.fillStyle = color
		ctx.fillRect(0, 0, 200, 150)

		// 添加文字
		ctx.fillStyle = "white"
		ctx.font = "16px Arial"
		ctx.textAlign = "center"
		ctx.fillText(`Layer ${layers.length + 1}`, 100, 80)

		const imageData = ctx.getImageData(0, 0, 200, 150)

		// 添加到图层存储
		const addLayer = useLayerStore.getState().addLayer
		addLayer(imageData, {
			name: `Test Layer ${layers.length + 1}`,
			transform: {
				x: Math.random() * 100,
				y: Math.random() * 100,
				scale: 1,
				rotation: 0,
			},
		})
	}

	return (
		<div className={`bg-gray-800 text-white p-4 w-80 ${className || ""}`}>
			{/* 面板标题 */}
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold">Layers</h3>
				<button
					onClick={createTestLayer}
					className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
					title="Add Test Layer"
				>
					<Plus size={16} />
				</button>
			</div>

			{/* 图层列表 */}
			<div className="space-y-2">
				{layers.length === 0 ? (
					<div className="text-gray-400 text-center py-8">No layers yet. Click + to add a test layer.</div>
				) : (
					layers
						.slice() // 创建副本以避免直接修改
						.reverse() // 数组倒序显示，使高索引（顶层）的图层显示在上方
						.map((layer) => (
							<div
								key={layer.id}
								// 当拖拽手柄被悬停时，整个div变为可拖拽
								draggable={
									dragHandleHoveredLayerId === layer.id
								}
								className={`
                                    bg-gray-700 rounded p-3 cursor-pointer transition-colors
                                    ${activeLayerId === layer.id ? "bg-blue-600" : "hover:bg-gray-600"}
                                    ${draggedLayerId === layer.id ? "opacity-50" : ""}
                                    ${dragOverLayerId === layer.id ? "border-b-2 border-blue-400" : ""}
                                    ${
										dragHandleHoveredLayerId === layer.id &&
										!layer.locked &&
										editingLayerId !== layer.id
											? "ring-1 ring-blue-300 cursor-move"
											: ""
									}
                                    `}
								onClick={() => setActiveLayer(layer.id)}
								onDragStart={(e) => handleDragStart(e, layer.id)}
								onDragOver={(e) => handleDragOver(e, layer.id)}
								onDragLeave={handleDragLeave}
								onDrop={(e) => handleDrop(e, layer.id)}
								onDragEnd={handleDragEnd}
							>
								{/* 图层名称 */}
								<div className="flex-1">
									{editingLayerId === layer.id ? (
										<input
											type="text"
											value={editingName}
											onChange={(e) => setEditingName(e.target.value)}
											onBlur={finishRename}
											onKeyDown={handleKeyDown}
											className="bg-gray-600 px-2 py-1 rounded text-sm w-full"
											autoFocus
										/>
									) : (
										<span
											onDoubleClick={() => startRename(layer)}
											className={`text-sm ${
												activeLayer?.id === layer.id ? "text-green-500 font-bold" : ""
											}`}
										>
											{layer.name}
										</span>
									)}
								</div>
								<div className="flex items-center gap-1">
									{/* 拖拽手柄 - 鼠标进入时激活整个div的拖拽 */}
									<div
										// 移除 draggable - 不拖拽手柄本身
										className={`p-1 rounded transition-colors cursor-move hover:hover:bg-gray-500`}
										title={
											layer.locked
												? "Layer is locked"
												: editingLayerId === layer.id
												? "Cannot drag while editing"
												: "Drag to reorder"
										}
										// 鼠标进入手柄时激活整个图层的拖拽
										onMouseEnter={() => handleDragHandleMouseEnter(layer.id)}
										onMouseLeave={handleDragHandleMouseLeave}
										onClick={(e) => e.stopPropagation()} // 防止触发图层选择
									>
										<GripVertical size={16} />
									</div>

									{/* 可见性按钮 */}
									<button
										onClick={(e) => {
											e.stopPropagation()
											toggleVisibility(layer.id)
										}}
										className="p-1 hover:bg-gray-500 rounded"
										title={layer.visible ? "Hide layer" : "Show layer"}
									>
										{layer.visible ? (
											<Eye size={16} />
										) : (
											<EyeOff className="text-yellow-400" size={16} />
										)}
									</button>

									{/* 锁定按钮 */}
									<button
										onClick={(e) => {
											e.stopPropagation()
											toggleLock(layer.id)
										}}
										className="p-1 hover:bg-gray-500 rounded"
										title={layer.locked ? "Unlock layer" : "Lock layer"}
									>
										{layer.locked ? (
											<Lock size={16} className="text-red-400" />
										) : (
											<Unlock size={16} />
										)}
									</button>

									{/* 删除按钮 */}
									<button
										onClick={(e) => {
											e.stopPropagation()
											removeLayer(layer.id)
										}}
										className="p-1 hover:bg-red-500 rounded"
										title="Delete layer"
									>
										<Trash2 size={16} />
									</button>
								</div>

								{/* 图层信息 */}
								<div className="mt-2 text-xs text-gray-400">
									<div>
										Size: {layer.displayWidth} × {layer.displayHeight}
									</div>
									<div>Opacity: {Math.round(layer.opacity * 100)}%</div>
								</div>
							</div>
						))
				)}
			</div>

			{/* 图层统计 */}
			{layers.length > 0 && (
				<div className="mt-4 pt-4 border-t border-gray-600 text-xs text-gray-400">
					Total layers: {layers.length}
					{activeLayerId && <div>Active: {layers.find((l) => l.id === activeLayerId)?.name}</div>}
				</div>
			)}
		</div>
	)
}
