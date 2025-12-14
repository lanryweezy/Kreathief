import React, { useState } from 'react';
import { BrandKit } from '../../types';
import { Icons, FONT_FAMILIES } from '../../constants';
import { Button } from '../Button';

interface BrandPanelProps {
  brandKits: BrandKit[];
  onAddBrandKit: (kit: BrandKit) => void;
  onDeleteBrandKit: (id: string) => void;
  onApplyBrandColors: (colors: string[]) => void;
  onApplyBrandFonts: (heading: string, body: string) => void;
}

export const BrandPanel: React.FC<BrandPanelProps> = ({
  brandKits,
  onAddBrandKit,
  onDeleteBrandKit,
  onApplyBrandColors,
  onApplyBrandFonts
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newKitName, setNewKitName] = useState('');
  const [newColors, setNewColors] = useState<string[]>(['#000000', '#ffffff', '#7d2ae8']);
  const [newFonts, setNewFonts] = useState<string[]>(['Space Grotesk', 'Inter']);

  const handleCreate = () => {
    if (!newKitName.trim()) return;
    const kit: BrandKit = {
      id: `brand_${Date.now()}`,
      name: newKitName,
      colors: newColors,
      fonts: newFonts
    };
    onAddBrandKit(kit);
    setIsCreating(false);
    setNewKitName('');
  };

  const updateNewColor = (index: number, color: string) => {
    const updated = [...newColors];
    updated[index] = color;
    setNewColors(updated);
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center justify-between mb-4">
         <h3 className="font-bold text-white flex items-center gap-2">
            <Icons.Brand className="w-5 h-5 text-[#7d2ae8]" />
            Brand Kits
         </h3>
         {!isCreating && (
            <button onClick={() => setIsCreating(true)} className="text-xs bg-[#252627] hover:bg-[#333] border border-gray-700 text-gray-300 px-2 py-1 rounded">
               + New Kit
            </button>
         )}
      </div>

      {isCreating && (
         <div className="bg-[#1e1e1e] p-4 rounded-lg border border-gray-700 mb-6 animate-fadeIn">
            <input 
               type="text" 
               placeholder="Brand Name (e.g. Acme Corp)" 
               className="w-full bg-[#252627] border border-gray-600 rounded px-2 py-1 text-sm text-white mb-3 focus:border-[#7d2ae8] outline-none"
               value={newKitName}
               onChange={(e) => setNewKitName(e.target.value)}
            />
            
            <div className="mb-3">
               <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Palette</label>
               <div className="flex gap-2">
                  {newColors.map((c, i) => (
                     <div key={i} className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-600 cursor-pointer">
                        <input 
                           type="color" 
                           value={c} 
                           onChange={(e) => updateNewColor(i, e.target.value)}
                           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        />
                        <div className="w-full h-full" style={{ backgroundColor: c }} />
                     </div>
                  ))}
               </div>
            </div>

            <div className="mb-4">
               <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Typography</label>
               <div className="space-y-2">
                  <select 
                     className="w-full bg-[#252627] border border-gray-600 rounded px-2 py-1 text-xs text-white"
                     value={newFonts[0]}
                     onChange={(e) => setNewFonts([e.target.value, newFonts[1]])}
                  >
                     {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <select 
                     className="w-full bg-[#252627] border border-gray-600 rounded px-2 py-1 text-xs text-white"
                     value={newFonts[1]}
                     onChange={(e) => setNewFonts([newFonts[0], e.target.value])}
                  >
                     {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
               </div>
            </div>

            <div className="flex gap-2">
               <Button size="sm" onClick={handleCreate} disabled={!newKitName.trim()}>Save Kit</Button>
               <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
            </div>
         </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pb-20">
         {brandKits.length === 0 && !isCreating ? (
            <div className="text-center text-gray-500 mt-10">
               <Icons.Brand className="w-12 h-12 mx-auto mb-2 opacity-30" />
               <p className="text-xs">No brand kits yet.</p>
               <p className="text-[10px] mt-1">Create one to save colors & fonts.</p>
            </div>
         ) : (
            brandKits.map(kit => (
               <div key={kit.id} className="bg-[#1e1e1e] border border-gray-700 rounded-lg p-3 group relative">
                  <div className="flex justify-between items-start mb-2">
                     <h4 className="font-bold text-sm text-white">{kit.name}</h4>
                     <button onClick={() => onDeleteBrandKit(kit.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icons.Trash className="w-3 h-3" />
                     </button>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                     {kit.colors.map((c, i) => (
                        <div key={i} className="w-6 h-6 rounded-full border border-white/10" style={{ backgroundColor: c }} />
                     ))}
                     <button 
                        onClick={() => onApplyBrandColors(kit.colors)}
                        className="ml-auto text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white transition-colors"
                     >
                        Apply Colors
                     </button>
                  </div>

                  <div className="bg-[#252627] rounded p-2">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-gray-400">Heading</span>
                        <span className="text-xs font-medium text-white">{kit.fonts[0]}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400">Body</span>
                        <span className="text-xs font-medium text-white">{kit.fonts[1]}</span>
                     </div>
                     <button 
                        onClick={() => onApplyBrandFonts(kit.fonts[0], kit.fonts[1])}
                        className="w-full mt-2 text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white transition-colors"
                     >
                        Apply Fonts
                     </button>
                  </div>
               </div>
            ))
         )}
      </div>
    </div>
  );
};