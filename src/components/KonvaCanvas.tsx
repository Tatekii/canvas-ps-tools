import React, { useRef, useEffect, useState, useCallback } from "react"
import { Stage, Layer, Image as KonvaImage } from "react-konva"
import { KonvaEventObject } from "konva/lib/Node"
import Konva from "konva"
import { SelectionManager } from "../utils/SelectionManager"
import { getShortcutHints } from "../utils/KeyboardUtils"
import { getDisplayDimensions, getCenteredPosition } from "../utils/TransformUtils"
import { useSelectionMode } from "../hooks/useSelectionMode"
import { useKonvaMouseEvent } from "../hooks/useKonvaMouseEvent"
import { ZoomControls } from "./ZoomControls"
import { KonvaSelectionOverlay, KonvaSelectionRenderer } from "./KonvaSelectionOverlay"
import { KonvaToolPreview } from "./KonvaToolPreview"
import { EditToolTypes } from "../constants"
// 导入新的 Zustand stores
import { 
  useViewport, 
  useCanvasReady,
  useZoomControls,
  usePanControls,
  useSetStageRef,
  useSetReady,
  useUpdateViewportTransform
} from "../stores/canvasStore"
import {
  useActiveSelection,
  useSelectionActions
} from "../stores/selectionStore"
import {
  useMagicWandTool,
  useLassoTool,
  useRectangleTool,
  useEllipseTool,
  useBrushTool,
  useHiddenCanvas,
  useSelectionManagerFromStore,
  useInitializeTools,
  useSetHiddenCanvas,
  useSetSelectionManager
} from "../stores/toolInstanceStore"
import {
  useImage,
  useImageDimensions,
  useCenteredPosition,
  usePreviewData,
  useSetImage,
  useSetImageDimensions,
  useSetCenteredPosition,
  useSetPreviewData
} from "../stores/imageCanvasStore"

interface KonvaCanvasRef {
	clearSelection: () => void
	deleteSelected: () => void
	invertSelection: () => void
	selectAll: () => void
}

interface KonvaCanvasProps {
	selectedTool: EditToolTypes
	tolerance: number
	onSelectionChange: (hasSelection: boolean, area?: number) => void
}

