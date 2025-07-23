import { useCallback } from "react"
import { KonvaEventObject } from "konva/lib/Node"
import { MagicWandTool } from "../utils/MagicWandTool"
import { LassoTool } from "../utils/LassoTool"
import { RectangleSelectionTool } from "../utils/RectangleSelectionTool"
import { EllipseSelectionTool } from "../utils/EllipseSelectionTool"
import { BrushSelectionTool } from "../utils/BrushSelectionTool"
import { SelectionManager } from "../utils/SelectionManager"
import { KonvaSelectionRenderer } from "../components/KonvaSelectionOverlay"
// 移除 SelectionMode 导入 - 不再需要传递 currentMode
import { getRelativePointerPosition } from "../utils/TransformUtils"
import { useKonvaMagicWandHandler } from "./useKonvaMagicWandHandler"
import { useKonvaLassoHandler } from "./useKonvaLassoHandler"
import { useKonvaRectangleHandler } from "./useKonvaRectangleHandler"
import { useKonvaEllipseHandler } from "./useKonvaEllipseHandler"
import { useKonvaBrushHandler } from "./useKonvaBrushHandler"
import { EditTools, EditToolTypes } from "../constants"
import Konva from "konva"

interface UseKonvaMouseEventProps {
	selectedTool: EditToolTypes
	image: HTMLImageElement | null
	isCanvasReady: boolean
	magicWandTool: MagicWandTool | null
	lassoTool: LassoTool | null
	rectangleTool: RectangleSelectionTool | null
	ellipseTool: EllipseSelectionTool | null
	brushTool: BrushSelectionTool | null
	selectionManager: SelectionManager | null
	konvaSelectionRenderer: KonvaSelectionRenderer | null
	// 移除 currentMode - 现在完全从鼠标事件中获取选区模式
	onSelectionChange: (hasSelection: boolean, area?: number) => void
	setSelection: (selection: ImageData | null) => void
	setIsDrawing: (isDrawing: boolean) => void
	setIsDragging: (isDragging: boolean) => void
	stageRef: React.RefObject<Konva.Stage | null>
	maxWidth: number
	maxHeight: number
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
	brushTool,
	selectionManager,
	konvaSelectionRenderer,
	// 移除 currentMode 参数 - 不再需要
	onSelectionChange,
	setSelection,
	setIsDrawing,
	setIsDragging,
	stageRef,
	maxWidth,
	maxHeight,
}: UseKonvaMouseEventProps): UseKonvaMouseEventReturn {
	// 魔术棒工具处理器
	const magicWandHandler = useKonvaMagicWandHandler({
		magicWandTool,
		selectionManager,
		konvaSelectionRenderer,
		// 移除 currentMode - 直接从鼠标事件获取
		onSelectionChange,
		setSelection,
		enabled: selectedTool === EditTools.MAGIC_WAND,
	})

	// 套索工具处理器
	const lassoHandler = useKonvaLassoHandler({
		lassoTool,
		selectionManager,
		konvaSelectionRenderer,
		// 移除 currentMode - 直接从鼠标事件获取
		onSelectionChange,
		setSelection,
		enabled: selectedTool === EditTools.LASSO,
	})

	// 矩形选区工具处理器
	const rectangleHandler = useKonvaRectangleHandler({
		rectangleTool,
		selectionManager,
		konvaSelectionRenderer,
		// 移除 currentMode - 直接从鼠标事件获取
		onSelectionChange,
		setSelection,
		enabled: selectedTool === EditTools.RECTANGLE_SELECT,
	})

	// 椭圆选区工具处理器
	const ellipseHandler = useKonvaEllipseHandler({
		ellipseTool,
		selectionManager,
		konvaSelectionRenderer,
		// 移除 currentMode - 直接从鼠标事件获取
		onSelectionChange,
		setSelection,
		enabled: selectedTool === EditTools.ELLIPSE_SELECT,
	})

	// 画笔选区工具处理器
	const brushHandler = useKonvaBrushHandler({
		brushTool,
		selectionManager,
		konvaSelectionRenderer,
		// 移除 currentMode - 直接从鼠标事件获取
		onSelectionChange,
		setSelection,
		enabled: selectedTool === EditTools.BRUSH_SELECT,
	})

	// 鼠标按下事件
	const handleMouseDown = useCallback(
		(e: KonvaEventObject<MouseEvent>) => {
			if (!image || !isCanvasReady) return

			e.evt.preventDefault()

			if (selectedTool === EditTools.MOVE) {
				setIsDragging(true)
				return
			}

			const point = stageRef.current && image ? getRelativePointerPosition(stageRef.current, image, maxWidth, maxHeight) : null
			if (!point) return

			const nativeEvent = e.evt

			// 根据当前工具分发事件
			switch (selectedTool) {
				case EditTools.MAGIC_WAND:
					magicWandHandler.handleMouseDown(point.x, point.y, nativeEvent)
					break
				case EditTools.LASSO:
					lassoHandler.handleMouseDown(point.x, point.y)
					break
				case EditTools.RECTANGLE_SELECT:
					setIsDrawing(true)
					rectangleHandler.handleMouseDown(point.x, point.y)
					break
				case EditTools.ELLIPSE_SELECT:
					setIsDrawing(true)
					ellipseHandler.handleMouseDown(point.x, point.y)
					break
				case EditTools.BRUSH_SELECT:
					setIsDrawing(true)
					brushHandler.handleMouseDown(point.x, point.y)
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
			setIsDragging,
			setIsDrawing,
			magicWandHandler,
			lassoHandler,
			rectangleHandler,
			ellipseHandler,
			brushHandler,
			stageRef,
			maxWidth,
			maxHeight,
		]
	)

	// 鼠标移动事件
	const handleMouseMove = useCallback(() => {
		if (!image || !isCanvasReady) return

		const point = stageRef.current && image ? getRelativePointerPosition(stageRef.current, image, maxWidth, maxHeight) : null
		if (!point) return

		// 根据工具类型处理移动事件
		switch (selectedTool) {
			case EditTools.LASSO:
				lassoHandler.handleMouseMove(point.x, point.y)
				break
			case EditTools.RECTANGLE_SELECT:
				if (rectangleHandler.isDrawing) {
					rectangleHandler.handleMouseMove(point.x, point.y)
				}
				break
			case EditTools.ELLIPSE_SELECT:
				if (ellipseHandler.isDrawing) {
					ellipseHandler.handleMouseMove(point.x, point.y)
				}
				break
			case EditTools.BRUSH_SELECT:
				if (brushHandler.isDrawing) {
					brushHandler.handleMouseMove(point.x, point.y)
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
		lassoHandler,
		rectangleHandler,
		ellipseHandler,
		brushHandler,
		stageRef,
		maxWidth,
		maxHeight,
	])

	// 鼠标释放事件
	const handleMouseUp = useCallback(
		(e: KonvaEventObject<MouseEvent>) => {
			// 处理拖拽结束
			setIsDragging(false)

			if (!image || !isCanvasReady) return

			const point = stageRef.current && image ? getRelativePointerPosition(stageRef.current, image, maxWidth, maxHeight) : null
			if (!point) return

			const nativeEvent = e.evt

			// 根据工具类型处理释放事件
			switch (selectedTool) {
				case EditTools.LASSO:
					lassoHandler.handleMouseUp(nativeEvent)
					break
				case EditTools.RECTANGLE_SELECT:
					if (rectangleHandler.isDrawing) {
						setIsDrawing(false)
						rectangleHandler.handleMouseUp(point.x, point.y, nativeEvent)
					}
					break
				case EditTools.ELLIPSE_SELECT:
					if (ellipseHandler.isDrawing) {
						setIsDrawing(false)
						ellipseHandler.handleMouseUp(point.x, point.y, nativeEvent)
					}
					break
				case EditTools.BRUSH_SELECT:
					if (brushHandler.isDrawing) {
						setIsDrawing(false)
						brushHandler.handleMouseUp(nativeEvent)
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
			setIsDragging,
			setIsDrawing,
			lassoHandler,
			rectangleHandler,
			ellipseHandler,
			brushHandler,
			stageRef,
			maxWidth,
			maxHeight,
		]
	)

	return {
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
	}
}
