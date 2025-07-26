import React from "react"
import {
	RotateCcw,
	RotateCw,
	LucideIcon,
	X,
	Square,
	Circle,
	Brush,
	Eraser,
	Type,
	Pipette,
	Hand,
	Lasso,
	Wand2,
	MousePointer,
} from "lucide-react"
import { 
	useCurrentTool, 
	useActiveSelection,
	useSelectionActions,
	useSetTool,
	BaseToolType,
	ToolBehavior
} from "../stores"

// 工具配置：图标、名称、默认行为
const toolConfigs: { 
	tool: BaseToolType; 
	icon: LucideIcon; 
	name: string; 
	defaultBehavior: ToolBehavior;
	color?: string; // 可选的主题色
}[] = [
	{ tool: 'rectangle', icon: Square, name: "矩形工具", defaultBehavior: 'select' },
	{ tool: 'ellipse', icon: Circle, name: "椭圆工具", defaultBehavior: 'select' },
	{ tool: 'lasso', icon: Lasso, name: "套索工具", defaultBehavior: 'select' },
	{ tool: 'magic-wand', icon: Wand2, name: "魔术棒", defaultBehavior: 'select' },
	{ tool: 'brush', icon: Brush, name: "笔刷工具", defaultBehavior: 'draw', color: 'blue' },
	{ tool: 'eraser', icon: Eraser, name: "橡皮擦", defaultBehavior: 'erase', color: 'red' },
	{ tool: 'text', icon: Type, name: "文字工具", defaultBehavior: 'draw', color: 'green' },
	{ tool: 'eyedropper', icon: Pipette, name: "吸管工具", defaultBehavior: 'sample', color: 'yellow' },
	{ tool: 'hand', icon: Hand, name: "抓手工具", defaultBehavior: 'transform', color: 'gray' }
]

const Toolbar: React.FC = () => {
	const currentTool = useCurrentTool()
	const activeSelection = useActiveSelection()
	const setTool = useSetTool()
	const { clearSelection, invertSelection } = useSelectionActions()

	const handleToolSelect = (tool: BaseToolType, behavior?: ToolBehavior) => {
		setTool(tool, behavior)
	}

	// 获取工具主题色类名
	const getToolColorClass = (tool: BaseToolType, isActive: boolean) => {
		const config = toolConfigs.find(t => t.tool === tool)
		if (!isActive) return "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
		
		switch (config?.color) {
			case 'blue': return "bg-blue-600 text-white shadow-lg"
			case 'red': return "bg-red-600 text-white shadow-lg"
			case 'green': return "bg-green-600 text-white shadow-lg"
			case 'yellow': return "bg-yellow-600 text-white shadow-lg"
			case 'purple': return "bg-purple-600 text-white shadow-lg"
			case 'gray': return "bg-gray-600 text-white shadow-lg"
			default: return "bg-blue-600 text-white shadow-lg"
		}
	}

	// TODO: 这些功能需要在相应的 store 中实现
	const handleUndo = () => {
		console.log('Undo - 待实现')
	}

	const handleRedo = () => {
		console.log('Redo - 待实现')
	}

	// 临时设置，实际应该从历史记录 store 获取
	const canUndo = false
	const canRedo = false

	return (
		<div className="bg-gray-900 w-16 flex flex-col items-center py-4 border-r border-gray-700">
			{/* 工具按钮 */}
			<div className="space-y-2 mb-6">
				{toolConfigs.map((toolConfig) => {
					const isActive = currentTool.tool === toolConfig.tool
					const Icon = toolConfig.icon
					
					return (
						<button
							key={toolConfig.tool}
							onClick={() => handleToolSelect(toolConfig.tool, toolConfig.defaultBehavior)}
							className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
								getToolColorClass(toolConfig.tool, isActive)
							}`}
							title={`${toolConfig.name} (${currentTool.behavior === toolConfig.defaultBehavior ? '当前模式' : '切换模式'})`}
						>
							<Icon size={20} />
						</button>
					)
				})}
			</div>

			{/* 分隔线 */}
			<div className="w-8 h-px bg-gray-700 mb-6"></div>

			{/* 操作按钮 */}
			<div className="space-y-2">
				<button
					onClick={handleUndo}
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
					onClick={handleRedo}
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

				{activeSelection && (
					<>
						<button
							onClick={invertSelection}
							className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 bg-yellow-400 hover:text-white hover:bg-yellow-500 text-gray-400"
							title="反转选区"
						>
							<MousePointer size={18} />
						</button>

						<button
							onClick={clearSelection}
							className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 bg-red-400 hover:text-white hover:bg-red-500 text-gray-400"
							title="清除选区"
						>
							<X size={18} />
						</button>
					</>
				)}
			</div>
		</div>
	)
}

export default Toolbar
