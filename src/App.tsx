import { useState, useRef } from "react"
import Toolbar from "./components/Toolbar"
import ImageCanvas from "./components/ImageCanvas"
import KonvaCanvas from "./components/KonvaCanvas"
import PropertyPanel from "./components/PropertyPanel"
import { EditTools, EditToolTypes } from "./constants"

interface ImageCanvasRef {
	clearSelection: () => void
	deleteSelected: () => void
	invertSelection: () => void
	selectAll: () => void
}

function App() {
	const [selectedTool, setSelectedTool] = useState<EditToolTypes>(EditTools.SELECT)
	const [tolerance, setTolerance] = useState(32)
	const [hasSelection, setHasSelection] = useState(false)
	const [selectionArea, setSelectionArea] = useState<number | undefined>()
	const [undoStack] = useState<string[]>([])
	const [redoStack] = useState<string[]>([])
	const [useKonva, setUseKonva] = useState(true) // 开关来选择Canvas类型

	const canvasRef = useRef<ImageCanvasRef>(null)

	const handleSelectionChange = (selection: boolean, area?: number) => {
		setHasSelection(selection)
		setSelectionArea(area)
	}

	const handleUndo = () => {
		// TODO: 实现撤销功能
		console.log("Undo")
	}

	const handleRedo = () => {
		// TODO: 实现重做功能
		console.log("Redo")
	}

	const handleClearSelection = () => {
		if (canvasRef.current) {
			canvasRef.current.clearSelection()
		}
	}

	const handleInvertSelection = () => {
		if (canvasRef.current) {
			canvasRef.current.invertSelection()
		}
	}

	const handleSelectAll = () => {
		if (canvasRef.current) {
			canvasRef.current.selectAll()
		}
	}

	const handleDeleteSelected = () => {
		if (canvasRef.current) {
			canvasRef.current.deleteSelected()
		}
	}

	return (
		<div className="h-screen bg-gray-900 flex flex-col">
			{/* 顶部标题栏 */}
			<header className="bg-gray-800 border-b border-gray-700 px-6 py-3">
				<div className="flex items-center justify-between">
					<h1 className="text-white text-xl font-semibold">canvas-ps-tools</h1>
					<button
						onClick={() => setUseKonva(!useKonva)}
						className={`px-3 py-1 rounded text-sm ${
							useKonva 
								? "bg-green-600 text-white" 
								: "bg-gray-600 text-gray-300"
						}`}
					>
						{useKonva ? "Konva模式" : "Canvas模式"}
					</button>
				</div>
			</header>

			{/* 主要内容区域 */}
			<div className="flex-1 flex">
				<Toolbar
					selectedTool={selectedTool}
					onToolSelect={setSelectedTool}
					onUndo={handleUndo}
					onRedo={handleRedo}
					onClearSelection={handleClearSelection}
					onInvertSelection={handleInvertSelection}
					onSelectAll={handleSelectAll}
					onDeleteSelected={handleDeleteSelected}
					canUndo={undoStack.length > 0}
					canRedo={redoStack.length > 0}
					hasSelection={hasSelection}
				/>

				{useKonva ? (
					<KonvaCanvas
						ref={canvasRef}
						selectedTool={selectedTool}
						tolerance={tolerance}
						onSelectionChange={handleSelectionChange}
					/>
				) : (
					<ImageCanvas
						ref={canvasRef}
						selectedTool={selectedTool}
						tolerance={tolerance}
						onSelectionChange={handleSelectionChange}
					/>
				)}

				<PropertyPanel
					selectedTool={selectedTool}
					tolerance={tolerance}
					onToleranceChange={setTolerance}
					selectionArea={selectionArea}
				/>
			</div>

			{/* 状态栏 */}
			<footer className="bg-gray-800 border-t border-gray-700 px-6 py-2">
				<div className="flex items-center justify-between text-sm text-gray-400">
					<div className="flex items-center space-x-4">
						<span>
							工具:{" "}
							{selectedTool === "magic-wand"
								? "魔术棒"
								: selectedTool === "lasso"
								? "套索"
								: selectedTool === "move"
								? "移动"
								: "选择"}
						</span>
						{hasSelection && selectionArea && <span>选区: {selectionArea.toLocaleString()} 像素</span>}
					</div>
					<div>准备就绪</div>
				</div>
			</footer>
		</div>
	)
}

export default App
