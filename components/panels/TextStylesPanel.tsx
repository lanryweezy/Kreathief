import React, { useState, useCallback } from 'react';
import { Icons } from '../../constants';
import { TextLayer } from '../../types';

export interface TextStyle {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: 'normal' | 'italic';
  textDecoration: string;
  color: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  letterSpacing: number;
  lineHeight: number;
  textTransform: 'none' | 'uppercase' | 'lowercase';
}

interface TextStylesPanelProps {
  currentStyle?: Partial<TextLayer>;
  onApplyStyle: (style: TextStyle) => void;
  onSaveStyle: (name: string, style: TextStyle) => void;
}

const DEFAULT_STYLES: TextStyle[] = [
  {
    id: 'heading-xl',
    name: 'Heading XL',
    fontFamily: 'Inter',
    fontSize: 72,
    fontWeight: '900',
    fontStyle: 'normal',
    textDecoration: 'none',
    color: '#000000',
    textAlign: 'left',
    letterSpacing: -2,
    lineHeight: 1.1,
    textTransform: 'uppercase',
  },
  {
    id: 'heading-lg',
    name: 'Heading LG',
    fontFamily: 'Inter',
    fontSize: 48,
    fontWeight: '800',
    fontStyle: 'normal',
    textDecoration: 'none',
    color: '#000000',
    textAlign: 'left',
    letterSpacing: -1,
    lineHeight: 1.2,
    textTransform: 'none',
  },
  {
    id: 'heading-md',
    name: 'Heading MD',
    fontFamily: 'Inter',
    fontSize: 32,
    fontWeight: '700',
    fontStyle: 'normal',
    textDecoration: 'none',
    color: '#000000',
    textAlign: 'left',
    letterSpacing: 0,
    lineHeight: 1.3,
    textTransform: 'none',
  },
  {
    id: 'body-lg',
    name: 'Body LG',
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '400',
    fontStyle: 'normal',
    textDecoration: 'none',
    color: '#333333',
    textAlign: 'left',
    letterSpacing: 0,
    lineHeight: 1.6,
    textTransform: 'none',
  },
  {
    id: 'body-md',
    name: 'Body MD',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
    fontStyle: 'normal',
    textDecoration: 'none',
    color: '#333333',
    textAlign: 'left',
    letterSpacing: 0,
    lineHeight: 1.5,
    textTransform: 'none',
  },
  {
    id: 'caption',
    name: 'Caption',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'normal',
    textDecoration: 'none',
    color: '#666666',
    textAlign: 'left',
    letterSpacing: 0.5,
    lineHeight: 1.4,
    textTransform: 'none',
  },
  {
    id: 'button',
    name: 'Button',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'normal',
    textDecoration: 'none',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 1,
    textTransform: 'uppercase',
  },
  {
    id: 'quote',
    name: 'Quote',
    fontFamily: 'Space Grotesk',
    fontSize: 24,
    fontWeight: '300',
    fontStyle: 'italic',
    textDecoration: 'none',
    color: '#444444',
    textAlign: 'left',
    letterSpacing: 0,
    lineHeight: 1.6,
    textTransform: 'none',
  },
];

export const TextStylesPanel = React.memo(({ currentStyle, onApplyStyle, onSaveStyle }: TextStylesPanelProps) => {
  const [styles, setStyles] = useState<TextStyle[]>(() => {
    const saved = localStorage.getItem('kreathief_text_styles');
    return saved ? JSON.parse(saved) : DEFAULT_STYLES;
  });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [styleName, setStyleName] = useState('');

  const handleSaveStyle = useCallback(() => {
    if (!styleName.trim() || !currentStyle) {
      return;
    }

    const newStyle: TextStyle = {
      id: `custom-${Date.now()}`,
      name: styleName.trim(),
      fontFamily: currentStyle.fontFamily || 'Inter',
      fontSize: currentStyle.fontSize || 16,
      fontWeight: currentStyle.fontWeight || '400',
      fontStyle: currentStyle.fontStyle || 'normal',
      textDecoration: currentStyle.textDecoration || 'none',
      color: currentStyle.color || '#000000',
      textAlign: currentStyle.textAlign || 'left',
      letterSpacing: currentStyle.letterSpacing || 0,
      lineHeight: currentStyle.lineHeight || 1.5,
      textTransform: currentStyle.textTransform || 'none',
    };

    const updated = [...styles, newStyle];
    setStyles(updated);
    localStorage.setItem('kreathief_text_styles', JSON.stringify(updated));
    onSaveStyle(styleName, newStyle);
    setShowSaveModal(false);
    setStyleName('');
  }, [styleName, currentStyle, styles, onSaveStyle]);

  const handleDeleteStyle = useCallback(
    (id: string) => {
      if (
        id.startsWith('heading-') ||
        id.startsWith('body-') ||
        id.startsWith('caption') ||
        id.startsWith('button') ||
        id.startsWith('quote')
      ) {
        return; // Don't delete defaults
      }
      const updated = styles.filter((s) => s.id !== id);
      setStyles(updated);
      localStorage.setItem('kreathief_text_styles', JSON.stringify(updated));
    },
    [styles]
  );

  const handleApplyStyle = useCallback(
    (style: TextStyle) => {
      onApplyStyle(style);
    },
    [onApplyStyle]
  );

  return (
    <div className="bg-surface-dark-3 rounded-xl border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Text Styles</h3>
        <button
          onClick={() => setShowSaveModal(true)}
          disabled={!currentStyle}
          className="text-[10px] text-brand-600 hover:text-[#9d4edd] disabled:opacity-50 flex items-center gap-1"
        >
          <Icons.Plus className="w-3 h-3" /> Save Style
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => handleApplyStyle(style)}
            className="p-3 bg-surface-dark-4 hover:bg-gray-700 border border-gray-600 hover:border-brand-600 rounded-lg text-left transition-all group relative"
          >
            <div className="text-[9px] text-gray-500 mb-1">{style.name}</div>
            <div
              className="text-sm font-medium truncate"
              style={{
                fontFamily: style.fontFamily,
                fontSize: Math.min(style.fontSize / 4, 16),
                fontWeight: style.fontWeight,
                fontStyle: style.fontStyle,
                color: style.color,
              }}
            >
              Aa Bb Cc
            </div>
            {!style.id.startsWith('heading-') &&
              !style.id.startsWith('body-') &&
              !style.id.startsWith('caption') &&
              !style.id.startsWith('button') &&
              !style.id.startsWith('quote') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteStyle(style.id);
                  }}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity"
                >
                  <Icons.Trash className="w-3 h-3" />
                </button>
              )}
          </button>
        ))}
      </div>

      {/* Save Style Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-overlay flex items-center justify-center bg-black/50">
          <div className="bg-surface-dark-3 border border-gray-700 rounded-xl p-4 w-80">
            <h4 className="text-sm font-bold text-white mb-4">Save Text Style</h4>
            <input
              type="text"
              value={styleName}
              onChange={(e) => setStyleName(e.target.value)}
              placeholder="Style name (e.g., My Heading)"
              className="w-full bg-surface-dark-4 border border-gray-600 rounded px-3 py-2 text-sm text-white mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveStyle();
                }
                if (e.key === 'Escape') {
                  setShowSaveModal(false);
                }
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveStyle}
                disabled={!styleName.trim()}
                className="flex-1 py-2 px-3 bg-brand-600 hover:bg-[#9d4edd] rounded-lg text-sm font-medium text-white disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2 px-3 bg-surface-dark-4 hover:bg-gray-700 rounded-lg text-sm font-medium text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  TextStylesPanel.displayName = 'TextStylesPanel';
});
