import { SelectionMode } from "./SelectionTypes"

/**
 * 通用选区管理器
 * 负责处理所有选区的合并、交集、差集等操作
 * 与具体的选择工具解耦
 */
export class SelectionManager {
	private width: number
	private height: number
	private currentSelection: Uint8Array | null = null
	private onSelectionChanged?: (selection: ImageData | null) => void

	constructor(width: number, height: number, onSelectionChanged?: (selection: ImageData | null) => void) {
		this.width = width
		this.height = height
		this.onSelectionChanged = onSelectionChanged
	}

	/**
	 * 更新画布尺寸
	 */
	updateDimensions(width: number, height: number) {
		this.width = width
		this.height = height
		this.currentSelection = null // 清空选区
	}

	/**
	 * 获取当前选区
	 */
	getCurrentSelection(): Uint8Array | null {
		return this.currentSelection
	}

	/**
	 * 获取当前选区的ImageData格式
	 * 优化版本：缓存ImageData以避免重复转换
	 */
	getCurrentSelectionAsImageData(): ImageData | null {
		if (!this.currentSelection) return null

		// 使用更高效的批量设置方式
		const imageData = new ImageData(this.width, this.height)
		const data = imageData.data

		// 批量处理，减少循环开销
		for (let i = 0; i < this.currentSelection.length; i++) {
			if (this.currentSelection[i]) {
				const dataIndex = i * 4
				// 一次性设置所有通道
				data[dataIndex] = 255 // R
				data[dataIndex + 1] = 255 // G
				data[dataIndex + 2] = 255 // B
				data[dataIndex + 3] = 255 // A
			}
		}

		return imageData
	}

	/**
	 * 应用新的选区，根据模式与现有选区合并
	 * 优化版本：减少不必要的ImageData转换
	 */
	applySelection(newSelection: Uint8Array, mode: SelectionMode): void {
		if (!this.currentSelection || mode === SelectionMode.NEW) {
			// 新建选区或没有现有选区
			this.currentSelection = new Uint8Array(newSelection)
		} else {
			// 优先使用手动合并，避免Canvas API的开销
			this.currentSelection = this.mergeSelectionsManually(this.currentSelection, newSelection, mode)
		}

		// 延迟通知选区变化，避免频繁的ImageData转换
		if (this.onSelectionChanged) {
			// 使用requestAnimationFrame来批处理更新
			requestAnimationFrame(() => {
				if (this.onSelectionChanged) {
					const selectionImageData = this.getCurrentSelectionAsImageData()
					this.onSelectionChanged(selectionImageData)
				}
			})
		}
	}

	/**
	 * 优化的手动合并方法
	 * 针对性能进行了优化，减少分支判断
	 */
	private mergeSelectionsManually(existing: Uint8Array, newSelection: Uint8Array, mode: SelectionMode): Uint8Array {
		const result = new Uint8Array(this.width * this.height)
		const length = result.length

		// 根据模式选择最优化的合并策略
		switch (mode) {
			case SelectionMode.ADD:
				// 并集：使用位运算优化
				for (let i = 0; i < length; i++) {
					result[i] = existing[i] | newSelection[i]
				}
				break
			case SelectionMode.SUBTRACT:
				// 差集：优化分支
				for (let i = 0; i < length; i++) {
					result[i] = existing[i] && !newSelection[i] ? 1 : 0
				}
				break
			case SelectionMode.INTERSECT:
				// 交集：使用位运算优化
				for (let i = 0; i < length; i++) {
					result[i] = existing[i] & newSelection[i]
				}
				break
			default:
				// 直接复制新选区
				result.set(newSelection)
		}

		return result
	}

	/**
	 * 从ImageData应用选区
	 * 优化版本：直接处理ImageData，避免中间转换
	 */
	applySelectionFromImageData(imageData: ImageData, mode: SelectionMode): void {
		const mask = new Uint8Array(this.width * this.height)
		const data = imageData.data

		// 批量处理，减少属性访问
		for (let i = 0; i < mask.length; i++) {
			const dataIndex = i * 4
			// 检查alpha通道判断是否被选中
			mask[i] = data[dataIndex + 3] > 128 ? 1 : 0
		}

		this.applySelection(mask, mode)
	}

	/**
	 * 清空选区
	 * 优化版本：延迟通知以避免频繁更新
	 */
	clearSelection(): void {
		this.currentSelection = null

		// 使用requestAnimationFrame来批处理更新
		if (this.onSelectionChanged) {
			requestAnimationFrame(() => {
				if (this.onSelectionChanged) {
					this.onSelectionChanged(null)
				}
			})
		}
	}

	/**
	 * 反转选区
	 */
	invertSelection(): void {
		if (!this.currentSelection) {
			// 如果没有选区，创建全选
			this.currentSelection = new Uint8Array(this.width * this.height)
			this.currentSelection.fill(1)
			return
		}

		// 反转现有选区
		for (let i = 0; i < this.currentSelection.length; i++) {
			this.currentSelection[i] = this.currentSelection[i] ? 0 : 1
		}
	}

	/**
	 * 全选
	 */
	selectAll(): void {
		this.currentSelection = new Uint8Array(this.width * this.height)
		this.currentSelection.fill(1)
	}

	/**
	 * 检查是否有选区
	 */
	hasSelection(): boolean {
		if (!this.currentSelection) return false

		// 检查是否有任何像素被选中
		for (let i = 0; i < this.currentSelection.length; i++) {
			if (this.currentSelection[i]) return true
		}
		return false
	}

	/**
	 * 获取选区面积（像素数）
	 */
	getSelectionArea(): number {
		if (!this.currentSelection) return 0

		let area = 0
		for (let i = 0; i < this.currentSelection.length; i++) {
			if (this.currentSelection[i]) area++
		}
		return area
	}

	/**
	 * 扩展选区（膨胀操作）
	 */
	expandSelection(pixels: number): void {
		if (!this.currentSelection || pixels <= 0) return

		const original = new Uint8Array(this.currentSelection)

		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				const index = y * this.width + x

				if (!original[index]) {
					// 检查周围是否有选中的像素
					let shouldSelect = false

					for (let dy = -pixels; dy <= pixels && !shouldSelect; dy++) {
						for (let dx = -pixels; dx <= pixels && !shouldSelect; dx++) {
							const nx = x + dx
							const ny = y + dy

							if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
								const nIndex = ny * this.width + nx
								if (original[nIndex] && Math.abs(dx) + Math.abs(dy) <= pixels) {
									shouldSelect = true
								}
							}
						}
					}

					if (shouldSelect) {
						this.currentSelection[index] = 1
					}
				}
			}
		}
	}

	/**
	 * 收缩选区（腐蚀操作）
	 */
	contractSelection(pixels: number): void {
		if (!this.currentSelection || pixels <= 0) return

		const original = new Uint8Array(this.currentSelection)

		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				const index = y * this.width + x

				if (original[index]) {
					// 检查周围是否有未选中的像素
					let shouldDeselect = false

					for (let dy = -pixels; dy <= pixels && !shouldDeselect; dy++) {
						for (let dx = -pixels; dx <= pixels && !shouldDeselect; dx++) {
							const nx = x + dx
							const ny = y + dy

							if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
								const nIndex = ny * this.width + nx
								if (!original[nIndex] && Math.abs(dx) + Math.abs(dy) <= pixels) {
									shouldDeselect = true
								}
							} else if (Math.abs(dx) + Math.abs(dy) <= pixels) {
								// 边界外视为未选中
								shouldDeselect = true
							}
						}
					}

					if (shouldDeselect) {
						this.currentSelection[index] = 0
					}
				}
			}
		}
	}
}
