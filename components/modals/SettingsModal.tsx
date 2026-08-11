import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const user = useStore((s) => s.user);

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
              <h3 className="text-base font-bold text-white">Settings</h3>
              <button onClick={onClose} aria-label="Close settings" className="text-white/40 hover:text-white transition-colors">
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Account */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Icons.User className="w-4 h-4 text-white/50" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">Account</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Name</span>
                    <span className="text-white">{user?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Email</span>
                    <span className="text-white">{user?.email}</span>
                  </div>
                </div>
              </div>

              {/* Plan */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Icons.Zap className="w-4 h-4 text-white/50" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">Plan</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">{user?.plan} Plan</div>
                    <div className="text-xs text-white/50">
                      {user?.plan === 'Free' ? 'Upgrade for more features' : 'All features unlocked'}
                    </div>
                  </div>
                  {user?.plan === 'Free' && (
                    <button className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-[10px] font-bold rounded-lg transition-colors uppercase tracking-wider">
                      Upgrade
                    </button>
                  )}
                </div>
              </div>

              {/* Billing */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Icons.CreditCard className="w-4 h-4 text-white/50" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">Billing</span>
                </div>
                <div className="text-sm text-white/60">
                  {user?.plan === 'Free' ? 'No active subscriptions' : 'Manage your subscription and payment methods'}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/[0.06] flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-white/60 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
