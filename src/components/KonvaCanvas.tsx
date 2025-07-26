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

interface KonvaCanvasRef {}

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

	// 拖拽状态
	const [isDragging, setIsDragging] = useState(false)
	const dragStart = useRef({ x: 0, y: 0, stageX: 0, stageY: 0 })

	// 使用统一的鼠标事件处理 - 只更新 store，让 Stage 受控
	const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
		// 检查是否点击在空白区域（Stage本身）
		if (e.target === e.target.getStage()) {
			setIsDragging(true)
			const stage = e.target.getStage()
			if (stage) {
				const pointer = stage.getPointerPosition()
				if (pointer) {
					dragStart.current = {
						x: pointer.x,
						y: pointer.y,
						stageX: viewport.x,  // 使用 store 中的位置
						stageY: viewport.y,
					}
				}
			}
		}
	}, [viewport.x, viewport.y])
	
	const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
		if (!isDragging) return
		
		const stage = e.target.getStage()
		if (!stage) return
		
		const pointer = stage.getPointerPosition()
		if (!pointer) return
		
		const deltaX = pointer.x - dragStart.current.x
		const deltaY = pointer.y - dragStart.current.y
		
		const newPos = {
			x: dragStart.current.stageX + deltaX,
			y: dragStart.current.stageY + deltaY,
		}
		
		// 只更新 store，Stage 会通过受控属性自动更新
		updateViewportTransform({
			x: newPos.x,
			y: newPos.y,
		})
	}, [isDragging, updateViewportTransform])
	
	const handleMouseUp = useCallback(() => {
		setIsDragging(false)
	}, [])

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

	// 处理鼠标滚轮缩放 - 只更新 store，让 Stage 受控
	const handleWheel = useCallback(
		(e: KonvaEventObject<WheelEvent>) => {
			e.evt.preventDefault()

			if (!stageRef.current) return

			const stage = stageRef.current
			const pointer = stage.getPointerPosition()
			if (!pointer) return

			const scaleBy = 1.05
			const oldScale = viewport.scale  // 使用 store 中的缩放值
			const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy

			// 限制缩放范围
			const clampedScale = Math.max(0.1, Math.min(5, newScale))

			// 计算新的位置以保持鼠标位置不变
			const mousePointTo = {
				x: (pointer.x - viewport.x) / oldScale,  // 使用 store 中的位置
				y: (pointer.y - viewport.y) / oldScale,
			}

			const newPos = {
				x: pointer.x - mousePointTo.x * clampedScale,
				y: pointer.y - mousePointTo.y * clampedScale,
			}

			// 只更新 store，Stage 会通过受控属性自动更新
			updateViewportTransform({
				x: newPos.x,
				y: newPos.y,
				scale: clampedScale,
			})
		},
		[viewport.scale, viewport.x, viewport.y, updateViewportTransform]
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

			{/* 图片加载按钮 */}
			<div className="absolute bottom-4 right-4 opacity-50">
				{/* 缩放控制 */}
				<ZoomControls
					zoom={viewport.scale}
					onZoomIn={zoomControls.zoomIn}
					onZoomOut={zoomControls.zoomOut}
					onReset={zoomControls.resetZoom}
				/>
				{/* <button
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
				</button> */}
			</div>
		</div>
	)
})

KonvaCanvas.displayName = "KonvaCanvas"
export default KonvaCanvas
