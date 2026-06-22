import React, { useRef } from 'react';
import { Icons } from '../../constants';
import { IconButton, Divider, CompactInput } from './ToolbarShared';
import { ColorPicker } from '../ColorPicker';
import { FontPicker } from '../FontPicker';
import { GlyphPalette } from '../GlyphPalette';
import { MaskTools } from './MaskTools';
import { Dropdown } from '../Dropdown';
import { QuickTextEffects } from './QuickTextEffects';
import { loadFont } from '../../services/FontLoader';
import { TextLayer } from '../../types';

interface TextToolsProps {
  layer: TextLayer;
  onUpdateTextLayer: (id: string, changes: any) => void;
  documentColors?: string[];
  onMagicWrite: (id: string) => void;
  showFontPicker: boolean;
  setShowFontPicker: (show: boolean) => void;
  fontSearch: string;
  setFontSearch: (search: string) => void;
  showRewriteTones: boolean;
  setShowRewriteTones: (show: boolean) => void;
  rewriteRef: React.RefObject<HTMLButtonElement>;
  handleToneRewrite: (id: string, instruction: string) => void;
  showTextEffects: boolean;
  setShowTextEffects: (show: boolean) => void;
  textEffectsRef: React.RefObject<HTMLButtonElement>;
  showGlyphs: boolean;
  setShowGlyphs: (show: boolean) => void;
}

