import React from 'react';
import { Icons } from '../constants';

interface PricingModalProps {
  onClose: () => void;
  onUpgrade: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ onClose, onUpgrade }) => {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1e1e1e] border border-gray-700 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close pricing modal"
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
        >
          <div className="text-2xl leading-none" aria-hidden="true">
            &times;
          </div>
        </button>

        {/* Free Tier */}
        <div className="flex-1 p-8 border-b md:border-b-0 md:border-r border-gray-700 flex flex-col">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
            <p className="text-gray-400 text-sm">Perfect for hobbyists and trying out AI design.</p>
          </div>
          <div className="mb-8">
            <span className="text-3xl font-bold text-white">$0</span>
            <span className="text-gray-500">/month</span>
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            {[
              'Standard Quality Generations',
              '10 Projects Limit',
              'Basic Templates',
              'Standard Exports (720p)',
              'Community Support',
            ].map((feat, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                  <Icons.Check className="w-3 h-3 text-gray-300" />
                </div>
                {feat}
              </li>
            ))}
          </ul>
          <button className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-colors">
            Current Plan
          </button>
        </div>

        {/* Pro Tier */}
        <div className="flex-1 p-8 bg-gradient-to-b from-[#1e1e1e] to-indigo-900/20 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[#7d2ae8] text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
            Most Popular
          </div>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              Pro <Icons.Magic className="w-4 h-4 text-[#7d2ae8]" />
            </h3>
            <p className="text-gray-400 text-sm">For creators who want full AI power and no limits.</p>
          </div>
          <div className="mb-8">
            <span className="text-3xl font-bold text-white">$19</span>
            <span className="text-gray-500">/month</span>
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            {[
              'HD Quality Generations (4K)',
              'Unlimited Projects',
              'Premium Templates & Assets',
              'Magic Eraser & Expand',
              'Brand Kits & Custom Fonts',
              'Commercial License',
              'Priority Support',
            ].map((feat, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-white">
                <div className="w-5 h-5 rounded-full bg-[#7d2ae8] flex items-center justify-center shrink-0">
                  <Icons.Check className="w-3 h-3 text-white" />
                </div>
                {feat}
              </li>
            ))}
          </ul>
          <button
            onClick={onUpgrade}
            className="w-full py-3 bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] hover:from-[#00b3ba] hover:to-[#6b23c5] text-white rounded-lg font-bold shadow-lg shadow-purple-900/30 transition-all hover:scale-[1.02]"
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  );
};
