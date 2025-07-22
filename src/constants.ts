export const EditTools = { 
  SELECT: "select", 
  MOVE: "move", 
  LASSO: "lasso", 
  MAGIC_WAND: "magic-wand",
  RECTANGLE_SELECT: "rectangle-select",
  ELLIPSE_SELECT: "ellipse-select"
} as const

export type EditToolTypes = (typeof EditTools)[keyof typeof EditTools]