export const TextTools = React.memo(
  ({
    layer,
    onUpdateTextLayer,
    documentColors,
    onMagicWrite,
    showFontPicker,
    setShowFontPicker,
    fontSearch,
    setFontSearch,
    showRewriteTones,
    setShowRewriteTones,
    rewriteRef,
    handleToneRewrite,
    showGlyphs,
    setShowGlyphs,
  }: Omit<TextToolsProps, 'fontPickerRef' | 'textEffectsRef' | 'showTextEffects' | 'setShowTextEffects'>) => {
    const fontButtonRef = useRef<HTMLButtonElement>(null);
    const [originalFont, setOriginalFont] = React.useState<string | null>(null);

    const handleHoverFont = (font: string | null) => {
      if (font) {
        if (!originalFont) {
          setOriginalFont(layer.fontFamily);
        }
        loadFont(font);
        onUpdateTextLayer(layer.id, { fontFamily: font });
      } else if (originalFont) {
        onUpdateTextLayer(layer.id, { fontFamily: originalFont });
        setOriginalFont(null);
      }
    };

    return (
      <div className="flex items-center gap-3 flex-nowrap">
        <div className="relative">
          <button
            ref={fontButtonRef}
            onClick={() => setShowFontPicker(!showFontPicker)}
            className="w-40 bg-black/20 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white text-left flex justify-between items-center hover:border-[#7d2ae8]/50 hover:bg-black/30 transition-all group"
            title="Font Family"
          >
            <span className="truncate mr-2 font-medium">{layer.fontFamily}</span>
            <Icons.ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#7d2ae8] transition-colors" />
          </button>
          <Dropdown
            anchorRef={fontButtonRef}
            isOpen={showFontPicker}
            onClose={() => setShowFontPicker(false)}
            align="left"
          >
            <div className="bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-2xl p-1 animate-fadeIn min-w-[280px] max-h-[70vh] overflow-y-auto custom-scrollbar">
              <FontPicker
                currentFont={layer.fontFamily}
                onSelectFont={(font: string) => {
                  loadFont(font);
                  onUpdateTextLayer(layer.id, { fontFamily: font });
                  setOriginalFont(null);
                  setShowFontPicker(false);
                }}
                onHoverFont={handleHoverFont}
                onClose={() => {
                  if (originalFont) {
                    onUpdateTextLayer(layer.id, { fontFamily: originalFont });
                  }
                  setOriginalFont(null);
                  setShowFontPicker(false);
                }}
                search={fontSearch}
                setSearch={setFontSearch}
              />
            </div>
          </Dropdown>
        </div>

        <CompactInput
          value={layer.fontSize}
          onChange={(e: any) => onUpdateTextLayer(layer.id, { fontSize: parseInt(e.target.value) })}
          min={8}
          max={500}
          width="w-10"
        />
        <ColorPicker
          value={layer.color}
          onChange={(color) => onUpdateTextLayer(layer.id, { color, gradient: undefined })}
          documentColors={documentColors}
        />
        <Divider />

        <IconButton
          onClick={() => onUpdateTextLayer(layer.id, { fontWeight: layer.fontWeight === 'bold' ? 'normal' : 'bold' })}
          active={layer.fontWeight === 'bold'}
          title="Bold"
        >
          <Icons.Bold className="w-3.5 h-3.5" />
        </IconButton>
        <IconButton
          onClick={() => onUpdateTextLayer(layer.id, { fontStyle: layer.fontStyle === 'italic' ? 'normal' : 'italic' })}
          active={layer.fontStyle === 'italic'}
          title="Italic"
        >
          <Icons.Italic className="w-3.5 h-3.5" />
        </IconButton>

        <CompactInput
          label="AV"
          value={layer.letterSpacing || 0}
          onChange={(e: any) => onUpdateTextLayer(layer.id, { letterSpacing: parseFloat(e.target.value) })}
          step={1}
          width="w-8"
          title="Tracking"
        />
        <CompactInput
          label="Kr"
          value={layer.kerning || 0}
          onChange={(e: any) => onUpdateTextLayer(layer.id, { kerning: parseFloat(e.target.value) })}
          step={1}
          width="w-8"
          title="Kerning"
        />
        <IconButton
          onClick={() => onUpdateTextLayer(layer.id, { ligatures: !layer.ligatures })}
          active={layer.ligatures}
          title="Standard Ligatures"
        >
          <Icons.Scissors className="w-3.5 h-3.5" />
        </IconButton>

        <CompactInput
          label="LH"
          value={layer.lineHeight || 1.2}
          onChange={(e: any) => onUpdateTextLayer(layer.id, { lineHeight: parseFloat(e.target.value) })}
          step={0.1}
          width="w-8"
          title="Line Height"
        />
        <Divider />

        <IconButton
          onClick={() => onUpdateTextLayer(layer.id, { textAlign: 'left' })}
          active={layer.textAlign === 'left'}
          title="Align Left"
        >
          <Icons.AlignLeft className="w-3.5 h-3.5" />
        </IconButton>
        <IconButton
          onClick={() => onUpdateTextLayer(layer.id, { textAlign: 'center' })}
          active={layer.textAlign === 'center'}
          title="Align Center"
        >
          <Icons.AlignCenter className="w-3.5 h-3.5" />
        </IconButton>
        <IconButton
          onClick={() => onUpdateTextLayer(layer.id, { textAlign: 'right' })}
          active={layer.textAlign === 'right'}
          title="Align Right"
        >
          <Icons.AlignRight className="w-3.5 h-3.5" />
        </IconButton>

        <div className="relative">
          <IconButton
            ref={rewriteRef as React.RefObject<HTMLButtonElement>}
            onClick={() => onMagicWrite(layer.id)}
            title="Magic Write"
            className="text-[#7d2ae8] hover:text-[#9d4edd] hover:bg-[#7d2ae8]/10"
          >
            <Icons.Sparkles className="w-3.5 h-3.5" />
          </IconButton>

          <Dropdown
            anchorRef={rewriteRef as React.RefObject<HTMLButtonElement>}
            isOpen={showRewriteTones}
            onClose={() => setShowRewriteTones(false)}
            align="center"
          >
            <div className="bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-2xl p-2 animate-fadeIn w-48 flex flex-col gap-1">
              <div className="px-2 py-1.5 border-b border-gray-700 mb-1">
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Rewrite as...</span>
              </div>
              {[
                { id: 'professional', label: 'Professional', icon: Icons.Briefcase },
                { id: 'casual', label: 'Casual', icon: Icons.MessageSquare },
                { id: 'enthusiastic', label: 'Enthusiastic', icon: Icons.Zap },
                { id: 'shorter', label: 'Make Shorter', icon: Icons.Minus },
                { id: 'longer', label: 'Make Longer', icon: Icons.Plus },
                { id: 'fix-grammar', label: 'Fix Grammar', icon: Icons.Check },
              ].map((tone) => (
                <button
                  key={tone.id}
                  onClick={() =>
                    handleToneRewrite(
                      layer.id,
                      `Rewrite the following text to be ${tone.id}. Output only the rewritten text without any quotes or explanations.`
                    )
                  }
                  className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:text-white hover:bg-[#7d2ae8] rounded-lg transition-colors flex items-center gap-2"
                >
                  {tone.icon && <tone.icon className="w-4 h-4 opacity-70" />}
                  {tone.label}
                </button>
              ))}
            </div>
          </Dropdown>
        </div>
        <Divider />

        <QuickTextEffects layer={layer} onUpdateLayer={(id, changes) => onUpdateTextLayer(id, changes)} />

        <QuickTextEffects layer={layer} onUpdateLayer={(id, changes) => onUpdateTextLayer(id, changes)} />

        <MaskTools
          layer={layer}
          onUpdateLayer={(changes: any) => onUpdateTextLayer(layer.id, changes)}
          isPro={true}
          onOpenPricing={() => {}}
          documentColors={documentColors}
        />
      </div>
    );
  }
);

TextTools.displayName = 'TextTools';
