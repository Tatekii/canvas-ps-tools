import { SelectionMode } from "./SelectionTypes"

// 跨平台快捷键检测工具
export const isMac = () => {
	return typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0
}

// 检测修饰键（Windows: Ctrl, macOS: Cmd）
export const isModifierKey = (event: KeyboardEvent | MouseEvent) => {
	return isMac() ? event.metaKey : event.ctrlKey
}

// 获取修饰键名称用于显示
export const getModifierKeyName = () => {
	return isMac() ? "Cmd" : "Ctrl"
}

// 快捷键组合检测
export const isShiftModifier = (event: KeyboardEvent | MouseEvent) => {
	return event.shiftKey
}

export const isAltModifier = (event: KeyboardEvent | MouseEvent) => {
	return event.altKey
}

// 选区模式快捷键检测
// 修复版本：只有在检测到按键时才返回模式，否则返回null让工具使用currentMode
export const getSelectionModeFromEvent = (event: MouseEvent): SelectionMode | null => {
	// NOTE 注意 有些工具的完成绘制是在mouseUp时触发的
	const hasShift = isShiftModifier(event)
	const hasModifier = isModifierKey(event)

	if (hasShift && hasModifier) {
		return SelectionMode.INTERSECT // Shift + Ctrl/Cmd = 交集
	} else if (hasModifier) {
		return SelectionMode.SUBTRACT // Ctrl/Cmd = 减去
	} else if (hasShift) {
		return SelectionMode.ADD // Shift = 添加
	} else {
		return null
	}
}

// 获取快捷键提示文本
export const getShortcutHints = () => {
	const modifier = getModifierKeyName()
	return {
		new: "新建选区",
		add: "Shift + 点击 添加到选区",
		subtract: `${modifier} + 点击 从选区减去`,
		intersect: `Shift + ${modifier} + 点击 与选区交集`,
	}
}
