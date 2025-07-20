import React from "react"

interface PropertyPanelProps {
	selectedTool: string
	tolerance: number
	onToleranceChange: (value: number) => void
	selectionArea?: number
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ selectedTool, tolerance, onToleranceChange, selectionArea }) => {
	return (
		<div className="bg-gray-900 w-64 p-4 border-l border-gray-700">
			<h3 className="text-white font-semibold mb-4">属性</h3>

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
