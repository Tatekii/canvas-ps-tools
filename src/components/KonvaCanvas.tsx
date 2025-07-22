import React, { useRef, useEffect, useState, useCallback } from "react"
import { Stage, Layer, Image as KonvaImage } from "react-konva"
import { KonvaEventObject } from "konva/lib/Node"
import Konva from "konva"
import { MagicWandTool } from "../utils/MagicWandTool"
import { LassoTool } from "../utils/LassoTool"
import { RectangleSelectionTool } from "../utils/RectangleSelectionTool"
import { EllipseSelectionTool } from "../utils/EllipseSelectionTool"
import { SelectionRenderer } from "../utils/SelectionRenderer"
import { SelectionManager } from "../utils/SelectionManager"
import { getShortcutHints } from "../utils/KeyboardUtils"
import { useSelectionMode } from "../hooks/useSelectionMode"
import { useKonvaMouseEvent } from "../hooks/useKonvaMouseEvent"
import { ZoomControls } from "./ZoomControls"
import { KonvaSelectionOverlay, KonvaSelectionRenderer } from "./KonvaSelectionOverlay"
import { KonvaToolPreview, PreviewData } from "./KonvaToolPreview"

interface KonvaCanvasRef {
	clearSelection: () => void
	deleteSelected: () => void
	invertSelection: () => void
	selectAll: () => void
}

interface KonvaCanvasProps {
	selectedTool: string
	tolerance: number
	onSelectionChange: (hasSelection: boolean, area?: number) => void
}

