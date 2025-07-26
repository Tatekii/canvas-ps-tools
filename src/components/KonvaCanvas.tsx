import React, { useRef, useEffect, useCallback, useState } from "react"
import { Stage } from "react-konva"
import { KonvaEventObject } from "konva/lib/Node"
import Konva from "konva"
import { ZoomControls } from "./ZoomControls"
import { KonvaToolPreview } from "./KonvaToolPreview"
import { KonvaLayerRenderer } from "./KonvaLayerRenderer"
// 导入新的 Zustand stores
import { useViewport, useZoomControls, useSetStageRef, useUpdateViewportTransform } from "../stores/canvasStore"
import { useSelectionActions } from "../stores/selectionStore"
import { useActiveSelection } from "../stores/selectionStore"
import { useLayerStore } from "../stores/layerStore"
import { KonvaSelectionOverlay } from "./KonvaSelectionOverlay"

interface KonvaCanvasRef {
}

interface KonvaCanvasProps {}

const KonvaCanvas = React.forwardRef<KonvaCanvasRef, KonvaCanvasProps>((props, ref) => {
	// 从 Zustand stores 获取状态
	const viewport = useViewport()
	const zoomControls = useZoomControls()
	const setStageRef = useSetStageRef()
	const updateViewportTransform = useUpdateViewportTransform()

	const selectionActions = useSelectionActions()
	const activeSelection = useActiveSelection()

	// 图层系统
	const layerStore = useLayerStore()

	// 舞台尺寸常量 - 动态计算以适应容器
	const [stageDimensions, setStageDimensions] = useState({
		width: 1080,
		height: 768,
	})

	const stageRef = useRef<Konva.Stage>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)

	// 监听容器尺寸变化
	useEffect(() => {
		const updateStageDimensions = () => {
			if (containerRef.current) {
				const rect = containerRef.current.getBoundingClientRect()
				setStageDimensions({
					width: rect.width,
					height: rect.height,
				})
			}
		}

		// 初始设置
		updateStageDimensions()

		// 监听窗口大小变化
		window.addEventListener("resize", updateStageDimensions)

		return () => {
			window.removeEventListener("resize", updateStageDimensions)
		}
	}, []) // 初始化 canvas store 的 stage ref
	useEffect(() => {
		if (stageRef.current) {
			setStageRef(stageRef as React.RefObject<Konva.Stage>)
		}
	}, [setStageRef])

	// 使用统一的鼠标事件处理Hook - 暂时简化
	const handleMouseDown = useCallback(() => {}, [])
	const handleMouseMove = useCallback(() => {}, [])
	const handleMouseUp = useCallback(() => {}, [])

	// 加载默认图层
	const loadDefaultImage = useCallback(async () => {
		try {
			await layerStore.initializeWithDefaultLayer()
			selectionActions.clearSelection()
			// 重置舞台缩放
			zoomControls.resetZoom()
		} catch (error) {
			console.error("Failed to load default image:", error)
			alert("默认图片加载失败，请检查文件是否存在")
		}
	}, [layerStore, selectionActions, zoomControls])

	const handleImageUpload = useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0]
			if (file) {
				// 检查文件类型
				if (!file.type.startsWith("image/")) {
					alert("请选择有效的图片文件")
					return
				}

				// 检查文件大小 (限制为10MB)
				const maxSize = 10 * 1024 * 1024
				if (file.size > maxSize) {
					alert("图片文件太大，请选择小于10MB的图片")
					return
				}

				try {
					await layerStore.addLayerFromFile(file)
					selectionActions.clearSelection()
					// 重置舞台缩放
					zoomControls.resetZoom()
				} catch (error) {
					console.error("Failed to load image from file:", error)
					alert("图片加载失败，请尝试其他图片")
				}
			}
		},
		[layerStore, selectionActions, zoomControls]
	)

	// 清除选区
	const clearSelection = useCallback(() => {
		selectionActions.clearSelection()
	}, [selectionActions]) // 删除选中区域 - 临时禁用，等待图层系统完善
	const deleteSelected = useCallback(() => {
		console.log("删除功能待图层系统完善后实现")
	}, [])

	// 反转选区 - 临时禁用，等待图层系统完善
	const invertSelection = useCallback(() => {
		console.log("反转选区功能待图层系统完善后实现")
	}, [])

	// 全选 - 临时禁用，等待图层系统完善
	const selectAll = useCallback(() => {
		console.log("全选功能待图层系统完善后实现")
	}, [])

	// 处理鼠标滚轮缩放
	const handleWheel = useCallback(
		(e: KonvaEventObject<WheelEvent>) => {
			e.evt.preventDefault()

			if (!stageRef.current) return

			const pointer = stageRef.current.getPointerPosition()
			if (!pointer) return

			const scaleBy = 1.05
			const oldScale = viewport.scale
			const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy

			// 限制缩放范围
			const clampedScale = Math.max(0.1, Math.min(5, newScale))

			// 计算新的位置以保持鼠标位置不变
			const mousePointTo = {
				x: (pointer.x - viewport.x) / oldScale,
				y: (pointer.y - viewport.y) / oldScale,
			}

			const newPos = {
				x: pointer.x - mousePointTo.x * clampedScale,
				y: pointer.y - mousePointTo.y * clampedScale,
			}

			updateViewportTransform({
				x: newPos.x,
				y: newPos.y,
				scale: clampedScale,
			})
		},
		[viewport, updateViewportTransform]
	)

	// 文件上传按钮点击
	const handleUploadClick = useCallback(() => {
		fileInputRef.current?.click()
	}, [])

	return (
		<div ref={containerRef} className="relative w-full h-full bg-gray-100 overflow-hidden">
			{/* 隐藏的文件输入 */}
			<input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

			{/* Konva舞台 */}
			<Stage
				ref={stageRef}
				width={stageDimensions.width}
				height={stageDimensions.height}
				scaleX={viewport.scale}
				scaleY={viewport.scale}
				x={viewport.x}
				y={viewport.y}
				onWheel={handleWheel}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				className="bg-gray-200"
			>
				{/* 图层渲染器 */}
				<KonvaLayerRenderer />

				{/* 全局选区预览层 */}
				{activeSelection && <KonvaSelectionOverlay selection={activeSelection.mask} />}

				{/* 工具预览层 - 全局工具预览 */}
				<KonvaToolPreview previewData={null} />
			</Stage>

			{/* 缩放控制 */}
			<ZoomControls
				zoom={viewport.scale}
				onZoomIn={zoomControls.zoomIn}
				onZoomOut={zoomControls.zoomOut}
				onReset={zoomControls.resetZoom}
			/>

			{/* 图片加载按钮 */}
			<div className="absolute bottom-4 left-4 flex gap-2">
				<button
					onClick={loadDefaultImage}
					className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
				>
					加载默认图片
				</button>
				<button
					onClick={handleUploadClick}
					className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
				>
					上传图片
				</button>
			</div>
		</div>
	)
})

KonvaCanvas.displayName = "KonvaCanvas"
export default KonvaCanvas
