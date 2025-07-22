import { useState, useCallback, useRef, useEffect } from 'react'

// 边界检测辅助函数
const clampOffset = (offset: number, canvasSize: number, containerSize: number, zoom: number): number => {
	const scaledCanvasSize = canvasSize * zoom

	// 如果画布小于容器，居中显示
	if (scaledCanvasSize <= containerSize) {
		return (containerSize - scaledCanvasSize) / 2
	}

	// 如果画布大于容器，限制移动范围
	const maxOffset = 0 // 画布左/上边缘与容器左/上边缘重合
	const minOffset = containerSize - scaledCanvasSize // 画布右/下边缘与容器右/下边缘重合

	return Math.max(minOffset, Math.min(maxOffset, offset))
}

interface UseCanvasTransformProps {
	canvasRef: React.RefObject<HTMLCanvasElement|null>
	overlayCanvasRef: React.RefObject<HTMLCanvasElement|null>
	lassoPreviewCanvasRef: React.RefObject<HTMLCanvasElement|null>
	containerRef?: React.RefObject<HTMLElement|null> // 画框容器
	selectedTool?: string // 当前选中的工具
	minZoom?: number
	maxZoom?: number
	zoomStep?: number
	isCanvasReady: boolean
}

interface UseCanvasTransformReturn {
	zoom: number
	offsetX: number
	offsetY: number
	isDragging: boolean
	zoomIn: () => void
	zoomOut: () => void
	resetZoom: () => void
	setZoom: (zoom: number) => void
	handleMouseDown: (event: React.MouseEvent) => void
	handleMouseMove: (event: React.MouseEvent) => void
	handleMouseUp: () => void
	transformPoint: (x: number, y: number) => { x: number; y: number }
	applyTransform: () => void
}

/**
 * 画布变换Hook - 处理缩放和平移
 *
 * 功能：
 * - 缩放控制（滚轮缩放、按钮缩放）
 * - 平移控制（拖拽移动）
 * - 坐标转换（屏幕坐标到画布坐标）
 * - 变换应用（更新所有canvas的transform）
 */
