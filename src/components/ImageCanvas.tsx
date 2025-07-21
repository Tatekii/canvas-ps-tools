import React, { useRef, useEffect, useState, useCallback } from "react"
import { MagicWandTool } from "../utils/MagicWandTool"
import { LassoTool } from "../utils/LassoTool"
import { SelectionRenderer } from "../utils/SelectionRenderer"
import { SelectionManager } from "../utils/SelectionManager"
import { getShortcutHints } from "../utils/KeyboardUtils"
import { useSelectionMode } from "../hooks/useSelectionMode"
import { useMouseEvent } from "../hooks/useMouseEvent"
import { useCanvasTransform } from "../hooks/useCanvasTransform"
import { ZoomControls } from "./ZoomControls"

interface ImageCanvasRef {
	clearSelection: () => void
	deleteSelected: () => void
}

interface ImageCanvasProps {
	selectedTool: string
	tolerance: number
	onSelectionChange: (hasSelection: boolean, area?: number) => void
}

const ImageCanvas = React.forwardRef<ImageCanvasRef, ImageCanvasProps>(
	({ selectedTool, tolerance, onSelectionChange }, ref) => {
		const canvasRef = useRef<HTMLCanvasElement>(null)
		const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
		const lassoPreviewCanvasRef = useRef<HTMLCanvasElement>(null)
		const fileInputRef = useRef<HTMLInputElement>(null)
		const containerRef = useRef<HTMLDivElement>(null) // 画框容器引用

		// TODO
		const [isCanvasReady, setIsCanvasReady] = useState<boolean>(false)

		const [image, setImage] = useState<HTMLImageElement | null>(null)
		const [selection, setSelection] = useState<ImageData | null>(null)
		const [selectionManager, setSelectionManager] = useState<SelectionManager | null>(null)
		const [magicWandTool, setMagicWandTool] = useState<MagicWandTool | null>(null)
		const [lassoTool, setLassoTool] = useState<LassoTool | null>(null)
		const [selectionRenderer, setSelectionRenderer] = useState<SelectionRenderer | null>(null)

		// 使用画布变换Hook
		const canvasTransform = useCanvasTransform({
			canvasRef,
			overlayCanvasRef,
			lassoPreviewCanvasRef,
			containerRef,
			selectedTool,
			minZoom: 0.1,
			maxZoom: 5,
			zoomStep: 0.1,
			isCanvasReady
		})

		// 使用自定义Hook处理选区模式和键盘事件
		const { currentMode, shortcutText } = useSelectionMode({
			selectedTool,
			hasImage: !!image,
			enableKeyboardControl: true,
		})

		// 获取快捷键提示
		const shortcuts = getShortcutHints()

		// 使用鼠标事件处理Hook
		const { handleMouseDown, handleMouseMove, handleMouseUp } = useMouseEvent({
			selectedTool,
			image,
			magicWandTool,
			lassoTool,
			selectionManager,
			selectionRenderer,
			currentMode,
			onSelectionChange,
			setSelection,
			canvasRef: overlayCanvasRef,
			containerRef,
			transformPoint: canvasTransform.transformPoint,
		})

		// 组合的鼠标事件处理
		const combinedMouseDown = useCallback(
			(event: React.MouseEvent<HTMLCanvasElement>) => {
				// 先处理画布变换（拖拽移动）
				canvasTransform.handleMouseDown(event)

				// 如果不是变换操作且不是移动工具，则处理工具操作
				if (!canvasTransform.isDragging && selectedTool !== "move" && event.button === 0) {
					handleMouseDown(event)
				}
			},
			[canvasTransform, handleMouseDown, selectedTool]
		)

		const combinedMouseMove = useCallback(
			(event: React.MouseEvent<HTMLCanvasElement>) => {
				// 先处理画布变换
				canvasTransform.handleMouseMove(event)

				// 如果不是拖拽状态且不是移动工具，则处理工具操作
				if (!canvasTransform.isDragging && selectedTool !== "move") {
					handleMouseMove(event)
				}
			},
			[canvasTransform, handleMouseMove, selectedTool]
		)

		const combinedMouseUp = useCallback(
			(event: React.MouseEvent<HTMLCanvasElement>) => {
				// 处理画布变换
				canvasTransform.handleMouseUp()

				// 如果不是移动工具，处理工具操作
				if (selectedTool !== "move") {
					handleMouseUp(event)
				}
			},
			[canvasTransform, handleMouseUp, selectedTool]
		) // 只在组件初次挂载时调用一次，用于处理没有图片时的初始化
		useEffect(() => {
			// 这个 effect 现在主要用于组件清理
			return () => {
				if (selectionRenderer) {
					selectionRenderer.destroy()
				}
			}
		}, [selectionRenderer])

		useEffect(() => {
			if (magicWandTool) {
				magicWandTool.setTolerance(tolerance)
			}
		}, [magicWandTool, tolerance])

		// 监听 image state 变化，当图片加载完成后绘制
		useEffect(() => {
			if (image) {
				console.log("image state 变化，准备绘制图片")

				const canvas = canvasRef.current
				const overlayCanvas = overlayCanvasRef.current
				const lassoPreviewCanvas = lassoPreviewCanvasRef.current

				if (canvas && overlayCanvas && lassoPreviewCanvas && image.complete && image.naturalWidth > 0) {
					const ctx = canvas.getContext("2d")
					const overlayCtx = overlayCanvas.getContext("2d")
					const lassoPreviewCtx = lassoPreviewCanvas.getContext("2d")

					if (ctx && overlayCtx && lassoPreviewCtx) {
						// 计算适合画布的图像尺寸
						const maxWidth = 1080
						const maxHeight = 720
						let { naturalWidth: width, naturalHeight: height } = image

						if (width > maxWidth || height > maxHeight) {
							const ratio = Math.min(maxWidth / width, maxHeight / height)
							width *= ratio
							height *= ratio
						}

						// 设置canvas尺寸
						canvas.width = width
						canvas.height = height
						overlayCanvas.width = width
						overlayCanvas.height = height
						lassoPreviewCanvas.width = width
						lassoPreviewCanvas.height = height

						// 重置canvas样式尺寸
						canvas.style.width = ""
						canvas.style.height = ""
						overlayCanvas.style.width = ""
						overlayCanvas.style.height = ""
						lassoPreviewCanvas.style.width = ""
						lassoPreviewCanvas.style.height = ""

						// 清除画布
						ctx.clearRect(0, 0, width, height)
						overlayCtx.clearRect(0, 0, width, height)
						lassoPreviewCtx.clearRect(0, 0, width, height)

						// 设置白色背景
						ctx.fillStyle = "white"
						ctx.fillRect(0, 0, width, height)

						// 确保图片平滑渲染
						ctx.imageSmoothingEnabled = true
						ctx.imageSmoothingQuality = "high"

						// 绘制图片
						ctx.drawImage(image, 0, 0, width, height)

						console.log("图片绘制完成!", {
							canvasSize: `${width}x${height}`,
							imageSize: `${image.naturalWidth}x${image.naturalHeight}`,
						})

						// 绘制完成后初始化工具

						// 直接在这里初始化工具，避免函数依赖
						const manager = new SelectionManager(width, height)
						const magicWand = new MagicWandTool(canvas, manager, tolerance)
						const lasso = new LassoTool(lassoPreviewCanvas, manager)
						const renderer = new SelectionRenderer(overlayCanvas)

						setSelectionManager(manager)
						setMagicWandTool(magicWand)
						setLassoTool(lasso)
						setSelectionRenderer(renderer)

						setIsCanvasReady(true)
					}
				}
			}
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [image]) // 移除tolerance依赖，避免容差变化时重新初始化工具

		// 专门处理容差变化的useEffect
		useEffect(() => {
			if (magicWandTool && tolerance !== undefined) {
				magicWandTool.setTolerance(tolerance)
			}
		}, [tolerance, magicWandTool])

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
						console.log("FileReader 加载完成")
						const img = new Image()
						img.onload = () => {
							console.log("图片 onload 触发", {
								complete: img.complete,
								naturalWidth: img.naturalWidth,
								naturalHeight: img.naturalHeight,
							})
							// 确保图片完全加载
							if (img.complete && img.naturalWidth > 0) {
								console.log("图片验证通过，开始设置state")
								setImage(img)
								// 清除之前的选区
								setSelection(null)
								onSelectionChange(false)
								// 不在这里直接调用 drawImage，而是通过 useEffect 监听 image state 变化
							} else {
								console.error("图片验证失败", {
									complete: img.complete,
									naturalWidth: img.naturalWidth,
								})
								alert("图片加载失败，请尝试其他图片")
							}
						}
						img.onerror = (error) => {
							console.error("图片加载错误:", error)
							alert("图片加载失败，请尝试其他图片")
						}
						console.log("设置图片src")
						img.src = e.target?.result as string
					}
					reader.onerror = () => {
						alert("文件读取失败，请重试")
					}
					reader.readAsDataURL(file)
				}
			},
			[onSelectionChange]
		)

		const clearSelection = useCallback(() => {
			if (selectionManager) {
				selectionManager.clearSelection()
			}
			setSelection(null)
			if (selectionRenderer) {
				selectionRenderer.clearSelection()
			}
			onSelectionChange(false)
		}, [selectionManager, selectionRenderer, onSelectionChange])

		const deleteSelected = useCallback(() => {
			if (!selection || !image) return

			const canvas = canvasRef.current
			if (canvas) {
				const ctx = canvas.getContext("2d")
				if (ctx) {
					// 使用Canvas合成模式进行高效的选区删除
					// 保存当前状态
					ctx.save()

					// 创建临时路径用于选区遮罩
					const tempCanvas = document.createElement("canvas")
					tempCanvas.width = canvas.width
					tempCanvas.height = canvas.height
					const tempCtx = tempCanvas.getContext("2d")

					if (tempCtx) {
						// 将选区绘制到临时画布
						tempCtx.putImageData(selection, 0, 0)

						// 使用合成模式删除选区
						ctx.globalCompositeOperation = "destination-out"
						ctx.drawImage(tempCanvas, 0, 0)
					} else {
						// 降级到逐像素操作
						const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
						const data = imageData.data
						const selectionData = selection.data

						for (let i = 0; i < selectionData.length; i += 4) {
							if (selectionData[i + 3] > 0) {
								// 将选区内的像素设为透明
								data[i + 3] = 0
							}
						}
						ctx.putImageData(imageData, 0, 0)
					}

					// 恢复状态
					ctx.restore()
					clearSelection()
				}
			}
		}, [selection, image, clearSelection])

		const invertSelection = useCallback(() => {
			if (selectionManager) {
				selectionManager.invertSelection()
				const currentSelection = selectionManager.getCurrentSelectionAsImageData()

				// 检查是否真的有选区（不是空选区）
				if (selectionManager.hasSelection() && currentSelection) {
					setSelection(currentSelection)
					if (selectionRenderer) {
						selectionRenderer.renderSelection(currentSelection)
						const area = selectionManager.getSelectionArea()
						onSelectionChange(true, area)
					}
				} else {
					// 选区为空，清除状态
					setSelection(null)
					if (selectionRenderer) {
						selectionRenderer.clearSelection()
					}
					onSelectionChange(false)
				}
			}
		}, [selectionManager, selectionRenderer, onSelectionChange])

		const selectAll = useCallback(() => {
			if (selectionManager) {
				selectionManager.selectAll()
				const currentSelection = selectionManager.getCurrentSelectionAsImageData()

				// 检查是否真的有选区（不是空选区）
				if (selectionManager.hasSelection() && currentSelection) {
					setSelection(currentSelection)
					if (selectionRenderer) {
						selectionRenderer.renderSelection(currentSelection)
						const area = selectionManager.getSelectionArea()
						onSelectionChange(true, area)
					}
				} else {
					// 选区为空，清除状态（理论上selectAll不应该产生空选区，但为了一致性）
					setSelection(null)
					if (selectionRenderer) {
						selectionRenderer.clearSelection()
					}
					onSelectionChange(false)
				}
			}
		}, [selectionManager, selectionRenderer, onSelectionChange])

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

		return (
			<div className="flex-1 bg-gray-800 p-4 flex flex-col items-center justify-center relative">
				{!image ? (
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
							<button
								onClick={() => fileInputRef.current?.click()}
								className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
							>
								选择图片
							</button>
						</div>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={handleImageUpload}
							className="hidden"
						/>
					</div>
				) : (
					<>
						<div
							ref={containerRef}
							className="relative overflow-hidden border border-gray-600 rounded-lg shadow-lg w-[1080] h-[768]"
						>
							<canvas
								ref={canvasRef}
								style={{
									imageRendering: "crisp-edges",
									transform: `translate(${canvasTransform.offsetX}px, ${canvasTransform.offsetY}px) scale(${canvasTransform.zoom})`,
									transformOrigin: "0 0",
								}}
							/>
							<canvas
								ref={overlayCanvasRef}
								className="absolute top-0 left-0 bg-transparent pointer-events-auto"
								onMouseDown={combinedMouseDown}
								onMouseMove={combinedMouseMove}
								onMouseUp={combinedMouseUp}
								onMouseLeave={combinedMouseUp}
								style={{
									cursor: canvasTransform.isDragging
										? "grabbing"
										: selectedTool === "move"
										? "grab"
										: selectedTool === "magic-wand"
										? "crosshair"
										: selectedTool === "lasso"
										? "crosshair"
										: "default",
									transform: `translate(${canvasTransform.offsetX}px, ${canvasTransform.offsetY}px) scale(${canvasTransform.zoom})`,
									transformOrigin: "0 0",
								}}
							/>
							<canvas
								ref={lassoPreviewCanvasRef}
								className="absolute top-0 left-0 bg-transparent pointer-events-none"
								style={{
									zIndex: 10, // 确保套索预览在最上层
									transform: `translate(${canvasTransform.offsetX}px, ${canvasTransform.offsetY}px) scale(${canvasTransform.zoom})`,
									transformOrigin: "0 0",
								}}
							/>

							<div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white rounded-lg text-sm max-w-64">
								{selection && <div className="text-xs text-green-400">选区激活 ✨ </div>}
								{shortcutText && <div className="text-xs text-yellow-400 mt-2">{shortcutText}</div>}
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
							zoom={canvasTransform.zoom}
							onZoomIn={canvasTransform.zoomIn}
							onZoomOut={canvasTransform.zoomOut}
							onReset={canvasTransform.resetZoom}
						/>
					</>
				)}
			</div>
		)
	}
)

ImageCanvas.displayName = "ImageCanvas"

export default ImageCanvas
