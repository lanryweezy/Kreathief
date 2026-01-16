# Quick Implementation Code Examples

## 1. Effect Presets Component

```typescript
// components/EffectPresetsBar.tsx
import React from 'react';
import { CanvasFilters } from '../types';

interface EffectPresetsBarProps {
  onApplyPreset: (filters: Partial<CanvasFilters>) => void;
}

const PRESETS = {
  vintage: {
    brightness: 110,
    contrast: 80,
    saturation: 70,
    vignette: 30,
  },
  modern: {
    brightness: 100,
    contrast: 120,
    saturation: 150,
    vignette: 0,
  },
  minimalist: {
    brightness: 110,
    contrast: 90,
    saturation: 50,
    vignette: 10,
  },
  bold: {
    brightness: 100,
    contrast: 140,
    saturation: 180,
    vignette: 0,
  },
  playful: {
    brightness: 120,
    contrast: 100,
    saturation: 120,
    vignette: 20,
  },
};

export const EffectPresetsBar: React.FC<EffectPresetsBarProps> = ({ onApplyPreset }) => {
  return (
    <div className="flex gap-2 bg-[#252627] rounded-lg p-2 border border-gray-700">
      <span className="text-xs font-bold text-gray-400 self-center px-2">Presets:</span>
      {Object.entries(PRESETS).map(([name, preset]) => (
        <button
          key={name}
          onClick={() => onApplyPreset(preset)}
          className="px-3 py-1.5 rounded text-xs font-bold bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 transition-colors"
          title={`Apply ${name} preset`}
        >
          {name.charAt(0).toUpperCase() + name.slice(1)}
        </button>
      ))}
    </div>
  );
};
```

## 2. Export Format Selector

```typescript
// components/ExportDialog.tsx
import React, { useState } from 'react';

interface ExportDialogProps {
  onExport: (format: 'png' | 'jpeg' | 'webp', quality: number) => void;
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ onExport, onClose }) => {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [quality, setQuality] = useState(0.95);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1e1e1e] rounded-lg p-6 max-w-md border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Export Design</h2>
        
        <div className="space-y-4">
          {/* Format Selection */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Format</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {(['png', 'jpeg', 'webp'] as const).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`py-2 rounded font-bold text-sm transition-colors ${
                    format === fmt
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Slider */}
          {(format === 'jpeg' || format === 'webp') && (
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Quality</label>
                <span className="text-xs text-gray-400">{Math.round(quality * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          )}

          {/* Format Info */}
          <div className="bg-gray-800 rounded p-3 text-xs text-gray-300">
            {format === 'png' && '✓ Lossless, supports transparency'}
            {format === 'jpeg' && '✓ Compressed, smaller file size'}
            {format === 'webp' && '✓ Modern format, best compression'}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onExport(format, quality);
              onClose();
            }}
            className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded font-bold transition-colors"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
};
```

## 3. Starter Templates Component

```typescript
// components/TemplateSelector.tsx
import React from 'react';
import { CanvasSize, TextLayer, ShapeLayer } from '../types';

interface Template {
  id: string;
  name: string;
  category: string;
  size: CanvasSize;
  thumbnail: string;
  layers: {
    background: { color: string };
    shapes: ShapeLayer[];
    text: TextLayer[];
  };
}

