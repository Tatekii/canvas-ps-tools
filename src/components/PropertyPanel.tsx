import React from "react"
import { 
	useCurrentTool, 
	useCurrentBehavior,
	useBrushConfig,
	useEraserConfig,
	useSelectionConfig,
	useTextConfig,
	useUpdateBrushConfig,
	useUpdateEraserConfig,
	useUpdateSelectionConfig,
	useUpdateTextConfig,
	useSetBehavior,
	TOOL_CAPABILITIES,
	type EraserToolConfig,
	type ToolBehavior
} from "../stores"

const PropertyPanel: React.FC = () => {
	const currentTool = useCurrentTool()
	const currentBehavior = useCurrentBehavior()
	
	// 工具配置
	const brushConfig = useBrushConfig()
	const eraserConfig = useEraserConfig()
	const selectionConfig = useSelectionConfig()
	const textConfig = useTextConfig()
	
	// 配置更新方法
	const updateBrushConfig = useUpdateBrushConfig()
	const updateEraserConfig = useUpdateEraserConfig()
	const updateSelectionConfig = useUpdateSelectionConfig()
	const updateTextConfig = useUpdateTextConfig()
	const setBehavior = useSetBehavior()

	// 获取工具支持的行为模式
	const supportedBehaviors = TOOL_CAPABILITIES[currentTool.tool]

	// 渲染行为模式切换器（仅当工具支持多种行为时显示）
	const renderBehaviorSelector = () => {
		if (supportedBehaviors.length <= 1) return null

		const behaviorNames: Record<ToolBehavior, string> = {
			'select': '选择',
			'draw': '绘制',
			'erase': '擦除',
			'sample': '取样',
			'transform': '变换'
		}

		return (
			<div className="bg-gray-800 p-3 rounded mb-4">
				<h4 className="text-white font-medium text-sm mb-3">工具模式</h4>
				<div className="flex flex-wrap gap-2">
					{supportedBehaviors.map((behavior) => (
						<button
							key={behavior}
							onClick={() => setBehavior(behavior)}
							className={`px-3 py-1 text-xs rounded transition-all duration-200 ${
								currentBehavior === behavior
									? 'bg-blue-600 text-white shadow-md'
									: 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
							}`}
						>
							{behaviorNames[behavior]}
						</button>
					))}
				</div>
				<p className="text-xs text-gray-400 mt-2">
					当前模式：<span className="text-blue-400 font-medium">{behaviorNames[currentBehavior]}</span>
				</p>
			</div>
		)
	}

	// 渲染笔刷配置
	const renderBrushConfig = () => (
		<div className="space-y-4">
			<h4 className="text-white font-medium text-sm">笔刷设置</h4>
			
			{/* 笔刷大小 */}
			<div>
				<label className="block text-gray-300 text-sm mb-2">大小</label>
				<input
					type="range"
					min="1"
					max="100"
					value={brushConfig.size}
					onChange={(e) => updateBrushConfig({ size: Number(e.target.value) })}
					className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
				/>
				<div className="flex justify-between text-xs text-gray-500 mt-1">
					<span>1</span>
					<span className="text-blue-400 font-medium">{brushConfig.size}px</span>
					<span>100</span>
				</div>
			</div>

			{/* 硬度 */}
			<div>
				<label className="block text-gray-300 text-sm mb-2">硬度</label>
				<input
					type="range"
					min="0"
					max="100"
					value={brushConfig.hardness}
					onChange={(e) => updateBrushConfig({ hardness: Number(e.target.value) })}
					className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
				/>
				<div className="flex justify-between text-xs text-gray-500 mt-1">
					<span>0%</span>
					<span className="text-blue-400 font-medium">{brushConfig.hardness}%</span>
					<span>100%</span>
				</div>
			</div>

			{/* 不透明度 */}
			<div>
				<label className="block text-gray-300 text-sm mb-2">不透明度</label>
				<input
					type="range"
					min="0"
					max="100"
					value={brushConfig.opacity}
					onChange={(e) => updateBrushConfig({ opacity: Number(e.target.value) })}
					className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
				/>
				<div className="flex justify-between text-xs text-gray-500 mt-1">
					<span>0%</span>
					<span className="text-blue-400 font-medium">{brushConfig.opacity}%</span>
					<span>100%</span>
				</div>
			</div>

			{/* 流量 */}
			<div>
				<label className="block text-gray-300 text-sm mb-2">流量</label>
				<input
					type="range"
					min="0"
					max="100"
					value={brushConfig.flow}
					onChange={(e) => updateBrushConfig({ flow: Number(e.target.value) })}
					className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
				/>
				<div className="flex justify-between text-xs text-gray-500 mt-1">
					<span>0%</span>
					<span className="text-blue-400 font-medium">{brushConfig.flow}%</span>
					<span>100%</span>
				</div>
			</div>

			{/* 颜色选择 */}
			<div>
				<label className="block text-gray-300 text-sm mb-2">颜色</label>
				<div className="flex items-center space-x-2">
					<input
						type="color"
						value={brushConfig.color}
						onChange={(e) => updateBrushConfig({ color: e.target.value })}
						className="w-12 h-8 rounded border border-gray-600 bg-gray-800 cursor-pointer"
					/>
					<input
						type="text"
						value={brushConfig.color}
						onChange={(e) => updateBrushConfig({ color: e.target.value })}
						className="flex-1 px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white"
						placeholder="#000000"
					/>
				</div>
			</div>
		</div>
	)

	// 渲染橡皮擦配置
	const renderEraserConfig = () => (
		<div className="space-y-4">
			<h4 className="text-white font-medium text-sm">橡皮擦设置</h4>
			
			{/* 大小 */}
			<div>
				<label className="block text-gray-300 text-sm mb-2">大小</label>
				<input
					type="range"
					min="1"
					max="100"
					value={eraserConfig.size}
					onChange={(e) => updateEraserConfig({ size: Number(e.target.value) })}
					className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
				/>
				<div className="flex justify-between text-xs text-gray-500 mt-1">
					<span>1</span>
					<span className="text-red-400 font-medium">{eraserConfig.size}px</span>
					<span>100</span>
				</div>
			</div>

			{/* 硬度 */}
			<div>
				<label className="block text-gray-300 text-sm mb-2">硬度</label>
				<input
					type="range"
					min="0"
					max="100"
					value={eraserConfig.hardness}
					onChange={(e) => updateEraserConfig({ hardness: Number(e.target.value) })}
					className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
				/>
				<div className="flex justify-between text-xs text-gray-500 mt-1">
					<span>0%</span>
					<span className="text-red-400 font-medium">{eraserConfig.hardness}%</span>
					<span>100%</span>
				</div>
			</div>

			{/* 不透明度 */}
			<div>
				<label className="block text-gray-300 text-sm mb-2">不透明度</label>
				<input
					type="range"
					min="0"
					max="100"
					value={eraserConfig.opacity}
					onChange={(e) => updateEraserConfig({ opacity: Number(e.target.value) })}
					className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
				/>
				<div className="flex justify-between text-xs text-gray-500 mt-1">
					<span>0%</span>
					<span className="text-red-400 font-medium">{eraserConfig.opacity}%</span>
					<span>100%</span>
				</div>
			</div>

			{/* 模式选择 */}
			<div>
				<label className="block text-gray-300 text-sm mb-2">模式</label>
				<select
					value={eraserConfig.mode}
					onChange={(e) => updateEraserConfig({ mode: e.target.value as EraserToolConfig['mode'] })}
					className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
				>
					<option value="normal">普通</option>
					<option value="background">擦除到背景色</option>
					<option value="block">块橡皮擦</option>
				</select>
			</div>
		</div>
	)

	// 渲染选择工具配置
	const renderSelectionConfig = () => (
		<div className="space-y-4">
			<h4 className="text-white font-medium text-sm">选择设置</h4>
			
			{/* 羽化 */}
			<div>
				<label className="block text-gray-300 text-sm mb-2">羽化</label>
				<input
					type="range"
					min="0"
					max="50"
					value={selectionConfig.feather}
					onChange={(e) => updateSelectionConfig({ feather: Number(e.target.value) })}
					className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
				/>
				<div className="flex justify-between text-xs text-gray-500 mt-1">
					<span>0</span>
					<span className="text-green-400 font-medium">{selectionConfig.feather}px</span>
					<span>50</span>
				</div>
			</div>

			{/* 魔棒工具特有设置 */}
			{currentTool.tool === 'magic-wand' && (
				<>
					{/* 容差 */}
					<div>
						<label className="block text-gray-300 text-sm mb-2">容差</label>
						<input
							type="range"
							min="0"
							max="255"
							value={selectionConfig.tolerance}
							onChange={(e) => updateSelectionConfig({ tolerance: Number(e.target.value) })}
							className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
						/>
						<div className="flex justify-between text-xs text-gray-500 mt-1">
							<span>0</span>
							<span className="text-green-400 font-medium">{selectionConfig.tolerance}</span>
							<span>255</span>
						</div>
					</div>

					{/* 连续选择 */}
					<div className="flex items-center space-x-2">
						<input
							type="checkbox"
							id="contiguous"
							checked={selectionConfig.contiguous}
							onChange={(e) => updateSelectionConfig({ contiguous: e.target.checked })}
							className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
						/>
						<label htmlFor="contiguous" className="text-gray-300 text-sm">连续选择</label>
					</div>

					{/* 对所有图层取样 */}
					<div className="flex items-center space-x-2">
						<input
							type="checkbox"
							id="sampleAllLayers"
							checked={selectionConfig.sampleAllLayers}
							onChange={(e) => updateSelectionConfig({ sampleAllLayers: e.target.checked })}
							className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
						/>
						<label htmlFor="sampleAllLayers" className="text-gray-300 text-sm">对所有图层取样</label>
					</div>
				</>
			)}

			{/* 抗锯齿 */}
			<div className="flex items-center space-x-2">
				<input
					type="checkbox"
					id="antiAlias"
					checked={selectionConfig.antiAlias}
					onChange={(e) => updateSelectionConfig({ antiAlias: e.target.checked })}
					className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
				/>
				<label htmlFor="antiAlias" className="text-gray-300 text-sm">抗锯齿</label>
			</div>
		</div>
	)

	// 渲染文字工具配置
	const renderTextConfig = () => (
		<div className="space-y-4">
			<h4 className="text-white font-medium text-sm">文字设置</h4>
			
			{/* 字体大小 */}
			<div>
				<label className="block text-gray-300 text-sm mb-2">字号</label>
				<input
					type="number"
					min="8"
					max="200"
					value={textConfig.fontSize}
					onChange={(e) => updateTextConfig({ fontSize: Number(e.target.value) })}
					className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
				/>
			</div>

			{/* 字体 */}
			<div>
				<label className="block text-gray-300 text-sm mb-2">字体</label>
				<select
					value={textConfig.fontFamily}
					onChange={(e) => updateTextConfig({ fontFamily: e.target.value })}
					className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
				>
					<option value="Arial, sans-serif">Arial</option>
					<option value="'Times New Roman', serif">Times New Roman</option>
					<option value="'Courier New', monospace">Courier New</option>
					<option value="'Helvetica Neue', sans-serif">Helvetica Neue</option>
					<option value="'PingFang SC', sans-serif">苹方</option>
					<option value="'Microsoft YaHei', sans-serif">微软雅黑</option>
				</select>
			</div>

			{/* 字重 */}
			<div>
				<label className="block text-gray-300 text-sm mb-2">字重</label>
				<select
					value={textConfig.fontWeight}
					onChange={(e) => updateTextConfig({ fontWeight: e.target.value as 'normal' | 'bold' | 'lighter' | 'bolder' })}
					className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
				>
					<option value="lighter">细体</option>
					<option value="normal">正常</option>
					<option value="bold">粗体</option>
					<option value="bolder">超粗</option>
				</select>
			</div>

			{/* 文字颜色 */}
			<div>
				<label className="block text-gray-300 text-sm mb-2">颜色</label>
				<div className="flex items-center space-x-2">
					<input
						type="color"
						value={textConfig.color}
						onChange={(e) => updateTextConfig({ color: e.target.value })}
						className="w-12 h-8 rounded border border-gray-600 bg-gray-800 cursor-pointer"
					/>
					<input
						type="text"
						value={textConfig.color}
						onChange={(e) => updateTextConfig({ color: e.target.value })}
						className="flex-1 px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white"
						placeholder="#000000"
					/>
				</div>
			</div>

			{/* 行高 */}
			<div>
				<label className="block text-gray-300 text-sm mb-2">行高</label>
				<input
					type="range"
					min="0.8"
					max="3"
					step="0.1"
					value={textConfig.lineHeight}
					onChange={(e) => updateTextConfig({ lineHeight: Number(e.target.value) })}
					className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
				/>
				<div className="flex justify-between text-xs text-gray-500 mt-1">
					<span>0.8</span>
					<span className="text-green-400 font-medium">{textConfig.lineHeight}</span>
					<span>3.0</span>
				</div>
			</div>
		</div>
	)

	// 渲染工具说明
	const renderToolDescription = () => {
		const toolDescriptions: Record<string, string> = {
			'rectangle': '矩形选择工具：拖动创建矩形选区，按住 Shift 键创建正方形选区',
			'ellipse': '椭圆选择工具：拖动创建椭圆选区，按住 Shift 键创建圆形选区',
			'lasso': '套索工具：自由绘制选区边界，适合复杂形状的选择',
			'magic-wand': '魔术棒：基于颜色相似度快速选择区域，调整容差控制选择范围',
			'brush': '笔刷工具：多功能画笔，支持绘制和选区创建两种模式',
			'eraser': '橡皮擦工具：擦除像素内容，支持多种擦除模式',
			'text': '文字工具：在画布上添加文字，支持字体、大小、颜色等设置',
			'eyedropper': '吸管工具：获取画布上的颜色样本，可用于快速选色',
			'hand': '抓手工具：平移画布视图，在空格键按下时临时激活',
			'zoom': '缩放工具：缩放画布视图，也可以使用鼠标滚轮缩放'
		}

		const behaviorDescriptions: Record<ToolBehavior, string> = {
			'select': '创建选区模式 - 使用此工具创建选择区域',
			'draw': '绘制模式 - 在画布上绘制内容',
			'erase': '擦除模式 - 擦除画布内容',
			'sample': '取样模式 - 获取颜色样本',
			'transform': '变换模式 - 移动、缩放视图'
		}

		return (
			<div className="text-sm text-gray-400 bg-gray-800 p-3 rounded">
				<div className="mb-2">
					<span className="font-medium text-gray-300">当前工具：</span>
					<span className="text-white">{currentTool.tool}</span>
				</div>
				{supportedBehaviors.length > 1 && (
					<div className="mb-2">
						<span className="font-medium text-gray-300">当前模式：</span>
						<span className="text-blue-400">{currentBehavior}</span>
					</div>
				)}
				<p className="mb-2">{toolDescriptions[currentTool.tool] || '工具描述'}</p>
				{supportedBehaviors.length > 1 && (
					<p className="text-xs text-blue-300 mb-2">
						{behaviorDescriptions[currentBehavior]}
					</p>
				)}
				{supportedBehaviors.length > 1 && (
					<div className="text-xs text-gray-500">
						<span>可用模式：</span>
						<span className="text-blue-400">{supportedBehaviors.join(' / ')}</span>
					</div>
				)}
			</div>
		)
	}

	return (
		<div className="bg-gray-900 w-64 p-4 border-l border-gray-700 overflow-y-auto">
			<h3 className="text-white font-semibold mb-4">属性面板</h3>

			{/* 行为模式选择器 - 当工具支持多种模式时显示 */}
			{renderBehaviorSelector()}

			{/* 根据当前工具和行为显示相应配置 */}
			<div className="space-y-6">
				{/* 笔刷工具配置 */}
				{currentTool.tool === 'brush' && currentBehavior === 'draw' && renderBrushConfig()}
				{currentTool.tool === 'brush' && currentBehavior === 'select' && renderSelectionConfig()}
				
				{/* 橡皮擦工具配置 */}
				{currentTool.tool === 'eraser' && renderEraserConfig()}
				
				{/* 选择工具配置 */}
				{(currentTool.tool === 'rectangle' || 
				  currentTool.tool === 'ellipse' || 
				  currentTool.tool === 'lasso' || 
				  currentTool.tool === 'magic-wand') && renderSelectionConfig()}
				
				{/* 文字工具配置 */}
				{currentTool.tool === 'text' && renderTextConfig()}

				{/* 工具说明 - 总是显示 */}
				{renderToolDescription()}
			</div>
		</div>
	)
}

export default PropertyPanel
