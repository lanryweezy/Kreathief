import React from 'react';
import { Icons } from '../../constants';
import { Toolbar } from '../Toolbar';

interface EditorToolbarProps {
  showNodeGraph: boolean;
  setShowNodeGraph: (show: boolean) => void;
  setShowAIGenerate: (show: boolean) => void;
  documentColors?: string[];
  onBooleanOperation?: (operation: 'union' | 'subtract' | 'intersect' | 'exclude') => void;
  onJoinPaths?: () => void;
  onBooleanHover?: (operation: 'union' | 'subtract' | 'intersect' | 'exclude' | null) => void;
  uploadedImage: string | null;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = React.memo(
  ({
    showNodeGraph,
    setShowNodeGraph,
    setShowAIGenerate,
    documentColors = [],
    onBooleanOperation,
    onJoinPaths,
    onBooleanHover,
    uploadedImage,
  }) => {
    return (
      <div
        data-testid="toolbar"
        className="h-11 bg-surface-dark-1/90 border-b border-white/5 flex items-center z-30 w-full shrink-0 px-4 gap-4 backdrop-blur-md"
      >
        <div className="flex items-center gap-4 w-full h-full">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAIGenerate(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-lg hover:from-brand-500 hover:to-purple-500 transition-all shadow-lg shadow-brand-600/20"
            >
              <Icons.Sparkles className="w-3.5 h-3.5" />
              AI Generate
            </button>
            <button
              onClick={() => setShowNodeGraph(!showNodeGraph)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${showNodeGraph ? 'bg-brand-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
            >
              <Icons.Magic className="w-3.5 h-3.5" />
              {showNodeGraph ? 'Close' : 'Workflows'}
            </button>
          </div>
          <Toolbar
            documentColors={documentColors}
            onBooleanOperation={onBooleanOperation}
            onJoinPaths={onJoinPaths}
            onBooleanHover={onBooleanHover}
            uploadedImage={uploadedImage}
          />
        </div>
      </div>
    );
  }
);

EditorToolbar.displayName = 'EditorToolbar';
