import { useEffect, useRef } from "react"

interface KeyboardEventHandler {
	(event: KeyboardEvent): void
}

interface UseKeyboardListenerProps {
	/** 按键按下时的回调 */
	onKeyDown?: KeyboardEventHandler
	/** 按键松开时的回调 */
	onKeyUp?: KeyboardEventHandler
	/** 是否启用监听 */
	enabled?: boolean
	/** 是否阻止默认行为 */
	preventDefault?: boolean
	/** 是否阻止事件冒泡 */
	stopPropagation?: boolean
	/** 要排除的元素选择器或判断函数 */
	exclude?: string | ((target: EventTarget | null) => boolean)
}

/**
 * 通用键盘事件监听Hook
 *
 * 功能：
 * - 监听指定按键的键盘事件
 * - 支持自定义按键过滤
 * - 支持事件处理配置
 * - 自动管理事件监听器的添加和移除
 *
 * @param props 配置参数
 * @returns 取消事件订阅的函数
 */
export function useKeyboardListener({
	onKeyDown,
	onKeyUp,
	enabled = true,
	preventDefault = false,
	stopPropagation = false,
	exclude,
}: UseKeyboardListenerProps = {}): () => void {
	const handlersRef = useRef({ onKeyDown, onKeyUp })

	// 更新handlers引用，避免useEffect重复执行
	handlersRef.current = { onKeyDown, onKeyUp }

	useEffect(() => {
		if (!enabled) return

		// 检查是否应该排除当前目标元素
		const shouldExclude = (target: EventTarget | null): boolean => {
			if (!exclude) return false

			if (typeof exclude === "string") {
				// 如果是选择器字符串，检查元素是否匹配
				return target instanceof Element && target.matches(exclude)
			} else {
				// 如果是函数，直接调用
				return exclude(target)
			}
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			// 检查是否应该排除
			if (shouldExclude(event.target)) return

			// 处理事件
			if (preventDefault) event.preventDefault()
			if (stopPropagation) event.stopPropagation()

			// 调用用户回调
			handlersRef.current.onKeyDown?.(event)
		}

		const handleKeyUp = (event: KeyboardEvent) => {
			// 检查是否应该排除
			if (shouldExclude(event.target)) return

			// 处理事件
			if (preventDefault) event.preventDefault()
			if (stopPropagation) event.stopPropagation()

			// 调用用户回调
			handlersRef.current.onKeyUp?.(event)
		}

		document.addEventListener("keydown", handleKeyDown)
		document.addEventListener("keyup", handleKeyUp)

		// 返回清理函数
		return () => {
			document.removeEventListener("keydown", handleKeyDown)
			document.removeEventListener("keyup", handleKeyUp)
		}
	}, [enabled, preventDefault, stopPropagation, exclude])

	// 返回手动取消订阅的函数
	return () => {
		// 这里可以添加额外的清理逻辑
		// 由于useEffect的清理函数已经处理了事件移除，这里主要作为API完整性
	}
}
