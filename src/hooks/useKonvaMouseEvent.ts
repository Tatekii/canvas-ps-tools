import { useCallback } from "react"
import { KonvaEventObject } from "konva/lib/Node"
import { MagicWandTool } from "../utils/MagicWandTool"
import { LassoTool } from "../utils/LassoTool"
import { RectangleSelectionTool } from "../utils/RectangleSelectionTool"
import { EllipseSelectionTool } from "../utils/EllipseSelectionTool"
import { SelectionManager } from "../utils/SelectionManager"
import { SelectionRenderer } from "../utils/SelectionRenderer"
import { KonvaSelectionRenderer } from "../components/KonvaSelectionOverlay"
import { SelectionMode } from "../utils/SelectionTypes"
import { useKonvaMagicWandHandler } from "./useKonvaMagicWandHandler"
import { useKonvaLassoHandler } from "./useKonvaLassoHandler"
import { useKonvaRectangleHandler } from "./useKonvaRectangleHandler"
import { useKonvaEllipseHandler } from "./useKonvaEllipseHandler"

interface UseKonvaMouseEventProps {
	selectedTool: string
	image: HTMLImageElement | null
	isCanvasReady: boolean
	magicWandTool: MagicWandTool | null
	lassoTool: LassoTool | null
	rectangleTool: RectangleSelectionTool | null
	ellipseTool: EllipseSelectionTool | null
	selectionManager: SelectionManager | null
	selectionRenderer: SelectionRenderer | null
	konvaSelectionRenderer: KonvaSelectionRenderer | null
	useKonvaRenderer: boolean
	currentMode: SelectionMode
	onSelectionChange: (hasSelection: boolean, area?: number) => void
	setSelection: (selection: ImageData | null) => void
	setIsDrawing: (isDrawing: boolean) => void
	setIsDragging: (isDragging: boolean) => void
	getRelativePointerPosition: () => { x: number; y: number } | null
}

interface UseKonvaMouseEventReturn {
	handleMouseDown: (e: KonvaEventObject<MouseEvent>) => void
	handleMouseMove: () => void
	handleMouseUp: (e: KonvaEventObject<MouseEvent>) => void
}

/**
 * Konva鼠标事件处理的统一协调器Hook
 *
 * 这个Hook作为顶层协调器，负责：
 * - 坐标获取和基础验证
 * - 根据当前工具分发事件到对应的处理器
 * - 管理拖拽和绘制状态
 * - 提供统一的Konva鼠标事件接口
 */
export function useKonvaMouseEvent({
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
}: UseKonvaMouseEventProps): UseKonvaMouseEventReturn {

	// 魔术棒工具处理器
	const magicWandHandler = useKonvaMagicWandHandler({
		magicWandTool,
		selectionManager,
		selectionRenderer,
		konvaSelectionRenderer,
		useKonvaRenderer,
		currentMode,
		onSelectionChange,
		setSelection,
		enabled: selectedTool === "magic-wand",
	})

	// 套索工具处理器
	const lassoHandler = useKonvaLassoHandler({
		lassoTool,
		selectionManager,
		selectionRenderer,
		konvaSelectionRenderer,
		useKonvaRenderer,
		currentMode,
		onSelectionChange,
		setSelection,
		enabled: selectedTool === "lasso",
	})

	// 矩形选区工具处理器
	const rectangleHandler = useKonvaRectangleHandler({
		rectangleTool,
		selectionManager,
		selectionRenderer,
		konvaSelectionRenderer,
		useKonvaRenderer,
		currentMode,
		onSelectionChange,
		setSelection,
		enabled: selectedTool === "rectangle-select",
	})

	// 椭圆选区工具处理器
	const ellipseHandler = useKonvaEllipseHandler({
		ellipseTool,
		selectionManager,
		selectionRenderer,
		konvaSelectionRenderer,
		useKonvaRenderer,
		currentMode,
		onSelectionChange,
		setSelection,
		enabled: selectedTool === "ellipse-select",
	})

	// 鼠标按下事件
	const handleMouseDown = useCallback(
		(e: KonvaEventObject<MouseEvent>) => {
			if (!image || !isCanvasReady) return

			e.evt.preventDefault()

			if (selectedTool === "move") {
				setIsDragging(true)
				return
			}

			const point = getRelativePointerPosition()
			if (!point) return

			const nativeEvent = e.evt

			// 根据当前工具分发事件
			switch (selectedTool) {
				case "magic-wand":
					magicWandHandler.handleMouseDown(point.x, point.y, nativeEvent)
					break
				case "lasso":
					lassoHandler.handleMouseDown(point.x, point.y)
					break
				case "rectangle-select":
					setIsDrawing(true)
					rectangleHandler.handleMouseDown(point.x, point.y)
					break
				case "ellipse-select":
					setIsDrawing(true)
					ellipseHandler.handleMouseDown(point.x, point.y)
					break
				default:
					// 可以在这里添加其他工具的处理
					break
			}
		},
		[
			image,
			isCanvasReady,
			selectedTool,
			getRelativePointerPosition,
			setIsDragging,
			setIsDrawing,
			magicWandHandler,
			lassoHandler,
			rectangleHandler,
			ellipseHandler,
		]
	)

	// 鼠标移动事件
	const handleMouseMove = useCallback(() => {
		if (!image || !isCanvasReady) return

		const point = getRelativePointerPosition()
		if (!point) return

		// 根据工具类型处理移动事件
		switch (selectedTool) {
			case "lasso":
				lassoHandler.handleMouseMove(point.x, point.y)
				break
			case "rectangle-select":
				if (rectangleHandler.isDrawing) {
					rectangleHandler.handleMouseMove(point.x, point.y)
				}
				break
			case "ellipse-select":
				if (ellipseHandler.isDrawing) {
					ellipseHandler.handleMouseMove(point.x, point.y)
				}
				break
			default:
				// 其他工具不需要处理移动事件
				break
		}
	}, [
		image,
		isCanvasReady,
		selectedTool,
		getRelativePointerPosition,
		lassoHandler,
		rectangleHandler,
		ellipseHandler,
	])

	// 鼠标释放事件
	const handleMouseUp = useCallback(
		(e: KonvaEventObject<MouseEvent>) => {
			// 处理拖拽结束
			setIsDragging(false)

			if (!image || !isCanvasReady) return

			const point = getRelativePointerPosition()
			if (!point) return

			const nativeEvent = e.evt

			// 根据工具类型处理释放事件
			switch (selectedTool) {
				case "lasso":
					lassoHandler.handleMouseUp(nativeEvent)
					break
				case "rectangle-select":
					if (rectangleHandler.isDrawing) {
						setIsDrawing(false)
						rectangleHandler.handleMouseUp(point.x, point.y, nativeEvent)
					}
					break
				case "ellipse-select":
					if (ellipseHandler.isDrawing) {
						setIsDrawing(false)
						ellipseHandler.handleMouseUp(point.x, point.y, nativeEvent)
					}
					break
				default:
					// 其他工具不需要处理释放事件
					break
			}
		},
		[
			image,
			isCanvasReady,
			selectedTool,
			getRelativePointerPosition,
			setIsDragging,
			setIsDrawing,
			lassoHandler,
			rectangleHandler,
			ellipseHandler,
		]
	)

	return {
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
	}
}