export function useCanvasTransform({
	canvasRef,
	overlayCanvasRef,
	lassoPreviewCanvasRef,
	containerRef,
	selectedTool,
	minZoom = 0.1,
	maxZoom = 5,
	zoomStep = 0.1,
	isCanvasReady,
}: UseCanvasTransformProps): UseCanvasTransformReturn {
	const [zoom, setZoomState] = useState(1)
	const [offsetX, setOffsetX] = useState(0)
	const [offsetY, setOffsetY] = useState(0)
	const [isDragging, setIsDragging] = useState(false)

	const lastMousePos = useRef({ x: 0, y: 0 })
	const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

	// 应用变换到所有canvas，并进行边界检测
	const applyTransform = useCallback(() => {
		const canvases = [canvasRef.current, overlayCanvasRef.current, lassoPreviewCanvasRef.current]
		const container = containerRef?.current

		// 如果有容器引用，进行边界检测
		let clampedOffsetX = offsetX
		let clampedOffsetY = offsetY

		if (container && canvasRef.current) {
			const containerRect = container.getBoundingClientRect()

			// 获取画布的原始尺寸
			const canvasWidth = canvasRef.current.width
			const canvasHeight = canvasRef.current.height

			clampedOffsetX = clampOffset(offsetX, canvasWidth, containerRect.width, zoom)
			clampedOffsetY = clampOffset(offsetY, canvasHeight, containerRect.height, zoom)

			// 如果偏移量被修正，更新状态
			if (clampedOffsetX !== offsetX || clampedOffsetY !== offsetY) {
				setOffsetX(clampedOffsetX)
				setOffsetY(clampedOffsetY)
			}
		}

		canvases.forEach((canvas) => {
			if (canvas) {
				const transform = `translate(${clampedOffsetX}px, ${clampedOffsetY}px) scale(${zoom})`
				canvas.style.transform = transform
				canvas.style.transformOrigin = "0 0"
			}
		})
	}, [canvasRef, overlayCanvasRef, lassoPreviewCanvasRef, containerRef, zoom, offsetX, offsetY])

	// 每次变换参数变化时应用变换
	useEffect(() => {
		applyTransform()
	}, [applyTransform])

	// 坐标转换：屏幕坐标到画布坐标
	// 对于 CSS transform: translate(offsetX, offsetY) scale(zoom)
	// 逆变换：(screenX - offsetX) / zoom, (screenY - offsetY) / zoom
	const transformPoint = useCallback(
		(x: number, y: number) => {
			return {
				x: (x - offsetX) / zoom,
				y: (y - offsetY) / zoom,
			}
		},
		[zoom, offsetX, offsetY]
	)

	// 缩放控制
	const setZoom = useCallback(
		(newZoom: number) => {
			const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom))
			setZoomState(clampedZoom)
		},
		[minZoom, maxZoom]
	)

	const zoomIn = useCallback(() => {
		setZoom(zoom + zoomStep)
	}, [zoom, zoomStep, setZoom])

	const zoomOut = useCallback(() => {
		setZoom(zoom - zoomStep)
	}, [zoom, zoomStep, setZoom])

	const resetZoom = useCallback(() => {
		setZoomState(1)
		setOffsetX(0)
		setOffsetY(0)
	}, [])

	// 滚轮缩放 - 需要修饰键（Mac: Cmd, Windows: Ctrl）
	// TODO 注意事件的挂载时机需要canvas加载完成
	useEffect(() => {
		if (!isCanvasReady) {
			return
		}

		const canvas = overlayCanvasRef.current

		if (!canvas) return

		const handleWheel = (event: WheelEvent) => {
			// 只有在移动工具选中时才处理滚轮缩放
			if (selectedTool !== 'move') return

			event.preventDefault()

			const rect = canvas.getBoundingClientRect()

			// 计算鼠标在画布上的位置
			const mouseX = event.clientX - rect.left
			const mouseY = event.clientY - rect.top

			// 计算缩放前鼠标在画布坐标系中的位置
			const beforeZoom = transformPoint(mouseX, mouseY)

			// 应用缩放
			const delta = -event.deltaY * 0.001
			const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom + delta))

			if (newZoom !== zoom) {
				// 计算缩放后鼠标应该在的位置
				const afterX = beforeZoom.x * newZoom + offsetX
				const afterY = beforeZoom.y * newZoom + offsetY

				// 调整偏移量，使鼠标位置保持不变
				setOffsetX(offsetX + mouseX - afterX)
				setOffsetY(offsetY + mouseY - afterY)
				setZoomState(newZoom)
			}
		}

		// 添加非被动事件监听器
		canvas.addEventListener("wheel", handleWheel, { passive: false })

		return () => {
			canvas.removeEventListener("wheel", handleWheel)
		}
	}, [zoom, offsetX, offsetY, minZoom, maxZoom, transformPoint, overlayCanvasRef, isCanvasReady, selectedTool])

	// 拖拽平移
	const handleMouseDown = useCallback(
		(event: React.MouseEvent) => {
			// 只有移动工具选中时才启用拖拽
			const isMoveToolActive = selectedTool === "move"
			
			if (isMoveToolActive && event.button === 0) {
				event.preventDefault()
				setIsDragging(true)

				const mouseX = event.clientX
				const mouseY = event.clientY

				lastMousePos.current = { x: mouseX, y: mouseY }
				dragStart.current = {
					x: mouseX,
					y: mouseY,
					offsetX,
					offsetY,
				}
			}
		},
		[selectedTool, offsetX, offsetY]
	)

	const handleMouseMove = useCallback(
		(event: React.MouseEvent) => {
			if (isDragging) {
				event.preventDefault()

				const mouseX = event.clientX
				const mouseY = event.clientY

				const deltaX = mouseX - dragStart.current.x
				const deltaY = mouseY - dragStart.current.y

				setOffsetX(dragStart.current.offsetX + deltaX)
				setOffsetY(dragStart.current.offsetY + deltaY)

				lastMousePos.current = { x: mouseX, y: mouseY }
			}
		},
		[isDragging]
	)

	const handleMouseUp = useCallback(() => {
		setIsDragging(false)
	}, [])

	return {
		zoom,
		offsetX,
		offsetY,
		isDragging,
		zoomIn,
		zoomOut,
		resetZoom,
		setZoom,
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
		transformPoint,
		applyTransform,
	}
}
