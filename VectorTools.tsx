import React from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
import { IconButton, Divider } from './ToolbarShared';
import { MaskTools } from './MaskTools';
import { Layer } from '../../types';

interface VectorToolsProps {
  layer: Layer;
  handleUpdateLayer: (changes: any) => void;
  onCompletePath?: () => void;
  onJoinPaths?: () => void;
  onBooleanOperation?: (operation: 'union' | 'subtract' | 'intersect' | 'exclude') => void;
  onBooleanHover?: (operation: 'union' | 'subtract' | 'intersect' | 'exclude' | null) => void;
  isPro?: boolean;
  onOpenPricing?: () => void;
  documentColors?: string[];
}

export const VectorTools = React.memo(
  ({
    layer,
    handleUpdateLayer,
    onCompletePath,
    onJoinPaths,
    onBooleanOperation,
    onBooleanHover,
    isPro,
    onOpenPricing,
    documentColors,
  }: VectorToolsProps) => {
    const isPenMode = useStore((state) => state.isPenMode);

    return (
      <div className="flex items-center gap-3 flex-nowrap">
        <IconButton
          onClick={() => onBooleanOperation?.('union')}
          onMouseEnter={() => onBooleanHover?.('union')}
          onMouseLeave={() => onBooleanHover?.(null)}
          title="Union"
        >
          <Icons.Union className="w-4 h-4" />
        </IconButton>
        <IconButton
          onClick={() => onBooleanOperation?.('subtract')}
          onMouseEnter={() => onBooleanHover?.('subtract')}
          onMouseLeave={() => onBooleanHover?.(null)}
          title="Subtract"
        >
          <Icons.Subtract className="w-4 h-4" />
        </IconButton>
        <IconButton
          onClick={() => onBooleanOperation?.('intersect')}
          onMouseEnter={() => onBooleanHover?.('intersect')}
          onMouseLeave={() => onBooleanHover?.(null)}
          title="Intersect"
        >
          <Icons.Intersect className="w-4 h-4" />
        </IconButton>
        <IconButton
          onClick={() => onBooleanOperation?.('exclude')}
          onMouseEnter={() => onBooleanHover?.('exclude')}
          onMouseLeave={() => onBooleanHover?.(null)}
          title="Exclude"
        >
          <Icons.Exclude className="w-4 h-4" />
        </IconButton>
        <IconButton onClick={onJoinPaths} title="Join Paths">
          <Icons.Link className="w-4 h-4" />
        </IconButton>
        <Divider />
        <IconButton
          onClick={() => useStore.getState().setIsShapeBuilderActive(!useStore.getState().isShapeBuilderActive)}
          title="Shape Builder Tool"
        >
          <Icons.Magic className="w-4 h-4" />
        </IconButton>
        {isPenMode && (
          <button
            onClick={onCompletePath}
            className="ml-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-lg shadow-emerald-600/20 transition-all animate-pulse"
          >
            Finish Path
          </button>
        )}

        <MaskTools
          layer={layer}
          onUpdateLayer={handleUpdateLayer}
          isPro={isPro}
          onOpenPricing={onOpenPricing}
          documentColors={documentColors}
        />
      </div>
    );
  }
);

VectorTools.displayName = 'VectorTools';
