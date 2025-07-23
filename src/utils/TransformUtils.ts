import Konva from 'konva'

/**
 * 计算图片的显示尺寸，保持宽高比并适应最大尺寸限制
 * @param image - 图片元素
 * @param maxWidth - 最大宽度
 * @param maxHeight - 最大高度
 * @returns 计算后的宽度和高度
 */
export function getDisplayDimensions(
  image: HTMLImageElement,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { naturalWidth: width, naturalHeight: height } = image

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height)
    width *= ratio
    height *= ratio
  }

  return { width, height }
}

/**
 * 计算图片的居中位置
 * @param imgWidth - 图片宽度
 * @param imgHeight - 图片高度
 * @param stageWidth - 舞台宽度
 * @param stageHeight - 舞台高度
 * @returns 居中位置的x和y坐标
 */
export function getCenteredPosition(
  imgWidth: number,
  imgHeight: number,
  stageWidth: number,
  stageHeight: number
): { x: number; y: number } {
  return {
    x: (stageWidth - imgWidth) / 2,
    y: (stageHeight - imgHeight) / 2
  }
}

/**
 * 获取相对于图像的鼠标坐标点
 * @param stage - Konva舞台实例
 * @param image - 图片元素
 * @param maxWidth - 最大宽度
 * @param maxHeight - 最大高度
 * @returns 相对于图像的坐标点，如果无效则返回null
 */
export function getRelativePointerPosition(
  stage: Konva.Stage,
  image: HTMLImageElement,
  maxWidth: number,
  maxHeight: number
): { x: number; y: number } | null {
  const pointerPosition = stage.getPointerPosition()
  
  if (!pointerPosition) return null

  // 考虑stage的变换
  const transform = stage.getAbsoluteTransform().copy()
  transform.invert()
  const pos = transform.point(pointerPosition)

  const { width, height } = getDisplayDimensions(image, maxWidth, maxHeight)

  // 确保坐标在图像范围内
  if (pos.x < 0 || pos.x >= width || pos.y < 0 || pos.y >= height) {
    return null
  }

  return { x: Math.floor(pos.x), y: Math.floor(pos.y) }
}
