import { FunctionComponent } from "react"
import { useActiveSelection, useActiveSelectionTool, useActiveTool } from "../stores"

interface FooterProps {}

const Footer: FunctionComponent<FooterProps> = () => {
	const activeTool = useActiveTool()
	const activeSelectTool = useActiveSelectionTool()

	const activeSelectionArea = useActiveSelection()

	return (
		<footer className="bg-gray-800 border-t border-gray-700 px-6 py-2">
			<div className="flex items-center justify-between text-sm text-gray-400">
				<div className="flex items-center space-x-4">
					<span>{activeTool}</span>" - "<span>{activeSelectTool}</span>
					{activeSelectionArea?.mask && <span>选区: {activeSelectionArea?.mask.toLocaleString()} 像素</span>}
				</div>
				<div>准备就绪</div>
			</div>
		</footer>
	)
}

export default Footer
