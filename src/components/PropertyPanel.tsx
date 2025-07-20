import React from "react"
import { SelectionMode } from "../utils/SelectionTypes"
import { Plus, Minus, Crop, Square, LucideIcon } from "lucide-react"
import { getShortcutHints } from "../utils/KeyboardUtils"

interface PropertyPanelProps {
	selectedTool: string
	tolerance: number
	onToleranceChange: (value: number) => void
	selectionArea?: number
	selectionMode: SelectionMode
	onSelectionModeChange: (mode: SelectionMode) => void
}

const selectionModesMeta: { id: SelectionMode; icon: LucideIcon; name: string; shortcut: string }[] = [
	{ id: SelectionMode.NEW, icon: Square, name: "新选区", shortcut: "" },
	{ id: SelectionMode.ADD, icon: Plus, name: "添加到选区", shortcut: "Shift" },
	{ id: SelectionMode.SUBTRACT, icon: Minus, name: "从选区减去", shortcut: "Alt" },
	{ id: SelectionMode.INTERSECT, icon: Crop, name: "与选区交叉", shortcut: "Shift+Alt" },
]

const PropertyPanel: React.FC<PropertyPanelProps> = ({
	selectedTool,
	tolerance,
	onToleranceChange,
	selectionArea,
	selectionMode,
	onSelectionModeChange,
}) => {
	const shortcuts = getShortcutHints()

	return (
		<div className="bg-gray-900 w-64 p-4 border-l border-gray-700">
			<h3 className="text-white font-semibold mb-4">属性</h3>

			{/* 选区模式控件 */}
			{(selectedTool === "magic-wand" || selectedTool === "lasso") && (
				<div className="space-y-4 mb-6">
					<div>
						<label className="block text-gray-300 text-sm mb-2">选区模式</label>
						<div className="grid grid-cols-2 gap-2">
							{selectionModesMeta.map((mode) => (
								<button
									key={mode.id}
									onClick={() => onSelectionModeChange(mode.id)}
									className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200 ${
										selectionMode === mode.id
											? "bg-blue-600 text-white shadow-lg"
											: "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
									}`}
									title={`${mode.name} ${mode.shortcut ? `(${mode.shortcut})` : ""}`}
								>
									<mode.icon size={16} />
								</button>
							))}
						</div>
						<div className="text-xs text-gray-500 mt-2">
							<p>当前: {selectionModesMeta.find((m) => m.id === selectionMode)?.name}</p>
							<div className="space-y-1 mt-2">
								<p>{shortcuts.add}</p>
								<p>{shortcuts.subtract}</p>
								<p>{shortcuts.intersect}</p>
							</div>
						</div>
					</div>
				</div>
			)}

			{selectedTool === "magic-wand" && (
				<div className="space-y-4">
					<div>
						<label className="block text-gray-300 text-sm mb-2">容差</label>
						<input
							type="range"
							min="0"
							max="100"
							value={tolerance}
							onChange={(e) => onToleranceChange(Number(e.target.value))}
							className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
						/>
						<div className="flex justify-between text-xs text-gray-500 mt-1">
							<span>0</span>
							<span className="text-blue-400 font-medium">{tolerance}</span>
							<span>100</span>
						</div>
					</div>
					<div className="text-sm text-gray-400">
						<p>容差值决定魔术棒选择相似颜色的范围。</p>
						<p>数值越高，选择范围越大。</p>
					</div>
				</div>
			)}

			{selectedTool === "lasso" && (
				<div className="space-y-4">
					<div className="text-sm text-gray-400">
						<p>使用套索工具绘制自由选区。</p>
						<p>按住鼠标左键并拖动来创建选区。</p>
					</div>
				</div>
			)}

			{selectionArea !== undefined && selectionArea > 0 && (
				<div className="mt-6 p-3 bg-gray-800 rounded-lg">
					<h4 className="text-gray-300 text-sm mb-2">选区信息</h4>
					<p className="text-blue-400 text-sm">面积: {selectionArea.toLocaleString()} 像素</p>
				</div>
			)}
		</div>
	)
}

export default PropertyPanel
