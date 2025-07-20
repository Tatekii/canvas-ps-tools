import React, { useRef, useEffect, useState, useCallback } from "react"
import { MagicWandTool } from "../utils/MagicWandTool"
import { LassoTool } from "../utils/LassoTool"
import { SelectionRenderer } from "../utils/SelectionRenderer"
import { SelectionManager } from "../utils/SelectionManager"
import { getSelectionModeFromEvent, getShortcutHints } from "../utils/KeyboardUtils"
import { useSelectionMode } from "../hooks/useSelectionMode"

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
		const fileInputRef = useRef<HTMLInputElement>(null)

		const [image, setImage] = useState<HTMLImageElement | null>(null)
		const [selection, setSelection] = useState<ImageData | null>(null)
		const [selectionManager, setSelectionManager] = useState<SelectionManager | null>(null)
		const [magicWandTool, setMagicWandTool] = useState<MagicWandTool | null>(null)
		const [lassoTool, setLassoTool] = useState<LassoTool | null>(null)
		const [selectionRenderer, setSelectionRenderer] = useState<SelectionRenderer | null>(null)
		const [isDrawing, setIsDrawing] = useState(false)

		// 使用自定义Hook处理选区模式和键盘事件
		const { currentMode, shortcutText } = useSelectionMode({
			selectedTool,
			hasImage: !!image,
			enableKeyboardControl: true,
		})

		// 获取快捷键提示
		const shortcuts = getShortcutHints()

		// 只在组件初次挂载时调用一次，用于处理没有图片时的初始化
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

				if (canvas && overlayCanvas && image.complete && image.naturalWidth > 0) {
					const ctx = canvas.getContext("2d")
					const overlayCtx = overlayCanvas.getContext("2d")

					if (ctx && overlayCtx) {
						// 计算适合画布的图像尺寸
						const maxWidth = 800
						const maxHeight = 600
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

						// 重置canvas样式尺寸
						canvas.style.width = ""
						canvas.style.height = ""
						overlayCanvas.style.width = ""
						overlayCanvas.style.height = ""

						// 清除画布
						ctx.clearRect(0, 0, width, height)
						overlayCtx.clearRect(0, 0, width, height)

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
						setTimeout(() => {
							// 直接在这里初始化工具，避免函数依赖
							const manager = new SelectionManager(width, height)
							const magicWand = new MagicWandTool(canvas, manager, tolerance)
							const lasso = new LassoTool(overlayCanvas, manager)
							const renderer = new SelectionRenderer(overlayCanvas)

							setSelectionManager(manager)
							setMagicWandTool(magicWand)
							setLassoTool(lasso)
							setSelectionRenderer(renderer)
						}, 50)
					}
				}
			}
		}, [image, tolerance]) // 只依赖必要的值

		const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
							console.error("图片验证失败", { complete: img.complete, naturalWidth: img.naturalWidth })
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
		}

		const getMousePos = (event: React.MouseEvent<HTMLCanvasElement>) => {
			const canvas = overlayCanvasRef.current
			if (canvas) {
				const rect = canvas.getBoundingClientRect()
				return {
					x: event.clientX - rect.left,
					y: event.clientY - rect.top,
				}
			}
			return { x: 0, y: 0 }
		}

		const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
			if (!image) return

			const pos = getMousePos(event)

			if (selectedTool === "magic-wand" && magicWandTool && selectionManager) {
				// 根据按键确定选区模式
				const eventMode = getSelectionModeFromEvent(event.nativeEvent)
				const actualMode = eventMode || currentMode

				const success = magicWandTool.select(pos.x, pos.y, actualMode)

				if (success) {
					// 获取当前选区用于渲染和状态更新
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
				} else {
					onSelectionChange(false)
				}
			} else if (selectedTool === "lasso" && lassoTool) {
				setIsDrawing(true)
				lassoTool.startPath(pos.x, pos.y)
			}
		}

		const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
			if (!image || !isDrawing) return

			const pos = getMousePos(event)

			if (selectedTool === "lasso" && lassoTool) {
				lassoTool.addPoint(pos.x, pos.y)
			}
		}

		const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
			if (selectedTool === "lasso" && lassoTool && isDrawing && selectionManager) {
				setIsDrawing(false)
				const mode = getSelectionModeFromEvent(event.nativeEvent) || currentMode
				const success = lassoTool.finishPath(mode)

				if (success) {
					// 获取当前选区用于渲染
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
				} else {
					onSelectionChange(false)
				}
			}
		}

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
						<div className="relative inline-block">
							<canvas
								ref={canvasRef}
								className="border border-gray-600 rounded-lg shadow-lg bg-white"
								style={{
									imageRendering: "crisp-edges",
								}}
							/>
							<canvas
								ref={overlayCanvasRef}
								className="absolute top-0 left-0 border border-gray-600 rounded-lg shadow-lg bg-transparent pointer-events-auto"
								onMouseDown={handleMouseDown}
								onMouseMove={handleMouseMove}
								onMouseUp={handleMouseUp}
								onMouseLeave={handleMouseUp}
								style={{
									cursor:
										selectedTool === "magic-wand"
											? "crosshair"
											: selectedTool === "lasso"
											? "crosshair"
											: "default",
								}}
							/>

							<div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-4 py-3 rounded-lg text-sm max-w-64">
								{selection && <div className="text-xs text-green-400">选区激活 ✨ </div>}
								{shortcutText && <div className="text-xs text-yellow-400 mt-2">{shortcutText}</div>}
							</div>
						</div>
						{/* 快捷键提示 */}
						<div className="absolute right-4 top-4 text-xs text-gray-300 border border-gray-600 p-2">
							<div className="text-xs text-gray-400 mb-1">快捷键:</div>
							<div>{shortcuts.add}</div>
							<div>{shortcuts.subtract}</div>
							<div>{shortcuts.intersect}</div>
						</div>
					</>
				)}
			</div>
		)
	}
)

ImageCanvas.displayName = "ImageCanvas"

export default ImageCanvas
