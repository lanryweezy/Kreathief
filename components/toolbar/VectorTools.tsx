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
    onBooleanOperation?: (operation: 'union' | 'subtract' | 'intersect' | 'exclude') => void;
    isPro?: boolean;
    onOpenPricing?: () => void;
    documentColors?: string[];
}

export const VectorTools = React.memo(({ layer, handleUpdateLayer, onCompletePath, onBooleanOperation, isPro, onOpenPricing, documentColors }: VectorToolsProps) => {
    const isPenMode = useStore(state => state.isPenMode);
    const setPenMode = useStore(state => state.setPenMode);

    return (
        <div className="flex items-center gap-3">
            <IconButton onClick={() => onBooleanOperation?.('union')} title="Union"><Icons.Union className="w-4 h-4" /></IconButton>
            <IconButton onClick={() => onBooleanOperation?.('subtract')} title="Subtract"><Icons.Subtract className="w-4 h-4" /></IconButton>
            <IconButton onClick={() => onBooleanOperation?.('intersect')} title="Intersect"><Icons.Intersect className="w-4 h-4" /></IconButton>
            <IconButton onClick={() => onBooleanOperation?.('exclude')} title="Exclude"><Icons.Exclude className="w-4 h-4" /></IconButton>
            <Divider />
            <IconButton
                onClick={() => (window as any).toggleShapeBuilder && (window as any).toggleShapeBuilder()}
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
        </div >
    );
});