const KonvaCanvas = React.forwardRef<KonvaCanvasRef, KonvaCanvasProps>(
	({ selectedTool, tolerance, onSelectionChange }, ref) => {
		const stageRef = useRef<Konva.Stage>(null)
		const fileInputRef = useRef<HTMLInputElement>(null)
		const containerRef = useRef<HTMLDivElement>(null)

		// Canvas相关状态 - 用于工具集成
		const [hiddenCanvas, setHiddenCanvas] = useState<HTMLCanvasElement | null>(null)

		const [isCanvasReady, setIsCanvasReady] = useState<boolean>(false)
		const [image, setImage] = useState<HTMLImageElement | null>(null)
		const [selection, setSelection] = useState<ImageData | null>(null)
		const [selectionManager, setSelectionManager] = useState<SelectionManager | null>(null)
		const [magicWandTool, setMagicWandTool] = useState<MagicWandTool | null>(null)
		const [lassoTool, setLassoTool] = useState<LassoTool | null>(null)
		const [rectangleTool, setRectangleTool] = useState<RectangleSelectionTool | null>(null)
		const [ellipseTool, setEllipseTool] = useState<EllipseSelectionTool | null>(null)
		const [selectionRenderer, setSelectionRenderer] = useState<SelectionRenderer | null>(null)
		const [konvaSelectionRenderer, setKonvaSelectionRenderer] = useState<KonvaSelectionRenderer | null>(null)

		// 工具预览状态
		const [previewData, setPreviewData] = useState<PreviewData | null>(null)
		const [isDrawing, setIsDrawing] = useState(false)

		// Konva相关状态
		const [stageScale, setStageScale] = useState(1)
		const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 })
		const [isDragging, setIsDragging] = useState(false)
		const [useKonvaRenderer, setUseKonvaRenderer] = useState(true) // 默认使用Konva渲染器

		// 使用自定义Hook处理选区模式和键盘事件
		const { currentMode, shortcutText } = useSelectionMode({
			selectedTool,
			hasImage: !!image,
			enableKeyboardControl: true,
		})

		// 获取快捷键提示
		const shortcuts = getShortcutHints()

		// 计算图片显示尺寸
		const getDisplayDimensions = useCallback((img: HTMLImageElement) => {
			const maxWidth = 1080
			const maxHeight = 720
			let { naturalWidth: width, naturalHeight: height } = img

			if (width > maxWidth || height > maxHeight) {
				const ratio = Math.min(maxWidth / width, maxHeight / height)
				width *= ratio
				height *= ratio
			}

			return { width, height }
		}, [])

		// 计算图片居中位置
		const getCenteredPosition = useCallback((imgWidth: number, imgHeight: number) => {
			const stageWidth = 1080
			const stageHeight = 768
			return {
				x: (stageWidth - imgWidth) / 2,
				y: (stageHeight - imgHeight) / 2
			}
		}, [])

		// 创建隐藏canvas用于工具集成
		useEffect(() => {
			if (image && image.complete && image.naturalWidth > 0) {
				const { width, height } = getDisplayDimensions(image)

				// 创建隐藏的canvas用于图像数据和工具处理
				const canvas = document.createElement('canvas')
				canvas.width = width
				canvas.height = height
				const ctx = canvas.getContext('2d')
				
				if (ctx) {
					// 设置白色背景
					ctx.fillStyle = 'white'
					ctx.fillRect(0, 0, width, height)
					
					// 绘制图像
					ctx.imageSmoothingEnabled = true
					ctx.imageSmoothingQuality = 'high'
					ctx.drawImage(image, 0, 0, width, height)
				}

				// 创建选区渲染用的overlay canvas
				const overlayCanvas = document.createElement('canvas')
				overlayCanvas.width = width
				overlayCanvas.height = height

				// 创建套索预览用的canvas
				const lassoCanvas = document.createElement('canvas')
				lassoCanvas.width = width
				lassoCanvas.height = height

				setHiddenCanvas(canvas)

				// 初始化工具
				const manager = new SelectionManager(width, height)
				const magicWand = new MagicWandTool(canvas, manager, tolerance)
				
				// 创建预览回调函数
				const lassoPreviewCallback = (points: [number, number][], isDrawing: boolean) => {
					if (isDrawing && points.length > 0) {
						setPreviewData({
							type: 'lasso',
							data: {
								points,
								isDrawing
							}
						})
					} else {
						setPreviewData(null)
					}
				}
				
				const lasso = new LassoTool(lassoCanvas, manager, lassoPreviewCallback)
				
				const rectanglePreviewCallback = (startX: number, startY: number, endX: number, endY: number, isDrawing: boolean) => {
					if (isDrawing) {
						setPreviewData({
							type: 'rectangle',
							data: {
								startX,
								startY,
								endX,
								endY,
								isDrawing
							}
						})
					} else {
						setPreviewData(null)
					}
				}
				
				const ellipsePreviewCallback = (centerX: number, centerY: number, radiusX: number, radiusY: number, isDrawing: boolean) => {
					if (isDrawing) {
						setPreviewData({
							type: 'ellipse',
							data: {
								centerX,
								centerY,
								radiusX,
								radiusY,
								isDrawing
							}
						})
					} else {
						setPreviewData(null)
					}
				}
				
				// 初始化新的选区工具
				const rectangle = new RectangleSelectionTool(canvas, manager, rectanglePreviewCallback)
				const ellipse = new EllipseSelectionTool(canvas, manager, ellipsePreviewCallback)
				
				const renderer = new SelectionRenderer(overlayCanvas)
				
				// 创建Konva选区渲染器
				const konvaRenderer = new KonvaSelectionRenderer((selection) => {
					setSelection(selection)
				})

				setSelectionManager(manager)
				setMagicWandTool(magicWand)
				setLassoTool(lasso)
				setRectangleTool(rectangle)
				setEllipseTool(ellipse)
				setSelectionRenderer(renderer)
				setKonvaSelectionRenderer(konvaRenderer)

				setIsCanvasReady(true)

				// 设置图片居中位置
				const centeredPos = getCenteredPosition(width, height)
				setStagePosition(centeredPos)
				if (stageRef.current) {
					stageRef.current.position(centeredPos)
				}

				console.log('Konva Canvas: 工具初始化完成', {
					canvasSize: `${width}x${height}`,
					imageSize: `${image.naturalWidth}x${image.naturalHeight}`,
					centeredPosition: centeredPos,
				})
			}
		}, [image, tolerance, getDisplayDimensions, getCenteredPosition])

		// 处理容差变化
		useEffect(() => {
			if (magicWandTool && tolerance !== undefined) {
				magicWandTool.setTolerance(tolerance)
			}
		}, [tolerance, magicWandTool])

		// 获取相对于图像的坐标点
		const getRelativePointerPosition = useCallback(() => {
			if (!stageRef.current || !image) return null

			const stage = stageRef.current
			const pointerPosition = stage.getPointerPosition()
			
			if (!pointerPosition) return null

			// 考虑stage的变换
			const transform = stage.getAbsoluteTransform().copy()
			transform.invert()
			const pos = transform.point(pointerPosition)

			const { width, height } = getDisplayDimensions(image)

			// 确保坐标在图像范围内
			if (pos.x < 0 || pos.x >= width || pos.y < 0 || pos.y >= height) {
				return null
			}

			return { x: Math.floor(pos.x), y: Math.floor(pos.y) }
		}, [image, getDisplayDimensions])

		// 使用统一的鼠标事件处理Hook
		const { handleMouseDown, handleMouseMove, handleMouseUp } = useKonvaMouseEvent({
			selectedTool,
			image,
			isCanvasReady,
			magicWandTool,
			lassoTool,
			rectangleTool,
			ellipseTool,
			selectionManager,
			selectionRenderer,
			konvaSelectionRenderer,
			useKonvaRenderer,
			currentMode,
			onSelectionChange,
			setSelection,
			setIsDrawing,
			setIsDragging,
			getRelativePointerPosition,
		})

		// 处理滚轮缩放
		const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
			e.evt.preventDefault()

			const stage = stageRef.current
			if (!stage) return

			const scaleBy = 1.1
			const oldScale = stage.scaleX()
			const pointer = stage.getPointerPosition()

			if (!pointer) return

			const mousePointTo = {
				x: (pointer.x - stage.x()) / oldScale,
				y: (pointer.y - stage.y()) / oldScale,
			}

			const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy

			// 限制缩放范围
			const clampedScale = Math.max(0.1, Math.min(5, newScale))

			stage.scale({ x: clampedScale, y: clampedScale })

			const newPos = {
				x: pointer.x - mousePointTo.x * clampedScale,
				y: pointer.y - mousePointTo.y * clampedScale,
			}

			stage.position(newPos)
			setStageScale(clampedScale)
			setStagePosition(newPos)
		}, [])

		// 加载默认测试图片
		const loadDefaultImage = useCallback(() => {
			const img = new Image()
			img.onload = () => {
				if (img.complete && img.naturalWidth > 0) {
					setImage(img)
					setSelection(null)
					onSelectionChange(false)
					// 重置舞台缩放并居中
					setStageScale(1)
					const { width, height } = getDisplayDimensions(img)
					const centeredPos = getCenteredPosition(width, height)
					setStagePosition(centeredPos)
				} else {
					alert("默认图片加载失败")
				}
			}
			img.onerror = () => {
				alert("默认图片加载失败，请检查文件是否存在")
			}
			img.src = "/test.png" // Vite会自动从public文件夹提供静态文件
		}, [onSelectionChange, getDisplayDimensions, getCenteredPosition])

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
								setSelection(null)
								onSelectionChange(false)
								// 重置舞台缩放并居中
								setStageScale(1)
								const { width, height } = getDisplayDimensions(img)
								const centeredPos = getCenteredPosition(width, height)
								setStagePosition(centeredPos)
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
			[onSelectionChange, getDisplayDimensions, getCenteredPosition]
		)

		// 清除选区
		const clearSelection = useCallback(() => {
			if (selectionManager) {
				selectionManager.clearSelection()
			}
			setSelection(null)
			
			// 清除选区显示
			if (useKonvaRenderer && konvaSelectionRenderer) {
				konvaSelectionRenderer.clearSelection()
			} else if (selectionRenderer) {
				selectionRenderer.clearSelection()
			}
			
			onSelectionChange(false)
		}, [selectionManager, selectionRenderer, konvaSelectionRenderer, useKonvaRenderer, onSelectionChange])

		// 删除选中区域
		const deleteSelected = useCallback(() => {
			if (!selection || !image || !hiddenCanvas) return

			const ctx = hiddenCanvas.getContext("2d")
			if (ctx) {
				// 使用Canvas合成模式进行高效的选区删除
				ctx.save()

				const tempCanvas = document.createElement("canvas")
				tempCanvas.width = hiddenCanvas.width
				tempCanvas.height = hiddenCanvas.height
				const tempCtx = tempCanvas.getContext("2d")

				if (tempCtx) {
					tempCtx.putImageData(selection, 0, 0)
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
		}, [selection, image, hiddenCanvas, clearSelection])

		// 反转选区
		const invertSelection = useCallback(() => {
			if (selectionManager) {
				selectionManager.invertSelection()
				const currentSelection = selectionManager.getCurrentSelectionAsImageData()

				if (selectionManager.hasSelection() && currentSelection) {
					// 根据渲染器类型更新选区显示
					if (useKonvaRenderer && konvaSelectionRenderer) {
						konvaSelectionRenderer.renderSelection(currentSelection)
					} else if (selectionRenderer) {
						selectionRenderer.renderSelection(currentSelection)
					}
					
					const area = selectionManager.getSelectionArea()
					onSelectionChange(true, area)
				} else {
					setSelection(null)
					
					// 清除选区显示
					if (useKonvaRenderer && konvaSelectionRenderer) {
						konvaSelectionRenderer.clearSelection()
					} else if (selectionRenderer) {
						selectionRenderer.clearSelection()
					}
					
					onSelectionChange(false)
				}
			}
		}, [selectionManager, selectionRenderer, konvaSelectionRenderer, useKonvaRenderer, onSelectionChange])

		// 全选
		const selectAll = useCallback(() => {
			if (selectionManager) {
				selectionManager.selectAll()
				const currentSelection = selectionManager.getCurrentSelectionAsImageData()

				if (selectionManager.hasSelection() && currentSelection) {
					// 根据渲染器类型更新选区显示
					if (useKonvaRenderer && konvaSelectionRenderer) {
						konvaSelectionRenderer.renderSelection(currentSelection)
					} else if (selectionRenderer) {
						selectionRenderer.renderSelection(currentSelection)
					}
					
					const area = selectionManager.getSelectionArea()
					onSelectionChange(true, area)
				}
			}
		}, [selectionManager, selectionRenderer, konvaSelectionRenderer, useKonvaRenderer, onSelectionChange])

		// 缩放控制
		const zoomIn = useCallback(() => {
			const stage = stageRef.current
			if (!stage) return

			const newScale = Math.min(5, stageScale * 1.2)
			stage.scale({ x: newScale, y: newScale })
			setStageScale(newScale)
		}, [stageScale])

		const zoomOut = useCallback(() => {
			const stage = stageRef.current
			if (!stage) return

			const newScale = Math.max(0.1, stageScale / 1.2)
			stage.scale({ x: newScale, y: newScale })
			setStageScale(newScale)
		}, [stageScale])

		const resetZoom = useCallback(() => {
			const stage = stageRef.current
			if (!stage || !image) return

			const { width, height } = getDisplayDimensions(image)
			const centeredPos = getCenteredPosition(width, height)

			stage.scale({ x: 1, y: 1 })
			stage.position(centeredPos)
			setStageScale(1)
			setStagePosition(centeredPos)
		}, [image, getDisplayDimensions, getCenteredPosition])

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

		if (!image) {
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

		const { width, height } = getDisplayDimensions(image)

		return (
			<div className="flex-1 bg-gray-800 p-4 flex flex-col items-center justify-center relative">
				<div
					ref={containerRef}
					className="relative overflow-hidden border border-gray-600 rounded-lg shadow-lg bg-white"
				>
					<Stage
						ref={stageRef}
						width={1080}
						height={768}
						draggable={selectedTool === "move"}
						onMouseDown={handleMouseDown}
						onMouseMove={handleMouseMove}
						onMouseUp={handleMouseUp}
						onWheel={handleWheel}
						scaleX={stageScale}
						scaleY={stageScale}
						x={stagePosition.x}
						y={stagePosition.y}
					>
						{/* 图像层 */}
						<Layer>
							{hiddenCanvas && (
								<KonvaImage
									image={hiddenCanvas}
									width={width}
									height={height}
								/>
							)}
						</Layer>
						{/* 选区层 */}
						{useKonvaRenderer && (
							<Layer>
								<KonvaSelectionOverlay selection={selection} />
							</Layer>
						)}
						{/* 工具预览层 */}
						{previewData && (
							<Layer>
								<KonvaToolPreview previewData={previewData} />
							</Layer>
						)}
					</Stage>

					<div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white rounded-lg text-sm max-w-64 p-2">
						{selection && <div className="text-xs text-green-400">选区激活 ✨</div>}
						{shortcutText && <div className="text-xs text-yellow-400 mt-2">{shortcutText}</div>}
						<div className="text-xs text-blue-400 mt-2">
							Konva Canvas - 缩放: {Math.round(stageScale * 100)}%
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
				<ZoomControls
					zoom={stageScale}
					onZoomIn={zoomIn}
					onZoomOut={zoomOut}
					onReset={resetZoom}
				/>
			</div>
		)
	}
)

KonvaCanvas.displayName = "KonvaCanvas"

export default KonvaCanvas
