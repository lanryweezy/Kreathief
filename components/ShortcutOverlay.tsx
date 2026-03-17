import React from 'react';
import { Icons } from '../constants';

interface ShortcutOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutOverlay: React.FC<ShortcutOverlayProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  const shortcutGroups = [
    {
      title: 'General',
      shortcuts: [
        { key: 'Ctrl + Z', desc: 'Undo' },
        { key: 'Ctrl + Y', desc: 'Redo' },
        { key: 'Esc', desc: 'Deselect / Cancel' },
      ],
    },
    {
      title: 'Layers & Selection',
      shortcuts: [
        { key: 'Ctrl + Click', desc: 'Multi-select' },
        { key: 'Ctrl + C', desc: 'Copy' },
        { key: 'Ctrl + V', desc: 'Paste' },
        { key: 'Ctrl + D', desc: 'Duplicate' },
        { key: 'Delete / Backspace', desc: 'Delete' },
        { key: 'Ctrl + G', desc: 'Group' },
        { key: 'Ctrl + Shift + G', desc: 'Ungroup' },
      ],
    },
    {
      title: 'Canvas & Navigation',
      shortcuts: [
        { key: 'Space + Drag', desc: 'Pan canvas' },
        { key: 'Arrow Keys', desc: 'Nudge (1px)' },
        { key: 'Shift + Arrow', desc: 'Nudge (10px)' },
        { key: '[', desc: 'Send backward' },
        { key: ']', desc: 'Bring forward' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-[#13161a]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Icons.Keyboard className="w-5 h-5 text-[#7d2ae8]" />
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {shortcutGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{group.title}</h3>
                <div className="space-y-1">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1.5 border-b border-gray-800/50 last:border-0 hover:bg-white/5 px-2 rounded -mx-2 transition-colors group"
                    >
                      <span className="text-gray-300 text-sm font-medium">{shortcut.desc}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.key.split(' + ').map((k, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span className="text-gray-600 text-xs">+</span>}
                            <kbd className="px-2 py-0.5 bg-[#252627] border border-gray-700 rounded text-xs text-gray-200 font-mono shadow-sm group-hover:border-gray-500 transition-colors">
                              {k}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-[#13161a] border-t border-gray-700 text-center">
          <p className="text-xs text-gray-500">
            Hold{' '}
            <kbd className="px-1.5 py-0.5 bg-[#252627] border border-gray-700 rounded text-[10px] text-gray-400">
              Space
            </kbd>{' '}
            to pan the canvas at any time.
          </p>
        </div>
      </div>
    </div>
  );
};
