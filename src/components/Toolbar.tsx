import React from "react"
import { Move, MousePointer, Lasso, Wand2, RotateCcw, RotateCw, Redo2, LucideIcon, X } from "lucide-react"
import { EditTools, EditToolTypes } from "../constants"

interface ToolbarProps {
	selectedTool: string
	onToolSelect: (tool: EditToolTypes) => void
	onUndo: () => void
	onRedo: () => void
	onClearSelection: () => void
	onInvertSelection: () => void
	onSelectAll: () => void
	onDeleteSelected: () => void
	canUndo: boolean
	canRedo: boolean
	hasSelection: boolean
}

const tools: { id: EditToolTypes; icon: LucideIcon; name: string }[] = [
	{ id: EditTools.MOVE, icon: Move, name: "移动工具" },
	{ id: EditTools.SELECT, icon: MousePointer, name: "选择工具" },
	{ id: EditTools.LASSO, icon: Lasso, name: "套索工具" },
	{ id: EditTools.MAGIC_WAND, icon: Wand2, name: "魔术棒" },
]

const Toolbar: React.FC<ToolbarProps> = ({
	selectedTool,
	onToolSelect,
	onUndo,
	onRedo,
	onClearSelection,
	onInvertSelection,
	canUndo,
	canRedo,
	hasSelection,
}) => {
	return (
		<div className="bg-gray-900 w-16 flex flex-col items-center py-4 border-r border-gray-700">
			{/* 工具按钮 */}
			<div className="space-y-2 mb-6">
				{tools.map((tool) => (
					<button
						key={tool.id}
						onClick={() => onToolSelect(tool.id)}
						className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
							selectedTool === tool.id
								? "bg-blue-600 text-white shadow-lg"
								: "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
						}`}
						title={tool.name}
					>
						<tool.icon size={20} />
					</button>
				))}
			</div>

			{/* 分隔线 */}
			<div className="w-8 h-px bg-gray-700 mb-6"></div>

			{/* 操作按钮 */}
			<div className="space-y-2">
				<button
					onClick={onUndo}
					disabled={!canUndo}
					className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
						canUndo
							? "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
							: "bg-gray-800 text-gray-600 cursor-not-allowed"
					}`}
					title="撤销"
				>
					<RotateCcw size={18} />
				</button>

				<button
					onClick={onRedo}
					disabled={!canRedo}
					className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
						canRedo
							? "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
							: "bg-gray-800 text-gray-600 cursor-not-allowed"
					}`}
					title="重做"
				>
					<RotateCw size={18} />
				</button>

				{hasSelection && (
					<>
						{/* <button
              onClick={onSelectAll}
              className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
              title="全选"
            >
              <Square size={18} />
            </button> */}

						<button
							onClick={onInvertSelection}
							className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 bg-yellow-400 hover:text-white hover:bg-yellow-500  text-gray-400"
							title="反转选区"
						>
							<Redo2 size={18} />
						</button>

						<button
							onClick={onClearSelection}
							className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 bg-red-400 hover:text-white hover:bg-red-500 text-gray-400"
							title="清除选区"
						>
							<X size={18} />
						</button>
						{/* 
            <button
              onClick={onDeleteSelected}
              className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 bg-red-800 text-red-400 hover:bg-red-700 hover:text-red-300"
              title="删除选区"
            >
              <Trash2 size={18} />
            </button> */}
					</>
				)}
			</div>
		</div>
	)
}

export default Toolbar
