export const EditTools = { SELECT: "select", MOVE: "move", LASSO: "lasso", MAGIC_WAND: "magic-wand" } as const

export type EditToolTypes = (typeof EditTools)[keyof typeof EditTools]
