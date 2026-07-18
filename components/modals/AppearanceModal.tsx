import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../constants';

interface AppearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppearanceModal: React.FC<AppearanceModalProps> = ({ isOpen, onClose }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [creatorMode, setCreatorMode] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-[#111113] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-base font-bold text-white">Appearance</h3>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Theme */}
              <div>
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3 block">
                  Theme
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    }`}
                  >
                    <div className="w-full h-12 bg-[#0a0a0c] rounded-lg mb-2 border border-white/10" />
                    <span className="text-xs font-bold text-white">Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      theme === 'light'
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    }`}
                  >
                    <div className="w-full h-12 bg-white rounded-lg mb-2 border border-gray-200" />
                    <span className="text-xs font-bold text-white">Light</span>
                  </button>
                </div>
              </div>

              {/* Creator Mode */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icons.Wand className="w-4 h-4 text-white/50" />
                    <div>
                      <div className="text-xs font-bold text-white uppercase tracking-widest">Creator Mode</div>
                      <div className="text-[10px] text-white/50 mt-0.5">
                        Access advanced tools and template publishing
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setCreatorMode(!creatorMode)}
                    className={`w-10 h-6 rounded-full transition-colors relative ${
                      creatorMode ? 'bg-brand-600' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        creatorMode ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/[0.06] flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