const KonvaCanvas = React.forwardRef<KonvaCanvasRef, KonvaCanvasProps>(
	({ selectedTool, tolerance, onSelectionChange }, ref) => {
		// 从 Zustand stores 获取状态
		const viewport = useViewport()
		const isCanvasReady = useCanvasReady()
		const zoomControls = useZoomControls()
		const panControls = usePanControls()
		const setStageRef = useSetStageRef()
		const setReady = useSetReady()
		const updateViewportTransform = useUpdateViewportTransform()
		
		const activeSelection = useActiveSelection()
		const selectionActions = useSelectionActions()

		// 舞台尺寸常量 (将逐步迁移到 store)
		const STAGE_WIDTH = 1080
		const STAGE_HEIGHT = 768
		const MAX_IMAGE_WIDTH = 1080
		const MAX_IMAGE_HEIGHT = 720

		const stageRef = useRef<Konva.Stage>(null)
		const fileInputRef = useRef<HTMLInputElement>(null)
		const containerRef = useRef<HTMLDivElement>(null)
		
		// 初始化 canvas store 的 stage ref
		useEffect(() => {
			if (stageRef.current) {
				setStageRef(stageRef as React.RefObject<Konva.Stage>)
			}
		}, [setStageRef])

		// Canvas相关状态 - 从 toolInstanceStore 管理
		const hiddenCanvas = useHiddenCanvas()
		const setHiddenCanvas = useSetHiddenCanvas()

		// 工具实例状态 - 从 toolInstanceStore 管理
		const image = useImage()
		const setImage = useSetImage()
		const selectionManager = useSelectionManagerFromStore()
		const setSelectionManager = useSetSelectionManager()
		const magicWandTool = useMagicWandTool()
		const lassoTool = useLassoTool()
		const rectangleTool = useRectangleTool()
		const ellipseTool = useEllipseTool()
		const brushTool = useBrushTool()
		const [konvaSelectionRenderer] = useState<KonvaSelectionRenderer | null>(null)
		const initializeTools = useInitializeTools()

		// 工具预览状态 - 从 imageCanvasStore 管理
		const previewData = usePreviewData()
		const setPreviewData = useSetPreviewData()

		// 缓存计算结果 - 从 imageCanvasStore 管理
		const imageDimensions = useImageDimensions()
		const setImageDimensions = useSetImageDimensions()
		const centeredPosition = useCenteredPosition()
		const setCenteredPosition = useSetCenteredPosition() // 使用自定义Hook处理选区模式和键盘事件
		const { currentMode, shortcutText } = useSelectionMode({
			selectedTool,
			hasImage: !!image,
			enableKeyboardControl: true,
		})

		// 获取快捷键提示
		const shortcuts = getShortcutHints()

		// 缓存图片尺寸计算
		useEffect(() => {
			if (image && image.complete && image.naturalWidth > 0) {
				const dimensions = getDisplayDimensions(image, MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT)
				const centered = getCenteredPosition(dimensions.width, dimensions.height, STAGE_WIDTH, STAGE_HEIGHT)

				setImageDimensions(dimensions)
				setCenteredPosition(centered)
			} else {
				setImageDimensions(null)
				setCenteredPosition(null)
			}
		// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [image, MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, STAGE_WIDTH, STAGE_HEIGHT])

		// 创建隐藏canvas用于工具集成
		useEffect(() => {
			if (image && image.complete && image.naturalWidth > 0 && imageDimensions && centeredPosition) {
				const { width, height } = imageDimensions

				// 创建隐藏的canvas用于图像数据和工具处理
				const canvas = document.createElement("canvas")
				canvas.width = width
				canvas.height = height
				const ctx = canvas.getContext("2d")

				if (ctx) {
					// 设置白色背景
					ctx.fillStyle = "white"
					ctx.fillRect(0, 0, width, height)

					// 绘制图像
					ctx.imageSmoothingEnabled = true
					ctx.imageSmoothingQuality = "high"
					ctx.drawImage(image, 0, 0, width, height)
				}

				setHiddenCanvas(canvas)

				// 初始化工具
				const manager = new SelectionManager(width, height)
				
				// 使用 store 初始化所有工具实例，包括预览回调
				setSelectionManager(manager)
				initializeTools(canvas, manager, tolerance, setPreviewData)

				// Canvas 准备就绪 - 使用 store 状态
				setReady(true)

				// 设置图片居中位置 - 使用 store
				panControls.panTo(centeredPosition)

				console.log("Konva Canvas: 工具初始化完成", {
					canvasSize: `${width}x${height}`,
					imageSize: `${image.naturalWidth}x${image.naturalHeight}`,
					centeredPosition: centeredPosition,
				})
			}
		// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [image, tolerance, imageDimensions, centeredPosition])

		// 处理容差变化
		useEffect(() => {
			if (magicWandTool && tolerance !== undefined) {
				magicWandTool.setTolerance(tolerance)
			}
		}, [tolerance, magicWandTool])

		// 使用统一的鼠标事件处理Hook
		const { handleMouseDown, handleMouseMove, handleMouseUp } = useKonvaMouseEvent({
			selectedTool,
			image,
			isCanvasReady,
			magicWandTool,
			lassoTool,
			rectangleTool,
			ellipseTool,
			brushTool,
			selectionManager,
			konvaSelectionRenderer: null, // 暂时设为 null，待重构
			currentMode,
			onSelectionChange,
			setSelection: () => {}, // 暂时设为空函数，待重构  
			setIsDrawing: () => {}, // 使用 tool store
			setIsDragging: () => {}, // 使用 UI state
			stageRef,
			maxWidth: MAX_IMAGE_WIDTH,
			maxHeight: MAX_IMAGE_HEIGHT,
		})

		// 处理滚轮缩放
		const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
			e.evt.preventDefault()

			const stage = stageRef.current
			if (!stage) return

			const scaleBy = 1.1
			const oldScale = viewport.scale
			const pointer = stage.getPointerPosition()

			if (!pointer) return

			const mousePointTo = {
				x: (pointer.x - viewport.x) / oldScale,
				y: (pointer.y - viewport.y) / oldScale,
			}

			const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy

			// 使用 store 的缩放功能
			updateViewportTransform({ 
				scale: Math.max(0.1, Math.min(5, newScale)),
				x: pointer.x - mousePointTo.x * newScale,
				y: pointer.y - mousePointTo.y * newScale
			})
		}, [viewport.scale, viewport.x, viewport.y, updateViewportTransform])

		// 加载默认测试图片
		const loadDefaultImage = useCallback(() => {
			const img = new Image()
			img.onload = () => {
				if (img.complete && img.naturalWidth > 0) {
					setImage(img)
					selectionActions.clearSelection() // 使用 store 清除选区
					onSelectionChange(false)
					// 重置舞台缩放，居中位置会在 useEffect 中自动计算和设置
					zoomControls.resetZoom()
				} else {
					alert("默认图片加载失败")
				}
			}
			img.onerror = () => {
				alert("默认图片加载失败，请检查文件是否存在")
			}
			img.src = "/test.png" // Vite会自动从public文件夹提供静态文件
		}, [onSelectionChange, selectionActions, zoomControls, setImage])

		const handleImageUpload = useCallback(
			(event: React.ChangeEvent<HTMLInputElement>) => {
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

					const reader = new FileReader()
					reader.onload = (e) => {
						const img = new Image()
						img.onload = () => {
							if (img.complete && img.naturalWidth > 0) {
								setImage(img)
								selectionActions.clearSelection() // 使用 store 清除选区
								onSelectionChange(false)
								// 重置舞台缩放，居中位置会在 useEffect 中自动计算和设置
								zoomControls.resetZoom()
							} else {
								alert("图片加载失败，请尝试其他图片")
							}
						}
						img.onerror = () => {
							alert("图片加载失败，请尝试其他图片")
						}
						img.src = e.target?.result as string
					}
					reader.onerror = () => {
						alert("文件读取失败，请重试")
					}
					reader.readAsDataURL(file)
				}
			},
			[onSelectionChange, selectionActions, zoomControls, setImage]
		)

		// 清除选区
		const clearSelection = useCallback(() => {
			if (selectionManager) {
				selectionManager.clearSelection()
			}
			selectionActions.clearSelection() // 使用 store

			// 清除选区显示
			if (konvaSelectionRenderer) {
				konvaSelectionRenderer.clearSelection()
			}

			onSelectionChange(false)
		}, [selectionManager, konvaSelectionRenderer, onSelectionChange, selectionActions])

		// 删除选中区域
		const deleteSelected = useCallback(() => {
			if (!activeSelection?.mask || !image || !hiddenCanvas) return

			const ctx = hiddenCanvas.getContext("2d")
			if (ctx) {
				// 使用Canvas合成模式进行高效的选区删除
				ctx.save()

				const tempCanvas = document.createElement("canvas")
				tempCanvas.width = hiddenCanvas.width
				tempCanvas.height = hiddenCanvas.height
				const tempCtx = tempCanvas.getContext("2d")

				if (tempCtx) {
					tempCtx.putImageData(activeSelection.mask, 0, 0)
					ctx.globalCompositeOperation = "destination-out"
					ctx.drawImage(tempCanvas, 0, 0)
				}

				ctx.restore()
				clearSelection()

				// 强制重新渲染stage
				if (stageRef.current) {
					stageRef.current.batchDraw()
				}
			}
		}, [activeSelection, image, hiddenCanvas, clearSelection])

		// 反转选区
		const invertSelection = useCallback(() => {
			if (selectionManager) {
				selectionManager.invertSelection()
				const currentSelection = selectionManager.getCurrentSelectionAsImageData()

				if (selectionManager.hasSelection() && currentSelection) {
					// 使用 store 创建反选选区
					// TODO: 实现选区反转逻辑
					
					const area = selectionManager.getSelectionArea()
					onSelectionChange(true, area)
				} else {
					selectionActions.clearSelection() // 使用 store

					// 清除选区显示
					if (konvaSelectionRenderer) {
						konvaSelectionRenderer.clearSelection()
					}

					onSelectionChange(false)
				}
			}
		}, [selectionManager, konvaSelectionRenderer, onSelectionChange, selectionActions])

		// 全选
		const selectAll = useCallback(() => {
			if (selectionManager) {
				selectionManager.selectAll()
				const currentSelection = selectionManager.getCurrentSelectionAsImageData()

				if (selectionManager.hasSelection() && currentSelection) {
					// 使用Konva渲染器更新选区显示
					if (konvaSelectionRenderer) {
						konvaSelectionRenderer.renderSelection(currentSelection)
					}

					const area = selectionManager.getSelectionArea()
					onSelectionChange(true, area)
				}
			}
		}, [selectionManager, konvaSelectionRenderer, onSelectionChange])

		// 缩放控制
		const zoomIn = useCallback(() => {
			zoomControls.zoomIn()
		}, [zoomControls])

		const zoomOut = useCallback(() => {
			zoomControls.zoomOut()
		}, [zoomControls])

		const resetZoom = useCallback(() => {
			if (!image || !centeredPosition) return
			zoomControls.resetZoom()
			panControls.panTo(centeredPosition)
		}, [zoomControls, panControls, image, centeredPosition])

		// 暴露方法给父组件
		React.useImperativeHandle(
			ref,
			() => ({
				clearSelection,
				deleteSelected,
				invertSelection,
				selectAll,
			}),
			[clearSelection, deleteSelected, invertSelection, selectAll]
		)

		if (!image || !imageDimensions) {
			return (
				<div className="flex-1 bg-gray-800 p-4 flex flex-col items-center justify-center relative">
					<div className="text-center">
						<div className="border-2 border-dashed border-gray-600 rounded-lg p-12 mb-4">
							<div className="text-gray-400 mb-4">
								<svg
									className="w-16 h-16 mx-auto mb-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
									/>
								</svg>
								<p className="text-lg font-medium">上传图片开始编辑</p>
								<p className="text-sm mt-2">支持 PNG, JPG, GIF 格式</p>
								<p className="text-sm mt-2">不超过10MB</p>
							</div>
							<div className="flex flex-col gap-3">
								<button
									onClick={() => fileInputRef.current?.click()}
									className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
								>
									选择图片
								</button>
								<div className="text-center">
									<span className="text-gray-500 text-sm">或者</span>
								</div>
								<button
									onClick={loadDefaultImage}
									className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
								>
									使用测试图片 (test.png)
								</button>
							</div>
						</div>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={handleImageUpload}
							className="hidden"
						/>
					</div>
				</div>
			)
		}

		const { width, height } = imageDimensions

		return (
			<div className="flex-1 bg-gray-800 p-4 flex flex-col items-center justify-center relative">
				<div
					ref={containerRef}
					className="relative overflow-hidden border border-gray-600 rounded-lg shadow-lg bg-white"
				>
					<Stage
						ref={stageRef}
						width={STAGE_WIDTH}
						height={STAGE_HEIGHT}
						draggable={selectedTool === "move"}
						onMouseDown={handleMouseDown}
						onMouseMove={handleMouseMove}
						onMouseUp={handleMouseUp}
						onWheel={handleWheel}
						scaleX={viewport.scale}
						scaleY={viewport.scale}
						x={viewport.x}
						y={viewport.y}
					>
						{/* 图像层 */}
						<Layer>
							{hiddenCanvas && <KonvaImage image={hiddenCanvas} width={width} height={height} />}
						</Layer>
						{/* 选区层 */}
						<Layer>
							<KonvaSelectionOverlay selection={activeSelection?.mask || null} />
						</Layer>
						{/* 工具预览层 */}
						{previewData && (
							<Layer>
								<KonvaToolPreview previewData={previewData} />
							</Layer>
						)}
					</Stage>

					<div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white rounded-lg text-sm max-w-64 p-2">
						{activeSelection && <div className="text-xs text-green-400">选区激活 ✨</div>}
						{shortcutText && <div className="text-xs text-yellow-400 mt-2">{shortcutText}</div>}
						<div className="text-xs text-blue-400 mt-2">
							Konva Canvas - 缩放: {Math.round(viewport.scale * 100)}%
						</div>
					</div>
				</div>

				{/* 快捷键提示 */}
				<div className="absolute right-4 bottom-4 text-xs text-gray-300 border border-gray-600 p-2">
					<div className="text-xs text-gray-400 mb-1">快捷键:</div>
					<div>{shortcuts.add}</div>
					<div>{shortcuts.subtract}</div>
					<div>{shortcuts.intersect}</div>
					<div className="text-xs text-gray-400 mt-2 mb-1">移动工具:</div>
					<div>拖拽: 移动画布</div>
					<div>滚轮: 缩放画布</div>
				</div>

				{/* 缩放控件 */}
				<ZoomControls zoom={viewport.scale} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetZoom} />
			</div>
		)
	}
)

KonvaCanvas.displayName = "KonvaCanvas"

export default KonvaCanvas
