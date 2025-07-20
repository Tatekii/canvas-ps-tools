export enum SelectionMode {
  NEW = 'new',           // 新建选区 (默认)
  ADD = 'add',           // 添加到选区 (Shift)
  SUBTRACT = 'subtract', // 从选区减去 (Alt)
  INTERSECT = 'intersect' // 与选区交集 (Shift + Alt)
}

export interface SelectionOptions {
  mode: SelectionMode;
  tolerance: number;
}
