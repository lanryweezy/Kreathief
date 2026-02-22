import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icons, FONT_CATEGORIES } from '../constants';
import { loadFont } from '../services/FontLoader';

interface FontPickerProps {
  currentFont: string;
  onSelectFont: (font: string) => void;
  onClose: () => void;
  search: string;
  setSearch: (s: string) => void;
}

const FontItem = React.memo(
  ({ font, isSelected, onSelect }: { font: string; isSelected: boolean; onSelect: (f: string) => void }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const ref = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            loadFont(font).then(() => setIsLoaded(true));
            observer.disconnect();
          }
        },
        { rootMargin: '100px' }
      ); // Load a bit before visible

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => observer.disconnect();
    }, [font]);

    return (
      <button
        ref={ref}
        onClick={() => onSelect(font)}
        className={`w-full text-left px-3 py-2 hover:bg-[#7d2ae8] hover:text-white rounded flex flex-col group transition-colors ${isSelected ? 'bg-indigo-900/30 border border-indigo-500/30' : 'text-gray-300'}`}
      >
        <span
          className={`text-base truncate transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ fontFamily: isLoaded ? `"${font}", sans-serif` : 'inherit' }}
        >
          {font}
        </span>
        <div className="flex items-center justify-between w-full mt-1">
          <span
            className={`text-[10px] ${isSelected ? 'text-indigo-300 group-hover:text-white' : 'text-gray-500 group-hover:text-indigo-200'}`}
          >
            {font}
          </span>
          {isSelected && <Icons.Check className="w-3 h-3 text-[#7d2ae8] group-hover:text-white" />}
        </div>
        {!isLoaded && <span className="text-xs text-gray-600 absolute top-2 left-3">Loading...</span>}
      </button>
    );
  }
);
FontItem.displayName = 'FontItem';

export const FontPicker: React.FC<FontPickerProps> = ({ currentFont, onSelectFont, onClose, search, setSearch }) => {
  const filteredCategories = useMemo(() => {
    const result: { [key: string]: string[] } = {};
    Object.entries(FONT_CATEGORIES).forEach(([category, fonts]) => {
      const matches = fonts.filter((f) => f.toLowerCase().includes(search.toLowerCase()));
      if (matches.length > 0) {
        result[category] = matches;
      }
    });
    return result;
  }, [search]);

  return (
    <div className="bg-[#1e1e1e] border border-gray-700 rounded-lg shadow-xl p-1 animate-fadeIn min-w-[280px] max-h-[60vh] overflow-y-auto custom-scrollbar">
      <div className="sticky top-0 bg-[#1e1e1e] p-1 mb-1 border-b border-gray-700 z-10 shrink-0">
        <div className="relative">
          <Icons.Search className="w-3 h-3 text-gray-500 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search fonts..."
            className="w-full bg-[#13161a] border border-gray-600 rounded pl-7 pr-2 py-1.5 text-xs text-white focus:border-[#7d2ae8] outline-none placeholder:text-gray-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1">
        {Object.keys(filteredCategories).length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-500">No fonts found</div>
        ) : (
          Object.entries(filteredCategories).map(([category, fonts]) => (
            <div key={category} className="mb-3 last:mb-0">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 py-1 block mb-1">
                {category}
              </span>
              <div className="space-y-0.5">
                {fonts.map((font) => (
                  <FontItem
                    key={font}
                    font={font}
                    isSelected={currentFont === font}
                    onSelect={(f) => {
                      onSelectFont(f);
                      onClose();
                    }}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
