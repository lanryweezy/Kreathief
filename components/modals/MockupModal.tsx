import React, { useState } from 'react';
import { Icons } from '../../constants';

interface MockupModalProps {
  designImage: string;
  onClose: () => void;
}

export const MockupModal: React.FC<MockupModalProps> = ({ designImage, onClose }) => {
  const [activeMockup, setActiveMockup] = useState<'tshirt' | 'poster' | 'tote'>('tshirt');

  const mockups = {
    tshirt: {
      name: 'T-Shirt',
      bg: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      overlayStyle: { top: '30%', left: '28%', width: '45%', mixBlendMode: 'multiply', opacity: 0.9 }
    },
    poster: {
      name: 'Poster',
      bg: 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      overlayStyle: { top: '15%', left: '27%', width: '46%', transform: 'rotate(-2deg)', mixBlendMode: 'multiply' }
    },
    tote: {
      name: 'Tote Bag',
      bg: 'https://images.unsplash.com/photo-1597484662317-c9253e609141?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      overlayStyle: { top: '45%', left: '35%', width: '30%', mixBlendMode: 'multiply', opacity: 0.85 }
    }
  };

  const current = mockups[activeMockup];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-2xl w-[800px] max-w-[90vw] h-[600px] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="h-14 border-b border-gray-700 flex items-center justify-between px-6 bg-[#252627]">
           <div className="flex items-center gap-2">
              <Icons.Mockup className="w-5 h-5 text-[#7d2ae8]" />
              <h3 className="font-bold text-white">Mockup Studio</h3>
           </div>
           <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <div className="text-2xl leading-none">&times;</div>
           </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
           {/* Sidebar Controls */}
           <div className="w-48 bg-[#13161a] border-r border-gray-700 p-4 flex flex-col gap-2">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Products</h4>
              {Object.keys(mockups).map((key) => (
                 <button
                    key={key}
                    onClick={() => setActiveMockup(key as any)}
                    className={`text-left px-3 py-2 rounded text-sm font-medium transition-colors ${activeMockup === key ? 'bg-[#7d2ae8] text-white' : 'text-gray-400 hover:bg-[#252627] hover:text-white'}`}
                 >
                    {mockups[key as keyof typeof mockups].name}
                 </button>
              ))}
           </div>

           {/* Preview Area */}
           <div className="flex-1 bg-[#0e1318] flex items-center justify-center p-8 relative overflow-hidden">
              <div className="relative w-full max-w-[400px] aspect-[3/4] shadow-2xl rounded-lg overflow-hidden bg-white">
                 <img src={current.bg} className="w-full h-full object-cover" alt="Mockup Background" />
                 {/* Design Overlay */}
                 <img 
                    src={designImage} 
                    className="absolute object-contain pointer-events-none"
                    style={current.overlayStyle as any}
                    alt="Your Design"
                 />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};