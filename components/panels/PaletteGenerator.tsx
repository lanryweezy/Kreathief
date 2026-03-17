import React, { useState, useRef, useCallback } from 'react';
import { Icons } from '../../constants';
import { extractPalette } from '../../utils/colorUtils';

interface PaletteGeneratorProps {
  onPaletteSelect: (colors: string[]) => void;
}

export const PaletteGenerator: React.FC<PaletteGeneratorProps> = ({ onPaletteSelect }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const imageData = await loadImage(file);
      const colors = extractPalette(imageData, 5);
      setExtractedColors(colors);
      onPaletteSelect(colors);
    } catch (error) {
      console.error('Failed to extract palette:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [onPaletteSelect]);

  const loadImage = (file: File): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Resize for faster processing
        const maxSize = 200;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        resolve(imageData);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleColorClick = (color: string) => {
    navigator.clipboard.writeText(color);
  };

  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Extract Palette from Image
        </h3>
        <Icons.Image className="w-4 h-4 text-gray-500" />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="w-full py-3 px-4 bg-[#252627] hover:bg-gray-700 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-[#7d2ae8] border-t-transparent rounded-full animate-spin" />
            Extracting Colors...
          </>
        ) : (
          <>
            <Icons.Upload className="w-4 h-4" />
            Upload Image
          </>
        )}
      </button>

      {extractedColors.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] text-gray-500 mb-2">Extracted Colors (click to copy)</p>
          <div className="grid grid-cols-5 gap-2">
            {extractedColors.map((color, index) => (
              <button
                key={index}
                onClick={() => handleColorClick(color)}
                className="aspect-square rounded-lg border border-gray-600 hover:scale-110 transition-transform relative group"
                style={{ backgroundColor: color }}
                title={color}
              >
                <span className="absolute inset-x-0 bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[9px] px-1 py-0.5 rounded whitespace-nowrap">
                  {color}
                </span>
              </button>
            ))}
          </div>
          <p className="text-[9px] text-gray-600 mt-2 text-center">
            Colors copied to clipboard on click
          </p>
        </div>
      )}
    </div>
  );
};
