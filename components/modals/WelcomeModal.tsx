import React from 'react';
import { Icons } from '../../constants';
import { ModalWrapper } from './ModalWrapper';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, onStartTour }) => {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex flex-col relative">
        <div className="p-10 pb-4 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-accent via-brand-600 to-[#ff00ff] rounded-[32px] flex items-center justify-center shadow-[0_20px_50px_rgba(125,42,232,0.3)] mx-auto mb-8 transform -rotate-6 animate-in zoom-in spin-in-6 duration-700">
            <Icons.Magic className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-black text-white mb-3 tracking-tighter italic uppercase">
            Welcome to Kreathief
          </h2>
          <p className="text-gray-400 text-lg max-w-md mx-auto font-medium leading-relaxed">
            The world&apos;s most advanced AI-native creative engine. Design without limits.
          </p>
        </div>

        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              icon: Icons.Magic,
              title: 'AI Generation',
              desc: 'Text-to-design in seconds.',
              color: 'text-accent',
              bg: 'bg-accent/10',
            },
            {
              icon: Icons.Layers,
              title: 'Pro Engine',
              desc: 'Layered control & masking.',
              color: 'text-brand-600',
              bg: 'bg-brand-600/10',
            },
            {
              icon: Icons.Search,
              title: 'AI Assistant',
              desc: 'Collaborative logic traces.',
              color: 'text-indigo-400',
              bg: 'bg-indigo-400/10',
            },
            {
              icon: Icons.Mockup,
              title: 'Mockup Studio',
              desc: 'Real-world 3D previews.',
              color: 'text-emerald-400',
              bg: 'bg-emerald-400/10',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 hover:bg-white/10 transition-all group"
            >
              <div
                className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="font-black text-white text-sm uppercase tracking-wider mb-1">{feature.title}</h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="p-10 pt-0 flex flex-col gap-4">
          <button
            onClick={onStartTour}
            className="w-full py-5 bg-white text-black hover:bg-accent hover:text-white rounded-[20px] font-black uppercase tracking-widest shadow-xl transform hover:-translate-y-1 active:translate-y-0.5 transition-all flex items-center justify-center gap-3"
          >
            Start the Experience <Icons.ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 text-gray-500 hover:text-white font-black text-[10px] uppercase tracking-[0.3em] transition-all"
          >
            Skip for now
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};
