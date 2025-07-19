import React from 'react';
import { Move, MousePointer, Lasso, Wand2, RotateCcw, RotateCw, Trash2, ToggleLeft } from 'lucide-react';

interface ToolbarProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClearSelection: () => void;
  onInvertSelection: () => void;
  onDeleteSelected: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  onToolSelect,
  onUndo,
  onRedo,
  onClearSelection,
  onInvertSelection,
  onDeleteSelected,
  canUndo,
  canRedo,
  hasSelection
}) => {
  const tools = [
    { id: 'move', icon: Move, name: '移动工具' },
    { id: 'select', icon: MousePointer, name: '选择工具' },
    { id: 'lasso', icon: Lasso, name: '套索工具' },
    { id: 'magic-wand', icon: Wand2, name: '魔术棒' },
  ];

  return (
    <div className="bg-gray-900 w-16 flex flex-col items-center py-4 border-r border-gray-700">
      {/* 工具按钮 */}
      <div className="space-y-2 mb-6">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolSelect(tool.id)}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
              selectedTool === tool.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
            title={tool.name}
          >
            <tool.icon size={20} />
          </button>
        ))}
      </div>

      {/* 分隔线 */}
      <div className="w-8 h-px bg-gray-700 mb-6"></div>

      {/* 操作按钮 */}
      <div className="space-y-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
            canUndo
              ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
          title="撤销"
        >
          <RotateCcw size={18} />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
            canRedo
              ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
          title="重做"
        >
          <RotateCw size={18} />
        </button>

        {hasSelection && (
          <>
            <button
              onClick={onClearSelection}
              className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
              title="清除选区"
            >
              <ToggleLeft size={18} />
            </button>

            <button
              onClick={onDeleteSelected}
              className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 bg-red-800 text-red-400 hover:bg-red-700 hover:text-red-300"
              title="删除选区"
            >
              <Trash2 size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Toolbar;