import React from 'react';
import { Icons } from '../../constants';

interface WelcomeModalProps {
  onClose: () => void;
  onStartTour: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose, onStartTour }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#1e1e1e] border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
           <div className="text-2xl leading-none">&times;</div>
        </button>

        <div className="p-8 pb-0 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#00c4cc] to-[#7d2ae8] rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/30 mx-auto mb-6 transform -rotate-6">
            <Icons.Magic className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2 italic">Welcome to Kreathief!</h2>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            The AI-powered design playground where your imagination becomes reality in seconds.
          </p>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#13161a] border border-gray-800 rounded-xl hover:border-[#00c4cc]/50 transition-colors">
            <div className="w-10 h-10 bg-[#00c4cc]/10 rounded-lg flex items-center justify-center mb-3">
              <Icons.Magic className="w-5 h-5 text-[#00c4cc]" />
            </div>
            <h3 className="font-bold text-white mb-1">AI Generation</h3>
            <p className="text-xs text-gray-500 line-clamp-2">Describe anything and watch our AI create it instantly.</p>
          </div>
          
          <div className="p-4 bg-[#13161a] border border-gray-800 rounded-xl hover:border-[#7d2ae8]/50 transition-colors">
            <div className="w-10 h-10 bg-[#7d2ae8]/10 rounded-lg flex items-center justify-center mb-3">
              <Icons.Layers className="w-5 h-5 text-[#7d2ae8]" />
            </div>
            <h3 className="font-bold text-white mb-1">Smart Editing</h3>
            <p className="text-xs text-gray-500 line-clamp-2">Fine-tune your designs with layers, shapes, and filters.</p>
          </div>
          
          <div className="p-4 bg-[#13161a] border border-gray-800 rounded-xl hover:border-indigo-500/50 transition-colors">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-3">
              <Icons.Search className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="font-bold text-white mb-1">AI Assistant</h3>
            <p className="text-xs text-gray-500 line-clamp-2">Chat with our AI for design suggestions and better prompts.</p>
          </div>
          
          <div className="p-4 bg-[#13161a] border border-gray-800 rounded-xl hover:border-green-500/50 transition-colors">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mb-3">
              <Icons.Mockup className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="font-bold text-white mb-1">Mockup Studio</h3>
            <p className="text-xs text-gray-500 line-clamp-2">Preview your designs on real products like T-shirts and bags.</p>
          </div>
        </div>

        <div className="p-8 pt-0 flex flex-col gap-3">
          <button 
            onClick={onStartTour}
            className="w-full py-4 bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] text-white rounded-xl font-bold shadow-lg shadow-purple-900/40 transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Take a 1-minute tour <Icons.ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={onClose}
            className="w-full py-3 bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl font-medium transition-all"
          >
            I'll figure it out myself
          </button>
        </div>
      </div>
    </div>
  );
};
