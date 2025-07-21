import { ZoomIn, ZoomOut } from "lucide-react"

interface ZoomControlsProps {
	zoom: number
	onZoomIn: () => void
	onZoomOut: () => void
	onReset: () => void
	minZoom?: number
	maxZoom?: number
}

/**
 * 缩放控制组件
 * 提供缩放按钮和当前缩放比例显示
 */
export function ZoomControls({ zoom, onZoomIn, onZoomOut, onReset, minZoom = 0.1, maxZoom = 5 }: ZoomControlsProps) {
	const zoomPercentage = Math.round(zoom * 100)
	const canZoomIn = zoom < maxZoom
	const canZoomOut = zoom > minZoom

	return (
		<div className="flex flex-col gap-2 p-2 bg-gray-900 border border-gray-600 rounded-lg text-xs text-gray-300">
			<div className="flex items-center gap-2">
				<button
					onClick={onZoomOut}
					disabled={!canZoomOut}
					className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
					title="缩小"
				>
					<ZoomOut />
				</button>

				<button
					onClick={onReset}
					className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors min-w-12 text-center"
					title="重置缩放 (100%)"
				>
					{zoomPercentage}%
				</button>

				<button
					onClick={onZoomIn}
					disabled={!canZoomIn}
					className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
					title="放大"
				>
					<ZoomIn />
				</button>
			</div>
		</div>
	)
}
