import { useState, useRef } from 'react';
import Toolbar from './components/Toolbar';
import ImageCanvas from './components/ImageCanvas';
import PropertyPanel from './components/PropertyPanel';

interface ImageCanvasRef {
  clearSelection: () => void;
  deleteSelected: () => void;
}

function App() {
  const [selectedTool, setSelectedTool] = useState('select');
  const [tolerance, setTolerance] = useState(32);
  const [hasSelection, setHasSelection] = useState(false);
  const [selectionArea, setSelectionArea] = useState<number | undefined>();
  const [undoStack] = useState<string[]>([]);
  const [redoStack] = useState<string[]>([]);
  
  const canvasRef = useRef<ImageCanvasRef>(null);

  const handleSelectionChange = (selection: boolean, area?: number) => {
    setHasSelection(selection);
    setSelectionArea(area);
  };

  const handleUndo = () => {
    // TODO: 实现撤销功能
    console.log('Undo');
  };

  const handleRedo = () => {
    // TODO: 实现重做功能
    console.log('Redo');
  };

  const handleClearSelection = () => {
    if (canvasRef.current) {
      canvasRef.current.clearSelection();
    }
  };

  const handleInvertSelection = () => {
    // TODO: 实现反选功能
    console.log('Invert selection');
  };

  const handleDeleteSelected = () => {
    if (canvasRef.current) {
      canvasRef.current.deleteSelected();
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* 顶部标题栏 */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-xl font-semibold">在线PS工具</h1>
          <div className="text-gray-400 text-sm">
            魔术棒选区 • 套索选区 • 专业图像编辑
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <div className="flex-1 flex">
        <Toolbar
          selectedTool={selectedTool}
          onToolSelect={setSelectedTool}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClearSelection={handleClearSelection}
          onInvertSelection={handleInvertSelection}
          onDeleteSelected={handleDeleteSelected}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          hasSelection={hasSelection}
        />
        
        <ImageCanvas
          ref={canvasRef}
          selectedTool={selectedTool}
          tolerance={tolerance}
          onSelectionChange={handleSelectionChange}
        />
        
        <PropertyPanel
          selectedTool={selectedTool}
          tolerance={tolerance}
          onToleranceChange={setTolerance}
          selectionArea={selectionArea}
        />
      </div>

      {/* 状态栏 */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-2">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <span>工具: {
              selectedTool === 'magic-wand' ? '魔术棒' :
              selectedTool === 'lasso' ? '套索' :
              selectedTool === 'move' ? '移动' : '选择'
            }</span>
            {hasSelection && selectionArea && (
              <span>选区: {selectionArea.toLocaleString()} 像素</span>
            )}
          </div>
          <div>
            准备就绪
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;