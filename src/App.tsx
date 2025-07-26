import Toolbar from "./components/Toolbar"
import KonvaCanvas from "./components/KonvaCanvas"
import PropertyPanel from "./components/PropertyPanel"
import { LayerPanel } from "./components/LayerPanel"
// 使用 Zustand stores
import Footer from "./layout/Footer"

function App() {
	return (
		<div className="h-screen bg-gray-900 flex flex-col">
			{/* 顶部标题栏 */}
			<header className="bg-gray-800 border-b border-gray-700 px-6 py-3">
				<div className="flex items-center justify-between">
					<h1 className="text-white text-xl font-semibold">canvas-ps-tools</h1>
				</div>
			</header>

			{/* 主要内容区域 */}
			<div className="flex-1 flex min-h-0 overflow-hidden">
				<Toolbar />

				{/* 左侧图层面板 */}
				<LayerPanel />

				<KonvaCanvas />

				<PropertyPanel />
			</div>

			{/* 状态栏 */}
			<Footer />
		</div>
	)
}

export default App
