import React, { useState } from 'react';
import { BrandKit } from '../../types';
import { Icons, FONT_FAMILIES } from '../../constants';
import { Button } from '../Button';

interface BrandPanelProps {
   brandKits: BrandKit[];
   onAddBrandKit: (kit: BrandKit) => void;
   onDeleteBrandKit: (id: string) => void;
   onUpdateBrandKit: (id: string, updates: Partial<BrandKit>) => void;
   onApplyBrandColors: (colors: string[]) => void;
   onApplyBrandFonts: (heading: string, body: string) => void;
   onAddLogoToCanvas: (url: string) => void;
}

export const BrandPanel: React.FC<BrandPanelProps> = ({
   brandKits,
   onAddBrandKit,
   onDeleteBrandKit,
   onUpdateBrandKit,
   onApplyBrandColors,
   onApplyBrandFonts,
   onAddLogoToCanvas
}) => {
   const [isCreating, setIsCreating] = useState(false);
   const [newKitName, setNewKitName] = useState('');
   const [newColors, setNewColors] = useState<string[]>(['#000000', '#ffffff', '#7d2ae8']);
   const [newFonts, setNewFonts] = useState<string[]>(['Space Grotesk', 'Inter']);
   const [newLogos, setNewLogos] = useState<string[]>([]);

   const handleCreate = () => {
      if (!newKitName.trim()) return;
      const kit: BrandKit = {
         id: `brand_${Date.now()}`,
         name: newKitName,
         colors: newColors,
         fonts: newFonts,
         logos: newLogos
      };
      onAddBrandKit(kit);
      setIsCreating(false);
      setNewKitName('');
      setNewLogos([]);
   };

   const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
         const url = event.target?.result as string;
         if (newLogos.length < 10) {
            setNewLogos(prev => [...prev, url]);
         }
      };
      reader.readAsDataURL(file);
   };

   const updateNewColor = (index: number, color: string) => {
      const updated = [...newColors];
      updated[index] = color;
      setNewColors(updated);
   };

   return (
      <div className="flex flex-col h-full p-4 overflow-hidden">
         <div className="flex items-center justify-between mb-4 flex-shrink-0">
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
            <div className="bg-[#1e1e1e] p-4 rounded-lg border border-gray-700 mb-6 animate-fadeIn flex-shrink-0">
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

               <div className="mb-3">
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

               <div className="mb-4">
                  <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Logos (Max 10)</label>
                  <div className="flex gap-3 flex-wrap">
                     {newLogos.map((logo, i) => (
                        <div key={i} className="w-12 h-12 rounded border border-gray-700 bg-black flex items-center justify-center relative group">
                           <img src={logo} className="max-w-full max-h-full object-contain" />
                           <button
                              onClick={() => setNewLogos(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                              <Icons.X className="w-2.5 h-2.5" />
                           </button>
                        </div>
                     ))}
                     {newLogos.length < 10 && (
                        <label className="w-12 h-12 rounded border-2 border-dashed border-gray-700 hover:border-[#7d2ae8] transition-colors flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:text-[#7d2ae8]">
                           <Icons.Plus className="w-4 h-4" />
                           <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                     )}
                  </div>
               </div>

               <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreate} disabled={!newKitName.trim()}>Save Kit</Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
               </div>
            </div>
         )}

         <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pb-10">
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
                           className="ml-auto text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white transition-colors font-medium border border-white/5"
                        >
                           Apply Colors
                        </button>
                     </div>

                     <div className="bg-[#252627] rounded p-2 mb-3">
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
                           className="w-full mt-2 text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white transition-colors font-medium border border-white/5"
                        >
                           Apply Fonts
                        </button>
                     </div>

                     {/* Logos Section */}
                     <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                           {/* Primary Logo Slot */}
                           <div className="space-y-1.5">
                              <label className="text-[10px] text-gray-500 uppercase font-bold px-1">Primary Logo</label>
                              <div className="aspect-square rounded-lg border border-gray-700 bg-black/40 flex items-center justify-center relative group/logo overflow-hidden">
                                 {kit.primaryLogo ? (
                                    <>
                                       <button
                                          draggable
                                          onDragStart={(e) => {
                                             e.dataTransfer.setData('text/plain', kit.primaryLogo!);
                                             e.dataTransfer.dropEffect = 'copy';
                                          }}
                                          onClick={() => onAddLogoToCanvas(kit.primaryLogo!)}
                                          className="w-full h-full p-2 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/5 transition-colors"
                                       >
                                          <img src={kit.primaryLogo} className="max-w-full max-h-full object-contain pointer-events-none" />
                                       </button>
                                       <button
                                          onClick={() => onUpdateBrandKit(kit.id, { primaryLogo: undefined })}
                                          className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity shadow-lg backdrop-blur-sm"
                                       >
                                          <Icons.Trash className="w-2.5 h-2.5" />
                                       </button>
                                    </>
                                 ) : (
                                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors text-gray-500 hover:text-[#7d2ae8]">
                                       <Icons.Plus className="w-4 h-4 mb-1" />
                                       <span className="text-[9px] font-medium">Add Primary</span>
                                       <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => {
                                             const file = e.target.files?.[0];
                                             if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (re) => onUpdateBrandKit(kit.id, { primaryLogo: re.target?.result as string });
                                                reader.readAsDataURL(file);
                                             }
                                          }}
                                       />
                                    </label>
                                 )}
                              </div>
                           </div>

                           {/* Secondary Logo Slot */}
                           <div className="space-y-1.5">
                              <label className="text-[10px] text-gray-500 uppercase font-bold px-1">Secondary Logo</label>
                              <div className="aspect-square rounded-lg border border-gray-700 bg-black/40 flex items-center justify-center relative group/logo overflow-hidden">
                                 {kit.secondaryLogo ? (
                                    <>
                                       <button
                                          draggable
                                          onDragStart={(e) => {
                                             e.dataTransfer.setData('text/plain', kit.secondaryLogo!);
                                             e.dataTransfer.dropEffect = 'copy';
                                          }}
                                          onClick={() => onAddLogoToCanvas(kit.secondaryLogo!)}
                                          className="w-full h-full p-2 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/5 transition-colors"
                                       >
                                          <img src={kit.secondaryLogo} className="max-w-full max-h-full object-contain pointer-events-none" />
                                       </button>
                                       <button
                                          onClick={() => onUpdateBrandKit(kit.id, { secondaryLogo: undefined })}
                                          className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity shadow-lg backdrop-blur-sm"
                                       >
                                          <Icons.Trash className="w-2.5 h-2.5" />
                                       </button>
                                    </>
                                 ) : (
                                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors text-gray-500 hover:text-[#7d2ae8]">
                                       <Icons.Plus className="w-4 h-4 mb-1" />
                                       <span className="text-[9px] font-medium">Add Secondary</span>
                                       <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => {
                                             const file = e.target.files?.[0];
                                             if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (re) => onUpdateBrandKit(kit.id, { secondaryLogo: re.target?.result as string });
                                                reader.readAsDataURL(file);
                                             }
                                          }}
                                       />
                                    </label>
                                 )}
                              </div>
                           </div>
                        </div>

                        {/* Other Logos Collection */}
                        <div className="space-y-2">
                           <div className="flex justify-between items-center px-1">
                              <label className="text-[10px] text-gray-500 uppercase font-bold">Assets</label>
                              {kit.logos && kit.logos.length < 10 && (
                                 <button
                                    onClick={() => {
                                       const input = document.createElement('input');
                                       input.type = 'file';
                                       input.accept = 'image/*';
                                       input.onchange = (e: any) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                             const reader = new FileReader();
                                             reader.onload = (re) => {
                                                const newLogos = [...(kit.logos || []), re.target?.result as string];
                                                onUpdateBrandKit(kit.id, { logos: newLogos });
                                             };
                                             reader.readAsDataURL(file);
                                          }
                                       };
                                       input.click();
                                    }}
                                    className="text-[10px] text-[#7d2ae8] hover:underline transition-all"
                                 >
                                    + Add Assets
                                 </button>
                              )}
                           </div>
                           <div className="grid grid-cols-3 gap-2 px-1">
                              {kit.logos && kit.logos.map((logo, i) => (
                                 <div key={i} className="relative group/logo">
                                    <button
                                       draggable
                                       onDragStart={(e) => {
                                          e.dataTransfer.setData('text/plain', logo);
                                          e.dataTransfer.dropEffect = 'copy';
                                       }}
                                       onClick={() => onAddLogoToCanvas(logo)}
                                       className="w-full aspect-square rounded border border-gray-700 bg-black/20 p-1.5 hover:border-[#7d2ae8] transition-all flex items-center justify-center cursor-grab active:cursor-grabbing"
                                       title="Drag to canvas"
                                    >
                                       <img src={logo} className="max-w-full max-h-full object-contain pointer-events-none" />
                                    </button>
                                    <button
                                       onClick={() => {
                                          const newLogos = (kit.logos || []).filter((_, idx) => idx !== i);
                                          onUpdateBrandKit(kit.id, { logos: newLogos });
                                       }}
                                       className="absolute -top-1 -right-1 w-4 h-4 bg-red-500/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                                    >
                                       <Icons.Trash className="w-2 h-2" />
                                    </button>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>
   );
};

export default BrandPanel;