interface TemplateSelectorProps {
  templates: Template[];
  onSelectTemplate: (template: Template) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ templates, onSelectTemplate }) => {
  const categories = Array.from(new Set(templates.map(t => t.category)));

  const [selectedCategory, setSelectedCategory] = React.useState(categories[0]);
  const filtered = templates.filter(t => t.category === selectedCategory);

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map(template => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className="group relative aspect-video rounded-lg overflow-hidden border-2 border-gray-700 hover:border-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-500/20"
          >
            <img
              src={template.thumbnail}
              alt={template.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
              <div className="w-full p-2 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-xs font-bold text-white">{template.name}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Usage in Dashboard
export const STARTER_TEMPLATES: Template[] = [
  {
    id: 'instagram_post',
    name: 'Instagram Post',
    category: 'Social Media',
    size: { width: 1080, height: 1080, name: 'Instagram Post' },
    thumbnail: 'data:image/svg+xml,...',
    layers: {
      background: { color: '#ffffff' },
      shapes: [
        {
          id: 'bg_shape',
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 1080,
          height: 1080,
          color: '#f0f0f0',
          rotation: 0,
          cornerRadius: 0,
          opacity: 1,
          locked: false,
          visible: true,
        },
      ],
      text: [
        {
          id: 'title',
          type: 'text',
          text: 'Your Title Here',
          x: 100,
          y: 400,
          width: 880,
          rotation: 0,
          fontSize: 72,
          fontWeight: 'bold',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#000000',
          fontFamily: 'Inter',
          textAlign: 'center',
          letterSpacing: 0,
          lineHeight: 1.2,
          textTransform: 'none',
          opacity: 1,
          locked: false,
          visible: true,
        },
      ],
    },
  },
  // ... more templates
];
```

## 4. Favorites System

```typescript
// hooks/useFavorites.ts
import { useState, useEffect } from 'react';

export interface Favorite {
  id: string;
  type: 'effect' | 'template' | 'design';
  name: string;
  data: any;
  createdAt: number;
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kreathief_favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load favorites', e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('kreathief_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (type: Favorite['type'], name: string, data: any) => {
    const favorite: Favorite = {
      id: `fav_${Date.now()}`,
      type,
      name,
      data,
      createdAt: Date.now(),
    };
    setFavorites(prev => [favorite, ...prev]);
  };

  const removeFavorite = (id: string) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  const isFavorited = (id: string) => {
    return favorites.some(f => f.id === id);
  };

  return { favorites, addFavorite, removeFavorite, isFavorited };
};

// components/FavoritesPanel.tsx
import React from 'react';
import { useFavorites } from '../hooks/useFavorites';
import { Icons } from '../constants';

export const FavoritesPanel: React.FC<{ onApplyFavorite: (fav: any) => void }> = ({ onApplyFavorite }) => {
  const { favorites, removeFavorite } = useFavorites();

  if (favorites.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Icons.Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-xs">No favorites yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {favorites.map(fav => (
        <div
          key={fav.id}
          className="flex items-center justify-between p-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors group"
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{fav.name}</p>
            <p className="text-[10px] text-gray-500">{fav.type}</p>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onApplyFavorite(fav)}
              className="p-1 hover:bg-indigo-500/20 rounded text-indigo-400 hover:text-indigo-300"
              title="Apply"
            >
              <Icons.Check className="w-3 h-3" />
            </button>
            <button
              onClick={() => removeFavorite(fav.id)}
              className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
              title="Remove"
            >
              <Icons.X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

## 5. Keyboard Shortcuts Help Modal

```typescript
// components/ShortcutsModal.tsx
import React from 'react';
import { Icons } from '../constants';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { category: 'Editing', items: [
      { key: 'Ctrl+Z', action: 'Undo' },
      { key: 'Ctrl+Shift+Z', action: 'Redo' },
      { key: 'Ctrl+D', action: 'Duplicate Layer' },
      { key: 'Delete', action: 'Delete Layer' },
    ]},
    { category: 'Clipboard', items: [
      { key: 'Ctrl+C', action: 'Copy Layer' },
      { key: 'Ctrl+V', action: 'Paste Layer' },
    ]},
    { category: 'Navigation', items: [
      { key: 'Arrow Keys', action: 'Move Layer (1px)' },
      { key: 'Shift+Arrow', action: 'Move Layer (10px)' },
      { key: '?', action: 'Show This Help' },
    ]},
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1e1e1e] rounded-lg p-6 max-w-md border border-gray-700 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Icons.Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {shortcuts.map(group => (
            <div key={group.category}>
              <h3 className="text-xs font-bold text-indigo-400 uppercase mb-2">
                {group.category}
              </h3>
              <div className="space-y-1">
                {group.items.map(item => (
                  <div key={item.key} className="flex justify-between items-center">
                    <span className="text-xs text-gray-300">{item.action}</span>
                    <kbd className="bg-gray-700 px-2 py-1 rounded text-[10px] font-mono text-white">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded font-bold transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
```

## Integration Example

```typescript
// In Editor.tsx
import { EffectPresetsBar } from './EffectPresetsBar';
import { ExportDialog } from './ExportDialog';
import { TemplateSelector } from './TemplateSelector';
import { FavoritesPanel } from './FavoritesPanel';
import { ShortcutsModal } from './ShortcutsModal';

export const Editor: React.FC<EditorProps> = ({ ... }) => {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      {/* Toolbar with Presets */}
      <div className="p-4 border-b border-gray-700">
        <EffectPresetsBar onApplyPreset={handleUpdateCanvasFilters} />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Canvas */}
        <Canvas {...canvasProps} />

        {/* Side Panel */}
        <SidePanel
          activeTab={activeTab}
          // ... other props
        />
      </div>

      {/* Modals */}
      {showExportDialog && (
        <ExportDialog
          onExport={handleExport}
          onClose={() => setShowExportDialog(false)}
        />
      )}

      {showShortcuts && (
        <ShortcutsModal
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
        />
      )}
    </div>
  );
};
```

---

## Testing These Features

```typescript
// __tests__/EffectPresets.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { EffectPresetsBar } from '../components/EffectPresetsBar';

describe('EffectPresetsBar', () => {
  it('should apply vintage preset', () => {
    const mockApply = jest.fn();
    render(<EffectPresetsBar onApplyPreset={mockApply} />);
    
    fireEvent.click(screen.getByText('Vintage'));
    
    expect(mockApply).toHaveBeenCalledWith({
      brightness: 110,
      contrast: 80,
      saturation: 70,
      vignette: 30,
    });
  });

  it('should display all presets', () => {
    render(<EffectPresetsBar onApplyPreset={() => {}} />);
    
    expect(screen.getByText('Vintage')).toBeInTheDocument();
    expect(screen.getByText('Modern')).toBeInTheDocument();
    expect(screen.getByText('Bold')).toBeInTheDocument();
    expect(screen.getByText('Playful')).toBeInTheDocument();
    expect(screen.getByText('Minimalist')).toBeInTheDocument();
  });
});
```

---

## Performance Tips

1. **Memoize Components**: Use `React.memo()` for preset buttons
2. **Lazy Load Templates**: Load templates on demand
3. **Cache Presets**: Store preset calculations
4. **Debounce Exports**: Prevent multiple export requests

---

## Next Steps

1. Copy these components into your project
2. Update imports and styling as needed
3. Test each component thoroughly
4. Integrate into Editor component
5. Add to your UI/UX documentation
