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
        { key: 'Ctrl + Shift + Z', desc: 'Redo (Alt)' },
        { key: 'Ctrl + S', desc: 'Save Project' },
        { key: 'Ctrl + E', desc: 'Export Design' },
        { key: 'Esc', desc: 'Deselect All' },
        { key: '?', desc: 'Keyboard Shortcuts' },
      ],
    },
    {
      title: 'Selection & Layers',
      shortcuts: [
        { key: 'Ctrl + A', desc: 'Select All' },
        { key: 'Ctrl + Click', desc: 'Multi-select' },
        { key: 'Ctrl + C', desc: 'Copy' },
        { key: 'Ctrl + V', desc: 'Paste' },
        { key: 'Ctrl + D', desc: 'Duplicate' },
        { key: 'Delete / Backspace', desc: 'Delete Selected' },
        { key: 'Ctrl + G', desc: 'Group Layers' },
        { key: 'Ctrl + Shift + G', desc: 'Ungroup Layers' },
      ],
    },
    {
      title: 'Canvas & Navigation',
      shortcuts: [
        { key: 'Space + Drag', desc: 'Pan Canvas' },
        { key: 'Ctrl + 0', desc: 'Zoom to 100%' },
        { key: 'Ctrl + =', desc: 'Zoom In' },
        { key: 'Ctrl + -', desc: 'Zoom Out' },
        { key: 'Arrow Keys', desc: 'Nudge Layer (1px)' },
        { key: 'Shift + Arrow', desc: 'Nudge Layer (10px)' },
      ],
    },
    {
      title: 'Layer Ordering & Transform',
      shortcuts: [
        { key: 'Ctrl + Shift + ]', desc: 'Bring to Front' },
        { key: 'Ctrl + ]', desc: 'Bring Forward' },
        { key: 'Ctrl + [', desc: 'Send Backward' },
        { key: 'Ctrl + Shift + [', desc: 'Send to Back' },
        { key: 'H', desc: 'Flip Horizontal' },
        { key: 'V', desc: 'Flip Vertical' },
        { key: 'F2', desc: 'Rename Layer' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="bg-[#18181b]/95 border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden"
        style={{ backdropFilter: 'blur(20px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-gradient-to-r from-surface-dark-3 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Icons.Keyboard className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Keyboard Shortcuts</h2>
              <p className="text-[10px] text-gray-500">
                Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-[9px]">?</kbd> anytime to toggle
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
            aria-label="Close shortcuts"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcut Grid */}
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shortcutGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                <h3 className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1 h-3 bg-brand-600 rounded-full" />
                  {group.title}
                </h3>
                <div className="space-y-0.5">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors group"
                    >
                      <span className="text-gray-300 text-xs font-medium">{shortcut.desc}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {shortcut.key.split(' + ').map((k, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span className="text-gray-600 text-[10px] px-0.5">+</span>}
                            <kbd className="px-2 py-0.5 bg-surface-dark-4 border border-gray-700 rounded-md text-[10px] text-gray-200 font-mono shadow-sm group-hover:border-gray-500 group-hover:bg-surface-dark-5 transition-all whitespace-nowrap">
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

        {/* Footer */}
        <div className="px-6 py-3 bg-[#13161a] border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-gray-600">
            <span>Hold</span>
            <kbd className="px-2 py-0.5 bg-surface-dark-4 border border-gray-700 rounded text-[10px] text-gray-400 font-mono">
              Space
            </kbd>
            <span>to pan the canvas at any time</span>
          </div>
          <span className="text-[10px] text-gray-600">
            {shortcutGroups.reduce((acc, g) => acc + g.shortcuts.length, 0)} shortcuts
          </span>
        </div>
      </div>
    </div>
  );
};
