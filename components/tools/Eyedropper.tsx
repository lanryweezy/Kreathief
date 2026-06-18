import React, { useEffect, useRef, useState } from 'react';
import { Icons } from '../../constants';

interface EyedropperProps {
  onColorPick: (color: string) => void;
  onClose: () => void;
  isActive: boolean;
}

export const Eyedropper: React.FC<EyedropperProps> = ({ onColorPick, onClose, isActive }) => {
  const [pickedColor, setPickedColor] = useState<string>('#000000');
  const [hexValue, setHexValue] = useState<string>('#000000');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Create a full-screen canvas for color picking
  useEffect(() => {
    if (!isActive || !overlayRef.current) {
      return;
    }

    const overlay = overlayRef.current;
    const rect = overlay.getBoundingClientRect();

    // Create canvas for screenshot
    const canvas = document.createElement('canvas');
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Hide overlay temporarily to capture what's underneath
      overlay.style.pointerEvents = 'none';

      // Capture the screen - html2canvas not installed
      // html2canvas(document.body, {
      //   useCORS: true,
      //   allowTaint: true,
      //   backgroundColor: null,
      // }).then((capturedCanvas) => {
      //   ctx.drawImage(capturedCanvas, 0, 0);
      //   canvasRef.current = canvas;
      //   overlay.style.pointerEvents = 'auto';
      // }).catch(() => {
      //   // Fallback: just use a solid color
      //   overlay.style.pointerEvents = 'auto';
      // });

      // Fallback for now
      overlay.style.pointerEvents = 'auto';
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          const color = rgbToHex(pixel[0], pixel[1], pixel[2]);
          setPickedColor(color);
          setHexValue(color);
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onColorPick(pickedColor);
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, onColorPick, onClose, pickedColor]);

  // Simple RGB to Hex helper
  const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (n: number) => {
      const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  if (!isActive) {
    return null;
  }

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9999] cursor-crosshair"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          pointerEvents: 'auto',
        }}
      >
        {/* Magnifier */}
        <div
          className="fixed pointer-events-none bg-white rounded-lg shadow-2xl border-2 border-[#7d2ae8] overflow-hidden"
          style={{
            left: position.x + 20,
            top: position.y - 100,
            width: '100px',
            height: '100px',
            transform: 'scale(4)',
            transformOrigin: 'center center',
          }}
        >
          <div
            className="w-full h-full"
            style={{
              backgroundColor: pickedColor,
              backgroundImage: `
                linear-gradient(45deg, #ccc 25%, transparent 25%),
                linear-gradient(-45deg, #ccc 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #ccc 75%),
                linear-gradient(-45deg, transparent 75%, #ccc 75%)
              `,
              backgroundSize: '10px 10px',
              backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
            }}
          >
            <div className="w-full h-full" style={{ backgroundColor: pickedColor }} />
          </div>
        </div>

        {/* Color Info */}
        <div
          className="fixed pointer-events-none bg-[#1e1e1e] border border-gray-700 rounded-lg shadow-xl px-4 py-3 flex items-center gap-3"
          style={{
            left: position.x + 20,
            top: position.y + 20,
          }}
        >
          <div className="w-10 h-10 rounded border border-gray-600" style={{ backgroundColor: pickedColor }} />
          <div className="flex flex-col">
            <span className="text-white font-bold text-sm font-mono uppercase">{hexValue}</span>
            <span className="text-gray-400 text-xs">
              RGB({parseInt(hexValue.slice(1, 3), 16)}, {parseInt(hexValue.slice(3, 5), 16)},{' '}
              {parseInt(hexValue.slice(5, 7), 16)})
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-2xl px-6 py-4 flex items-center gap-6">
          <div className="flex items-center gap-2 text-white">
            <Icons.EyeDropper className="w-5 h-5 text-[#7d2ae8]" />
            <span className="font-bold text-sm">Click to pick color</span>
          </div>
          <div className="w-px h-6 bg-gray-700" />
          <div className="flex items-center gap-2 text-gray-400">
            <kbd className="px-2 py-1 bg-gray-800 rounded text-xs font-mono">ESC</kbd>
            <span className="text-sm">Cancel</span>
          </div>
        </div>
      </div>
    </>
  );
};
