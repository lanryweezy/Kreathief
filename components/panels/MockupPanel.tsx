import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Icons } from '../../constants';
import { dynamicMockupsService } from '../../services/dynamicMockupsService';
import { MockupModal } from '../modals/MockupModal';
import { CornerHandles } from '../mockup/CornerHandles';
import { MOCKUP_CATEGORIES, getMockupsByCategory, searchMockups, getMockupById, MockupPlacement } from '../../services/enhancedMockupsLibrary';
import {
  getDefaultCornerPoints,
  applyCurveToCorners,
  CornerPoints,
} from '../../services/perspectiveTransform';

import { useStore } from '../../store/useStore';
import { v4 as uuidv4 } from 'uuid';

interface MockupPanelProps {
  onExportForMockup: () => Promise<string>;
}

export const MockupPanel: React.FC<MockupPanelProps> = ({ onExportForMockup }) => {
  const addLayer = useStore((state) => state.addLayer);
  const canvasSize = useStore((state) => state.canvasSize);

  const onAddToCanvas = (src: string) => {
    addLayer({
      id: uuidv4(),
      type: 'image',
      name: 'Mockup Layer',
      src,
      x: canvasSize.width / 2 - 250,
      y: canvasSize.height / 2 - 250,
      width: 500,
      height: 500,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      flipX: false,
      flipY: false,
      blendMode: 'normal',
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        blur: 0,
        sepia: 0,
        hueRotate: 0,
        vignette: 0,
        opacity: 1,
      },
      skewX: 0,
      skewY: 0,
    });
  };
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeMockupId, setActiveMockupId] = useState<string>('tshirt_flat');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLive, setIsLive] = useState(false); // Auto-update toggle
  const [proRenderUrl, setProRenderUrl] = useState<string | null>(null);
  const [isProGenerating, setIsProGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [useCornerPinning, setUseCornerPinning] = useState(false);
  const [cornerPoints, setCornerPoints] = useState<CornerPoints | null>(null);
  const [curve, setCurve] = useState(0);
  const [perspectivePreset, setPerspectivePreset] = useState<'flat' | 'angled' | 'curved'>('flat');
  const [previewContainerSize, setPreviewContainerSize] = useState({ width: 800, height: 600 });
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Current placement state (initialized from mockup default)
  const [placement, setPlacement] = useState<MockupPlacement>({
    top: 30,
    left: 30,
    width: 40,
    rotate: 0,
    skewX: 0,
    skewY: 0,
    opacity: 0.9,
    blendMode: 'multiply',
    useCornerPinning: false,
    curve: 0,
  });

  const liveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use enhanced mockups library
  const mockups = useMemo(() => {
    if (searchQuery.trim()) {
      return searchMockups(searchQuery);
    }
    return getMockupsByCategory(activeCategory);
  }, [activeCategory, searchQuery]);

  const currentMockup = useMemo(() => mockups.find((m) => m.id === activeMockupId) || mockups[0], [activeMockupId]);

  // When mockup changes, reset placement to default and initialize corner points
  useEffect(() => {
    if (currentMockup) {
      setPlacement(currentMockup.defaultPlacement);
      // Initialize corner points based on canvas size (will be refined in rendering)
      setCornerPoints(null);
      setCurve(0);
      setPerspectivePreset('flat');
    }
  }, [currentMockup]);

  // Handle corner change from drag interaction
  const handleCornerChange = useCallback(
    (corner: keyof CornerPoints, point: { x: number; y: number }) => {
      if (cornerPoints) {
        setCornerPoints({
          ...cornerPoints,
          [corner]: point,
        });
      }
    },
    [cornerPoints]
  );

  // Measure preview container size
  useEffect(() => {
    const updateContainerSize = () => {
      if (previewContainerRef.current) {
        const rect = previewContainerRef.current.getBoundingClientRect();
        setPreviewContainerSize({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);
    return () => window.removeEventListener('resize', updateContainerSize);
  }, []);

  // Capture design snapshot
  const captureDesign = async () => {
    try {
      const url = await onExportForMockup();
      setPreviewImage(url);
      return url;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  // Initial load
  useEffect(() => {
    captureDesign();
    return () => stopLive();
  }, []);

  const stopLive = () => {
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (isLive) {
      captureDesign();
      liveIntervalRef.current = setInterval(captureDesign, 2000);
    } else {
      stopLive();
    }
    return () => stopLive();
  }, [isLive]);

  // Generate the composite image with corner pinning support
  const generateComposite = async (): Promise<string | null> => {
    if (!previewImage) {
      return null;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }

    // 1. Load Background
    const bgImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = currentMockup.bg;
    });

    canvas.width = bgImg.naturalWidth;
    canvas.height = bgImg.naturalHeight;
    ctx.drawImage(bgImg, 0, 0);

    // 2. Load Design
    const designImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = previewImage;
    });

    // 3. Draw Design with transformations
    ctx.save();
    const { top, left, width, rotate, skewX, skewY, opacity, blendMode } = placement;

    // Calculate pixel data
    const x = (left / 100) * canvas.width;
    const y = (top / 100) * canvas.height;
    const w = (width / 100) * canvas.width;
    // Maintain aspect ratio of design
    const aspect = designImg.width / designImg.height;
    const h = w / aspect;

    // Use corner pinning if enabled
    if (useCornerPinning && cornerPoints) {
      // Apply curve if present
      const curvedCorners = curve !== 0
        ? applyCurveToCorners(cornerPoints, curve, canvas.width, canvas.height)
        : cornerPoints;

      // Create offscreen canvas for design
      const designCanvas = document.createElement('canvas');
      designCanvas.width = designImg.width;
      designCanvas.height = designImg.height;
      const designCtx = designCanvas.getContext('2d');
      if (designCtx) {
        designCtx.drawImage(designImg, 0, 0);
      }

      // Apply perspective transform using corner pinning
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = blendMode;

      // Use advanced warping with corner points
      warpImageToCorners(ctx, designCanvas, curvedCorners);
    } else {
      // Traditional transform method
      const centerX = x + w / 2;
      const centerY = y + h / 2;

      ctx.translate(centerX, centerY);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.transform(1, (skewY * Math.PI) / 180, (skewX * Math.PI) / 180, 1, 0, 0);
      ctx.translate(-centerX, -centerY);

      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = blendMode;

      ctx.drawImage(designImg, x, y, w, h);
    }

    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  // Advanced corner pinning warp function
  const warpImageToCorners = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement | HTMLCanvasElement,
    corners: CornerPoints
  ) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Create temporary canvas for pixel manipulation
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Draw image to temp canvas
    tempCtx.drawImage(image, 0, 0);

    // Get image data
    const imageData = tempCtx.getImageData(0, 0, image.width, image.height);
    const srcData = imageData.data;

    // Create output image data
    const outputImageData = ctx.createImageData(width, height);
    const destData = outputImageData.data;

    // Simple bilinear interpolation for warping
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        // Find corresponding source coordinate
        const src = getBilinearCoordinate(px, py, corners, width, height, image.width, image.height);

        if (src.x >= 0 && src.x < image.width - 1 && src.y >= 0 && src.y < image.height - 1) {
          // Bilinear interpolation
          const x0 = Math.floor(src.x);
          const y0 = Math.floor(src.y);
          const x1 = x0 + 1;
          const y1 = y0 + 1;

          const dx = src.x - x0;
          const dy = src.y - y0;

          const idx00 = (y0 * image.width + x0) * 4;
          const idx10 = (y0 * image.width + x1) * 4;
          const idx01 = (y1 * image.width + x0) * 4;
          const idx11 = (y1 * image.width + x1) * 4;

          const destIdx = (py * width + px) * 4;

          for (let c = 0; c < 3; c++) {
            const val =
              srcData[idx00 + c] * (1 - dx) * (1 - dy) +
              srcData[idx10 + c] * dx * (1 - dy) +
              srcData[idx01 + c] * (1 - dx) * dy +
              srcData[idx11 + c] * dx * dy;
            destData[destIdx + c] = val;
          }

          // Alpha channel
          const alpha =
            srcData[idx00 + 3] * (1 - dx) * (1 - dy) +
            srcData[idx10 + 3] * dx * (1 - dy) +
            srcData[idx01 + 3] * (1 - dx) * dy +
            srcData[idx11 + 3] * dx * dy;
          destData[destIdx + 3] = alpha;
        }
      }
    }

    ctx.putImageData(outputImageData, 0, 0);
  };

  // Bilinear interpolation helper
  const getBilinearCoordinate = (
    x: number,
    y: number,
    corners: CornerPoints,
    canvasWidth: number,
    canvasHeight: number,
    imageWidth: number,
    imageHeight: number
  ): { x: number; y: number } => {
    // Normalize to 0-1
    const u = x / canvasWidth;
    const v = y / canvasHeight;

    // Bilinear interpolation of corner points
    const leftX = corners.topLeft.x + (corners.bottomLeft.x - corners.topLeft.x) * v;
    const leftY = corners.topLeft.y + (corners.bottomLeft.y - corners.topLeft.y) * v;
    const rightX = corners.topRight.x + (corners.bottomRight.x - corners.topRight.x) * v;
    const rightY = corners.topRight.y + (corners.bottomRight.y - corners.topRight.y) * v;

    const targetX = leftX + (rightX - leftX) * u;
    const targetY = leftY + (rightY - leftY) * u;

    // Map back to source image coordinates
    const srcX = (targetX / canvasWidth) * imageWidth;
    const srcY = (targetY / canvasHeight) * imageHeight;

    return { x: srcX, y: srcY };
  };

  // Update preview when placement or source images change
  useEffect(() => {
    let active = true;
    const update = async () => {
      if (!previewImage) {
        return;
      }
      setIsGenerating(true);
      const url = await generateComposite();
      if (active && url) {
        setGeneratedPreview(url);
      }
      setIsGenerating(false);
    };
    // Debounce slightly for sliders
    const timer = setTimeout(update, 100);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [placement, previewImage, currentMockup]);

  const handleDownload = () => {
    if (generatedPreview) {
      const link = document.createElement('a');
      link.href = generatedPreview;
      link.download = `${currentMockup.name.toLowerCase().replace(/\s/g, '-')}-mockup.jpg`;
      link.click();
    }
  };

  const handleProRender = async () => {
    setIsProGenerating(true);
    setProRenderUrl(null);
    try {
      const designUrl = await captureDesign();
      if (!designUrl) {
        throw new Error('Failed to capture design');
      }

      const result = await dynamicMockupsService.generateMockup({
        mockupId: activeMockupId, // Ideally map to their template IDs
        designUrl: designUrl,
        placement: {
          top: placement.top,
          left: placement.left,
          width: placement.width,
          rotate: placement.rotate,
        },
      });

      if (result) {
        setProRenderUrl(result);
      }
    } catch (e) {
      console.error('Pro Render failed:', e);
    } finally {
      setIsProGenerating(false);
    }
  };

  const handleAddToCanvas = async () => {
    if (generatedPreview && onAddToCanvas) {
      onAddToCanvas(generatedPreview);
    }
  };

  const updatePlacement = (key: keyof MockupPlacement, val: any) => {
    setPlacement((p) => ({ ...p, [key]: val }));
  };

  return (
    <div className="flex flex-col h-full bg-[#13161a]">
      {/* Category Tabs */}
      <div className="flex overflow-x-auto custom-scrollbar border-b border-gray-800 bg-[#0e1318]">
        {MOCKUP_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat ? 'text-[#7d2ae8] border-b-2 border-[#7d2ae8]' : 'text-gray-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        {/* Helper Box */}
        <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
            <Icons.Magic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-200 mb-1">Smart Mockups</h4>
            <p className="text-[10px] text-blue-300/80 leading-relaxed">
              Automatically places your design onto high-quality product photos. Use the controls below to perfect the
              alignment.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search mockups (e.g., t-shirt, phone, coffee)..."
            className="w-full bg-[#1e1e1e] border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-[#7d2ae8] focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <Icons.X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between text-[10px] text-gray-400">
          <span>
            Showing <span className="text-white font-bold">{mockups.length}</span> mockups
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setPlacement({ ...placement, skewX: 0, skewY: 0, rotate: 0 });
              }}
              className="px-2 py-1 bg-[#1e1e1e] border border-gray-700 rounded hover:border-[#7d2ae8] transition-colors"
              title="Reset perspective"
            >
              Reset Perspective
            </button>
            <button
              onClick={() => {
                const current = getMockupById(activeMockupId);
                if (current) {
                  setPlacement(current.defaultPlacement);
                }
              }}
              className="px-2 py-1 bg-[#1e1e1e] border border-gray-700 rounded hover:border-[#7d2ae8] transition-colors"
              title="Reset all"
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
            {searchQuery ? 'Search Results' : 'Select Mockup'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {mockups.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMockupId(m.id)}
                className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                  activeMockupId === m.id
                    ? 'border-[#7d2ae8] ring-2 ring-[#7d2ae8]/20'
                    : 'border-gray-800 hover:border-gray-600'
                }`}
              >
                <img src={m.bg} alt={m.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-2">
                  <span className="text-[10px] font-bold text-white shadow-sm">{m.name}</span>
                </div>
                {m.category && (
                  <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[8px] text-gray-300">
                    {m.category}
                  </div>
                )}
              </button>
            ))}
          </div>
          {mockups.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-xs">
              <Icons.Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No mockups found for &quot;{searchQuery}&quot;</p>
              <button onClick={() => setSearchQuery('')} className="mt-2 text-[#7d2ae8] hover:underline">
                Clear search
              </button>
            </div>
          )}
        </div>

        {/* Preview & Controls */}
        <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-[#0e1318]">
            <span className="text-xs font-bold text-gray-300">Preview</span>
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                isLive
                  ? 'bg-red-900/20 border-red-500/50 text-red-400 animate-pulse'
                  : 'bg-gray-800 border-gray-700 text-gray-400'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-red-500' : 'bg-gray-500'}`} />
              {isLive ? 'LIVE SYNC' : 'SYNC OFF'}
            </button>
          </div>

          <div
            ref={previewContainerRef}
            className="aspect-video relative bg-[#0e1318] flex items-center justify-center p-4 overflow-hidden"
          >
            {isGenerating && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="animate-spin w-6 h-6 border-2 border-[#7d2ae8] border-t-transparent rounded-full" />
              </div>
            )}
            {generatedPreview ? (
              <>
                <img
                  src={generatedPreview}
                  className="max-w-full max-h-full object-contain shadow-2xl rounded"
                  alt="Mockup preview"
                />
                {/* Interactive Corner Handles Overlay */}
                {useCornerPinning && cornerPoints && (
                  <CornerHandles
                    cornerPoints={cornerPoints}
                    onCornerChange={handleCornerChange}
                    containerWidth={previewContainerSize.width - 32} // Account for padding
                    containerHeight={previewContainerSize.height - 32}
                    isVisible={useCornerPinning}
                  />
                )}
              </>
            ) : (
              <span className="text-gray-600 text-xs">Generating preview...</span>
            )}
          </div>

          {/* Adjustments */}
          <div className="p-4 space-y-4 bg-[#1a1d21]">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-700/50">
              <button
                onClick={() => {
                  // Auto-fit: Reset to default placement for current mockup
                  const current = getMockupById(activeMockupId);
                  if (current) {
                    setPlacement(current.defaultPlacement);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7d2ae8]/20 border border-[#7d2ae8]/50 text-[#7d2ae8] rounded-lg text-[10px] font-bold hover:bg-[#7d2ae8]/30 transition-all"
                title="Auto-fit to mockup default position"
              >
                <Icons.Magic className="w-3.5 h-3.5" />
                Auto-Fit
              </button>
              <button
                onClick={() => {
                  // Smart blend: Set optimal blend mode based on mockup category
                  const current = getMockupById(activeMockupId);
                  if (current) {
                    const isApparel = current.category === 'Apparel';
                    const isPrint = current.category === 'Print';
                    updatePlacement(
                      'blendMode',
                      isApparel ? 'multiply' : isPrint ? 'multiply' : 'source-over'
                    );
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00c4cc]/20 border border-[#00c4cc]/50 text-[#00c4cc] rounded-lg text-[10px] font-bold hover:bg-[#00c4cc]/30 transition-all"
                title="Apply smart blend mode for this mockup type"
              >
                <Icons.Layers className="w-3.5 h-3.5" />
                Smart Blend
              </button>
              <button
                onClick={() => {
                  // Reset perspective only
                  setPlacement({ ...placement, skewX: 0, skewY: 0, rotate: 0 });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/50 border border-gray-600 text-gray-300 rounded-lg text-[10px] font-bold hover:bg-gray-700 transition-all"
                title="Reset perspective adjustments"
              >
                <Icons.RefreshCw className="w-3.5 h-3.5" />
                Reset View
              </button>
            </div>

            {/* Corner Pinning Toggle */}
            <div className="p-3 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icons.Grid className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                    Corner Pinning (4-Point Perspective)
                  </span>
                </div>
                <button
                  onClick={() => {
                    setUseCornerPinning(!useCornerPinning);
                    if (!useCornerPinning) {
                      // Initialize corner points when enabling
                      const defaultCorners = getDefaultCornerPoints(
                        previewContainerSize.width - 32,
                        previewContainerSize.height - 32,
                        placement
                      );
                      setCornerPoints(defaultCorners);
                    }
                  }}
                  className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-all ${
                    useCornerPinning
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-purple-500/50'
                  }`}
                >
                  {useCornerPinning ? 'ON' : 'OFF'}
                </button>
              </div>

              {useCornerPinning && (
                <div className="space-y-3">
                  {/* Perspective Presets */}
                  <div className="flex gap-2">
                    {(['flat', 'angled', 'curved'] as const).map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          setPerspectivePreset(preset);
                          if (preset === 'flat') {
                            setCurve(0);
                            setPlacement({ ...placement, skewX: 0, skewY: 0 });
                          } else if (preset === 'angled') {
                            setPlacement({ ...placement, skewX: 10, skewY: 5 });
                          } else if (preset === 'curved') {
                            setCurve(15);
                          }
                        }}
                        className={`flex-1 py-1.5 rounded text-[9px] font-bold uppercase transition-all ${
                          perspectivePreset === preset
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {/* Curve Control */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[9px] text-gray-400 font-bold uppercase">Curve (Cylindrical)</span>
                      <span className="text-[9px] text-white font-mono">{curve}°</span>
                    </div>
                    <input
                      type="range"
                      min="-30"
                      max="30"
                      value={curve}
                      onChange={(e) => setCurve(Number(e.target.value))}
                      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>

                  {/* Corner Controls */}
                  <div className="grid grid-cols-2 gap-2 text-[9px]">
                    <div className="bg-gray-800/50 p-2 rounded">
                      <span className="text-gray-500 block mb-1">Top Left</span>
                      <div className="space-y-1">
                        <input
                          type="number"
                          value={cornerPoints?.topLeft.x.toFixed(0) || '0'}
                          onChange={(e) => {
                            if (cornerPoints) {
                              setCornerPoints({
                                ...cornerPoints,
                                topLeft: { ...cornerPoints.topLeft, x: Number(e.target.value) },
                              });
                            }
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-white"
                          placeholder="X"
                        />
                        <input
                          type="number"
                          value={cornerPoints?.topLeft.y.toFixed(0) || '0'}
                          onChange={(e) => {
                            if (cornerPoints) {
                              setCornerPoints({
                                ...cornerPoints,
                                topLeft: { ...cornerPoints.topLeft, y: Number(e.target.value) },
                              });
                            }
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-white"
                          placeholder="Y"
                        />
                      </div>
                    </div>
                    <div className="bg-gray-800/50 p-2 rounded">
                      <span className="text-gray-500 block mb-1">Top Right</span>
                      <div className="space-y-1">
                        <input
                          type="number"
                          value={cornerPoints?.topRight.x.toFixed(0) || '0'}
                          onChange={(e) => {
                            if (cornerPoints) {
                              setCornerPoints({
                                ...cornerPoints,
                                topRight: { ...cornerPoints.topRight, x: Number(e.target.value) },
                              });
                            }
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-white"
                          placeholder="X"
                        />
                        <input
                          type="number"
                          value={cornerPoints?.topRight.y.toFixed(0) || '0'}
                          onChange={(e) => {
                            if (cornerPoints) {
                              setCornerPoints({
                                ...cornerPoints,
                                topRight: { ...cornerPoints.topRight, y: Number(e.target.value) },
                              });
                            }
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-white"
                          placeholder="Y"
                        />
                      </div>
                    </div>
                    <div className="bg-gray-800/50 p-2 rounded">
                      <span className="text-gray-500 block mb-1">Bottom Left</span>
                      <div className="space-y-1">
                        <input
                          type="number"
                          value={cornerPoints?.bottomLeft.x.toFixed(0) || '0'}
                          onChange={(e) => {
                            if (cornerPoints) {
                              setCornerPoints({
                                ...cornerPoints,
                                bottomLeft: { ...cornerPoints.bottomLeft, x: Number(e.target.value) },
                              });
                            }
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-white"
                          placeholder="X"
                        />
                        <input
                          type="number"
                          value={cornerPoints?.bottomLeft.y.toFixed(0) || '0'}
                          onChange={(e) => {
                            if (cornerPoints) {
                              setCornerPoints({
                                ...cornerPoints,
                                bottomLeft: { ...cornerPoints.bottomLeft, y: Number(e.target.value) },
                              });
                            }
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-white"
                          placeholder="Y"
                        />
                      </div>
                    </div>
                    <div className="bg-gray-800/50 p-2 rounded">
                      <span className="text-gray-500 block mb-1">Bottom Right</span>
                      <div className="space-y-1">
                        <input
                          type="number"
                          value={cornerPoints?.bottomRight.x.toFixed(0) || '0'}
                          onChange={(e) => {
                            if (cornerPoints) {
                              setCornerPoints({
                                ...cornerPoints,
                                bottomRight: { ...cornerPoints.bottomRight, x: Number(e.target.value) },
                              });
                            }
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-white"
                          placeholder="X"
                        />
                        <input
                          type="number"
                          value={cornerPoints?.bottomRight.y.toFixed(0) || '0'}
                          onChange={(e) => {
                            if (cornerPoints) {
                              setCornerPoints({
                                ...cornerPoints,
                                bottomRight: { ...cornerPoints.bottomRight, y: Number(e.target.value) },
                              });
                            }
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-white"
                          placeholder="Y"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Position */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-400">Position (X / Y)</span>
                <span className="text-gray-500">
                  {Math.round(placement.left)}%, {Math.round(placement.top)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={placement.left}
                  onChange={(e) => updatePlacement('left', Number(e.target.value))}
                  className="h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={placement.top}
                  onChange={(e) => updatePlacement('top', Number(e.target.value))}
                  className="h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                />
              </div>
            </div>

            {/* Scale & Rotate */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-400">Scale / Rotate</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="range"
                  min="10"
                  max="150"
                  value={placement.width}
                  onChange={(e) => updatePlacement('width', Number(e.target.value))}
                  className="h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                  title="Scale"
                />
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={placement.rotate}
                  onChange={(e) => updatePlacement('rotate', Number(e.target.value))}
                  className="h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                  title="Rotate"
                />
              </div>
            </div>

            {/* Perspective (Skew) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-400">Perspective (Skew X / Y)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="range"
                  min="-45"
                  max="45"
                  value={placement.skewX || 0}
                  onChange={(e) => updatePlacement('skewX', Number(e.target.value))}
                  className="h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                />
                <input
                  type="range"
                  min="-45"
                  max="45"
                  value={placement.skewY || 0}
                  onChange={(e) => updatePlacement('skewY', Number(e.target.value))}
                  className="h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                />
              </div>
            </div>

            {/* Opacity & Blend */}
            <div className="space-y-3 pt-2 border-t border-gray-700/50">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-gray-400">Blend Mode</label>
                <select
                  value={placement.blendMode}
                  onChange={(e) => updatePlacement('blendMode', e.target.value)}
                  className="bg-black border border-gray-700 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-[#7d2ae8]"
                >
                  <option value="source-over">Normal</option>
                  <option value="multiply">Multiply (Realistic)</option>
                  <option value="screen">Screen (Light)</option>
                  <option value="overlay">Overlay</option>
                  <option value="soft-light">Soft Light</option>
                </select>
              </div>
            </div>

            {proRenderUrl && (
              <div className="mt-4 p-2 bg-[#1e252e] rounded-lg border border-[#7d2ae8]/30 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-[#7d2ae8] font-bold">PRO RENDER RESULTS</span>
                  <button onClick={() => setProRenderUrl(null)} className="text-gray-500 hover:text-white">
                    <Icons.X className="w-3 h-3" />
                  </button>
                </div>
                <img src={proRenderUrl} className="w-full rounded shadow-lg" alt="Pro Mockup" />
                <a
                  href={proRenderUrl}
                  download="mockup_pro.png"
                  className="mt-2 w-full py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1"
                >
                  <Icons.Download className="w-3 h-3" /> Save Render
                </a>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-3 bg-[#0e1318] border-t border-gray-800 flex flex-col gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-[#7d2ae8] hover:bg-[#6c23ce] text-white py-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7d2ae8]/20"
            >
              <Icons.Maximize className="w-4 h-4" />
              Open Full Preview
            </button>
            <button
              onClick={handleDownload}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Icons.Download className="w-4 h-4" />
              Quick Download
            </button>
            <button
              onClick={handleProRender}
              disabled={isProGenerating}
              className={`w-full py-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                isProGenerating
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#7d2ae8] to-[#00c4cc] hover:from-[#6c23ce] hover:to-[#00b0b8] text-white shadow-lg'
              }`}
            >
              {isProGenerating ? (
                <>
                  <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div>
                  Rendering...
                </>
              ) : (
                <>
                  <Icons.Zap className="w-4 h-4 text-yellow-300" />
                  Pro Render (Dynamic)
                </>
              )}
            </button>
          </div>
        </div>

        <button
          onClick={handleAddToCanvas}
          className="w-full py-2 bg-gray-800 text-gray-300 hover:text-white border border-gray-700 rounded text-xs font-bold transition-colors"
        >
          Add Mockup to Canvas
        </button>
      </div>

      {showModal && previewImage && <MockupModal designImage={previewImage} onClose={() => setShowModal(false)} />}
    </div>
  );
};
export default MockupPanel;
