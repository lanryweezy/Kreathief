import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../constants';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HELP_ITEMS = [
  { icon: Icons.Help, title: 'Documentation', desc: 'Learn how to use Kreathief', url: 'https://docs.kreathief.com' },
  { icon: Icons.Globe, title: 'Website', desc: 'Visit kreathief.com', url: 'https://kreathief.com' },
  {
    icon: Icons.MessageSquare,
    title: 'Contact Support',
    desc: 'Get help from our team',
    url: 'mailto:support@kreathief.com',
  },
  {
    icon: Icons.Github,
    title: 'GitHub',
    desc: 'Report issues or contribute',
    url: 'https://github.com/lanryweezy/Kreathief',
  },
];

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
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
              <h3 className="text-base font-bold text-white">Help & Support</h3>
              <button
                onClick={onClose}
                aria-label="Close help modal"
                className="text-white/40 hover:text-white transition-colors"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {HELP_ITEMS.map((item, idx) => (
                <a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/[0.04] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center group-hover:bg-white/[0.08] transition-colors">
                    <item.icon className="w-5 h-5 text-white/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="text-xs text-white/50">{item.desc}</div>
                  </div>
                  <Icons.ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                </a>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-white/[0.06] flex justify-center">
              <span className="text-[10px] text-white/30 font-mono">Kreathief v1.0</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
