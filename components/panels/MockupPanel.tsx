import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Icons } from '../../constants';
import { vecteezyService, VecteezyResource } from '../../services/vecteezyService';
import { MockupModal } from '../modals/MockupModal';
import { CornerHandles } from '../mockup/CornerHandles';
import {
  MOCKUP_CATEGORIES,
  getMockupsByCategory,
  searchMockups,
  getMockupById,
  MockupPlacement,
} from '../../services/enhancedMockupsLibrary';
import { log } from '../../utils/log';
import { dynamicMockupsService } from '../../services/dynamicMockupsService';
import { getDefaultCornerPoints, applyCurveToCorners, CornerPoints } from '../../services/perspectiveTransform';

import { useStore } from '../../store/useStore';
import { v4 as uuidv4 } from 'uuid';
import { PanelErrorBoundary } from './PanelErrorBoundary';

interface MockupPanelProps {
  onExportForMockup: () => Promise<string>;
  variant?: 'default' | 'full';
  onClose?: () => void;
}

export const MockupPanel: React.FC<MockupPanelProps> = ({ onExportForMockup, variant = 'default', onClose }) => {
  const addLayer = useStore((state) => state.addLayer);
  const canvasSize = useStore((state) => state.canvasSize);
  const addToast = useStore((state) => state.addToast);
  const artboards = useStore((state) => state.artboards);
  const canvasBackgroundColor = useStore((state) => state.canvasBackgroundColor);

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
  const [activeTab, setActiveTab] = useState<'placement' | 'effects' | 'presets'>('placement');
  const [activeMockupId, setActiveMockupId] = useState<string>('tshirt_flat');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLive, setIsLive] = useState(false); // Auto-update toggle
  const [isProGenerating, setIsProGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [useCornerPinning, setUseCornerPinning] = useState(false);
  const [cornerPoints, setCornerPoints] = useState<CornerPoints | null>(null);
  const [curve, setCurve] = useState(0);
  const [perspectivePreset, setPerspectivePreset] = useState<'flat' | 'angled' | 'curved'>('flat');
  const [previewContainerSize, setPreviewContainerSize] = useState({ width: 800, height: 600 });
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Custom mockup upload
  const [customMockup, setCustomMockup] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPosition, setComparisonPosition] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Batch generation
  const [batchMode, setBatchMode] = useState(false);
  const [selectedMockupIds, setSelectedMockupIds] = useState<string[]>([]);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, name: '' });

  // Favorites
  const [favoriteMockups, setFavoriteMockups] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kreathief_mockup_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Vecteezy integration
  const [vecteezyResults, setVecteezyResults] = useState<VecteezyResource[]>([]);
  const [isSearchingVecteezy, setIsSearchingVecteezy] = useState(false);

  // Smart suggestions
  const [suggestedMockups, setSuggestedMockups] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Search Vecteezy when query changes
  useEffect(() => {
    if (!searchQuery.trim() || !vecteezyService.isConfigured()) {
      setVecteezyResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingVecteezy(true);
      const results = await vecteezyService.searchResources(searchQuery + ' mockup blank');
      setVecteezyResults(results);
      setIsSearchingVecteezy(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // App Store presets
  const APP_STORE_PRESETS = {
    'iOS Complete': ['iphone_16_pro', 'iphone_16_pro_max', 'ipad_pro', 'macbook'],
    'Android Complete': ['pixel_9_pro', 'samsung_s24', 'android_tablet'],
    'Social Media Pack': ['instagram_post', 'instagram_story', 'facebook_post', 'twitter_header'],
    'Print Pack': ['business_card', 'flyer_table', 'magazine', 'poster_frame'],
  };

  // AI Auto-Perspective Detection
  const [isDetecting, setIsDetecting] = useState(false);

  const handleUploadMockup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomMockup(url);
      addToast('Custom mockup uploaded! Adjust placement to fit.', 'success');
    }
  };

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    try {
      // Analyze the current mockup background to detect surface/placement area
      const bgImageSrc = customMockup || currentMockup?.bg;
      if (!bgImageSrc) {
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = bgImageSrc;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Create canvas to analyze image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      // Get image data for analysis
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Simple heuristic: find the largest uniform/low-contrast area (likely a placement surface)
      // This is a simplified version - real AI would use ML model
      const regions: { x: number; y: number; width: number; height: number; variance: number }[] = [];

      // Scan grid of regions
      const gridSize = 20;
      const regionW = canvas.width / gridSize;
      const regionH = canvas.height / gridSize;

      for (let gy = 5; gy < gridSize - 5; gy++) {
        for (let gx = 5; gx < gridSize - 5; gx++) {
          const x = Math.floor(gx * regionW);
          const y = Math.floor(gy * regionH);
          const w = Math.floor(regionW * 3);
          const h = Math.floor(regionH * 3);

          // Calculate variance in this region (lower = more uniform = better placement area)
          let sum = 0;
          let sumSq = 0;
          let count = 0;

          for (let py = y; py < y + h; py += 4) {
            for (let px = x; px < x + w; px += 4) {
              const idx = (py * canvas.width + px) * 4;
              // Convert to grayscale
              const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
              sum += gray;
              sumSq += gray * gray;
              count++;
            }
          }

          const mean = sum / count;
          const variance = sumSq / count - mean * mean;

          regions.push({ x, y, width: w, height: h, variance });
        }
      }

      // Sort by variance (lowest first - most uniform areas)
      regions.sort((a, b) => a.variance - b.variance);

      // Take the best region
      const best = regions[0];

      if (best) {
        // Calculate placement as percentage
        const newPlacement: MockupPlacement = {
          top: (best.y / canvas.height) * 100,
          left: (best.x / canvas.width) * 100,
          width: (best.width / canvas.width) * 100,
          rotate: 0,
          skewX: 0,
          skewY: 0,
          opacity: 0.9,
          blendMode: 'multiply' as const,
        };

        setPlacement(newPlacement);
        addToast('Auto-detected optimal placement area!', 'success');
      } else {
        addToast('Could not detect placement area. Try manual adjustment.', 'error');
      }
    } catch (error) {
      log.error('[MockupPanel] Auto-detect failed', error);
      addToast('Auto-detect failed. Please adjust manually.', 'error');
    } finally {
      setIsDetecting(false);
    }
  };

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kreathief_mockup_favorites', JSON.stringify(favoriteMockups));
    } catch (e) {
      log.error('[MockupPanel] Failed to save favorites to localStorage', e);
    }
  }, [favoriteMockups]);

  const toggleFavorite = (mockupId: string) => {
    setFavoriteMockups((prev) =>
      prev.includes(mockupId) ? prev.filter((id) => id !== mockupId) : [...prev, mockupId]
    );
  };

  // Smart mockup suggestions
  const suggestMockups = async () => {
    setIsAnalyzing(true);
    try {
      const designUrl = await captureDesign();
      if (!designUrl) {
        return;
      }

      // Analyze design characteristics
      const img = new Image();
      img.src = designUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Calculate aspect ratio
      const aspectRatio = canvas.width / canvas.height;

      // Match mockups to design characteristics
      const suggestions = mockups
        .filter((_m) => {
          const mockupAspect = 1;
          return Math.abs(aspectRatio - mockupAspect) < 0.5;
        })
        .slice(0, 6)
        .map((m) => m.id);

      setSuggestedMockups(suggestions);
      addToast(`Found ${suggestions.length} perfect mockups for your design!`, 'success');
    } catch (error) {
      log.error('[MockupPanel] Suggestion failed', error);
      addToast('Could not analyze design', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Batch generation
  const toggleBatchMode = () => {
    setBatchMode(!batchMode);
    setSelectedMockupIds([]);
  };

  const toggleMockupSelection = (mockupId: string) => {
    setSelectedMockupIds((prev) =>
      prev.includes(mockupId) ? prev.filter((id) => id !== mockupId) : [...prev, mockupId]
    );
  };

  const generateBatchMockups = async () => {
    if (selectedMockupIds.length === 0) {
      return;
    }

    setIsBatchGenerating(true);
    setBatchProgress({ current: 0, total: selectedMockupIds.length, name: '' });
    addToast(`Generating ${selectedMockupIds.length} mockups...`, 'info');

    try {
      const designUrl = await captureDesign();
      if (!designUrl) {
        throw new Error('Failed to capture design');
      }

      for (let i = 0; i < selectedMockupIds.length; i++) {
        const mockupId = selectedMockupIds[i];
        const mockup = getMockupById(mockupId);
        if (!mockup) {
          continue;
        }

        setBatchProgress({ current: i + 1, total: selectedMockupIds.length, name: mockup.name });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          continue;
        }

        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        bgImg.src = mockup.bg;
        await new Promise((resolve) => {
          bgImg.onload = resolve;
        });

        canvas.width = bgImg.naturalWidth;
        canvas.height = bgImg.naturalHeight;
        ctx.drawImage(bgImg, 0, 0);

        const designImg = new Image();
        designImg.src = designUrl;
        await new Promise((resolve) => {
          designImg.onload = resolve;
        });

        const { top, left, width } = mockup.defaultPlacement;
        const x = (left / 100) * canvas.width;
        const y = (top / 100) * canvas.height;
        const w = (width / 100) * canvas.width;
        const h = w / (designImg.width / designImg.height);

        ctx.globalAlpha = 0.9;
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(designImg, x, y, w, h);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        addLayer({
          id: uuidv4(),
          type: 'image',
          name: `${mockup.name} Mockup`,
          src: dataUrl,
          x: 50 + selectedMockupIds.indexOf(mockupId) * 520,
          y: 50,
          width: 500,
          height: 500,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          flipX: false,
          flipY: false,
          blendMode: 'normal',
          filters: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0,
            opacity: 1,
            grayscale: 0,
            sepia: 0,
            hueRotate: 0,
            vignette: 0,
          },
        });
      }

      addToast(`✅ Generated ${selectedMockupIds.length} mockups!`, 'success');
      setBatchMode(false);
      setSelectedMockupIds([]);
    } catch (error) {
      log.error('[MockupPanel] Batch generation failed', error);
      addToast('Batch generation failed', 'error');
    } finally {
      setIsBatchGenerating(false);
    }
  };

  // App Store preset generator
  const generatePreset = async (presetName: string) => {
    const mockupIds = APP_STORE_PRESETS[presetName as keyof typeof APP_STORE_PRESETS];
    if (!mockupIds) {
      return;
    }

    setSelectedMockupIds(mockupIds);
    addToast(`Selected ${mockupIds.length} mockups for ${presetName}`, 'success');
    setBatchMode(true);
  };

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

  const [shadowIntensity, setShadowIntensity] = useState(1);
  const [reflectionIntensity, setReflectionIntensity] = useState(0);
  const [lightingContrast, setLightingContrast] = useState(100);
  const [lightingBrightness, setLightingBrightness] = useState(100);

  const liveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use enhanced mockups library
  const mockups = useMemo(() => {
    if (searchQuery.trim()) {
      return searchMockups(searchQuery);
    }
    return getMockupsByCategory(activeCategory);
  }, [activeCategory, searchQuery]);

  // Filter mockups based on favorites and suggestions
  const filteredMockups = useMemo(() => {
    let result = mockups;

    if (showFavoritesOnly) {
      result = result.filter((m) => favoriteMockups.includes(m.id));
    }

    if (suggestedMockups.length > 0 && !showFavoritesOnly) {
      // Show suggested first, then others
      const suggested = result.filter((m) => suggestedMockups.includes(m.id));
      const others = result.filter((m) => !suggestedMockups.includes(m.id));
      result = [...suggested, ...others];
    }

    return result;
  }, [mockups, favoriteMockups, suggestedMockups, showFavoritesOnly]);

  const currentMockup = useMemo(() => {
    if (activeMockupId === 'custom' && customMockup) {
      return {
        id: 'custom',
        name: 'Custom Upload',
        category: 'Custom',
        bg: customMockup,
        defaultPlacement: placement,
        tags: ['custom', 'upload'],
      };
    }
    const vecteezyMatch = vecteezyResults.find((v) => v.id === activeMockupId);
    if (vecteezyMatch) {
      return {
        id: vecteezyMatch.id,
        name: vecteezyMatch.title,
        category: 'Vecteezy',
        bg: vecteezyMatch.preview_url,
        defaultPlacement: {
          top: 30,
          left: 30,
          width: 40,
          rotate: 0,
          skewX: 0,
          skewY: 0,
          opacity: 0.9,
          blendMode: 'multiply' as const,
        },
        tags: ['vecteezy'],
      };
    }
    return mockups.find((m) => m.id === activeMockupId) || mockups[0];
  }, [activeMockupId, mockups, customMockup, placement, vecteezyResults]);

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
      log.error('[MockupPanel] Failed to capture design for mockup', e);
      return null;
    }
  };

  // Initial load & refresh on canvas updates
  useEffect(() => {
    captureDesign();
    return () => stopLive();
  }, [artboards, canvasBackgroundColor]);

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

  // Generate the composite image using Web Worker
  const generateComposite = async (): Promise<string | null> => {
    if (!previewImage) {
      return null;
    }

    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        const worker = new Worker(new URL('../../workers/mockup.worker.ts', import.meta.url), { type: 'module' });

        // Load Background
        const bgImg = await new Promise<HTMLImageElement>((res, rej) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => res(img);
          img.onerror = rej;
          img.src = currentMockup.bg;
        });

        // Load Design
        const designImg = await new Promise<HTMLImageElement>((res, rej) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => res(img);
          img.onerror = rej;
          img.src = previewImage;
        });

        // Create bitmaps for worker
        const bgBitmap = await createImageBitmap(bgImg);
        const designBitmap = await createImageBitmap(designImg);

        worker.onmessage = (e) => {
          if (e.data.type === 'SUCCESS') {
            const url = URL.createObjectURL(e.data.payload);
            resolve(url);
          } else {
            reject(new Error(e.data.error));
          }
          worker.terminate();
        };

        worker.onerror = (err) => {
          reject(err);
          worker.terminate();
        };

        worker.postMessage(
          {
            bgBitmap,
            designBitmap,
            placement: { ...placement, useCornerPinning },
            cornerPoints: useCornerPinning ? cornerPoints : undefined,
            shadowIntensity,
            reflectionIntensity,
            lightingBrightness,
            lightingContrast,
          },
          [bgBitmap, designBitmap]
        ); // Transfer ownership of bitmaps
      } catch (err) {
        log.error('Mockup Worker setup failed', err);
        resolve(null); // return null rather than crash
      }
    });
  };

  // Removed slow main-thread warp logic since it's now handled by the worker

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
        // Log removed for production
      }
    } catch (e) {
      log.error('[MockupPanel] Pro mockup render failed', e);
      addToast('Pro render failed. Please try again.', 'error');
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

  if (variant === 'full') {
    return (
      <div className="flex h-full w-full bg-[#0e1318] text-white overflow-hidden relative">
        {/* Left Column: Mockup Library */}
        <div className="w-[320px] flex flex-col border-r border-gray-800 bg-surface-dark-2 shrink-0">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <h2 className="text-sm font-black uppercase tracking-widest text-brand-600">Smart Mockups</h2>
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close panel"
                className="p-1 hover:bg-white/5 rounded-md text-gray-500 hover:text-white transition-all"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
            <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg">
              <p className="text-[10px] text-blue-300/80 leading-relaxed">
                Automatically places your design onto high-quality product photos. Use the controls below to perfect the
                alignment.
              </p>
            </div>

            {/* Quick Actions Row */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={suggestMockups}
                disabled={isAnalyzing}
                className="flex-1 min-w-[120px] px-3 py-2 bg-gradient-to-r from-brand-600 to-accent rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30"
              >
                {isAnalyzing ? (
                  <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Icons.Magic className="w-3.5 h-3.5" />
                )}
                Suggest
              </button>
              <button
                onClick={toggleBatchMode}
                className={`flex-1 min-w-[120px] px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  batchMode
                    ? 'bg-brand-600 text-white shadow-lg'
                    : 'bg-surface-dark-3 text-gray-400 border border-gray-700 hover:border-white/20'
                }`}
              >
                <Icons.Layers className="w-3.5 h-3.5" />
                Batch {batchMode && `(${selectedMockupIds.length})`}
              </button>
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                  showFavoritesOnly
                    ? 'bg-red-500 text-white'
                    : 'bg-surface-dark-3 text-gray-400 border border-gray-700 hover:border-white/20'
                }`}
              >
                <Icons.Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                Favorites
              </button>
            </div>

            {/* App Store Presets */}
            <div className="p-3 bg-gradient-to-br from-brand-600/10 to-accent/10 border border-brand-600/20 rounded-lg">
              <h4 className="text-[9px] font-black text-white uppercase tracking-wider mb-2 flex items-center gap-1">
                <Icons.Zap className="w-3 h-3 text-brand-600" />
                Quick Sets
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(APP_STORE_PRESETS).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => generatePreset(preset)}
                    className="px-2 py-1 bg-surface-dark-3 hover:bg-brand-600/20 border border-gray-700 hover:border-brand-600 rounded text-[8px] font-bold text-gray-400 hover:text-white transition-all"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search mockups..."
                className="w-full bg-surface-dark-3 border border-gray-700 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:border-brand-600 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>
                Showing <span className="text-white font-bold">{filteredMockups.length}</span> mockups
                {showFavoritesOnly ? ' (Favorites)' : ''}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleAutoDetect}
                  disabled={isDetecting}
                  className="px-2 py-1 bg-brand-600/20 border border-brand-600/50 rounded hover:border-brand-600 transition-colors text-brand-600 flex items-center gap-1 disabled:opacity-50"
                  title="AI Auto-Detect optimal placement"
                >
                  {isDetecting ? (
                    <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <Icons.Magic className="w-3 h-3" />
                  )}
                  Auto-Detect
                </button>
                <button
                  onClick={() => setPlacement({ ...placement, skewX: 0, skewY: 0, rotate: 0 })}
                  className="px-2 py-1 bg-surface-dark-3 border border-gray-700 rounded hover:border-brand-600 transition-colors"
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
                  className="px-2 py-1 bg-surface-dark-3 border border-gray-700 rounded hover:border-brand-600 transition-colors"
                >
                  Reset All
                </button>
              </div>
            </div>

            {batchMode && (
              <div className="p-3 bg-brand-600/10 border border-brand-600/30 rounded-lg">
                <p className="text-[9px] text-brand-600 font-bold mb-2">
                  📦 Batch Mode: Select multiple mockups to generate
                </p>
                {isBatchGenerating && (
                  <div className="mb-2">
                    <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                      <span>{batchProgress.name || 'Preparing...'}</span>
                      <span>{batchProgress.current}/{batchProgress.total}</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-dark-3 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-600 rounded-full transition-all duration-300"
                        style={{ width: `${(batchProgress.current / batchProgress.total) * 100 || 0}%` }}
                      />
                    </div>
                  </div>
                )}
                <button
                  onClick={generateBatchMockups}
                  disabled={selectedMockupIds.length === 0 || isBatchGenerating}
                  className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded font-bold text-[10px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBatchGenerating ? (
                    <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Icons.Download className="w-3.5 h-3.5" />
                  )}
                  Generate {selectedMockupIds.length} Mockup{selectedMockupIds.length !== 1 && 's'}
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-1">
              {MOCKUP_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                    activeCategory === cat
                      ? 'bg-brand-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-4">Select Mockup</h3>

            {/* Upload Custom Mockup */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-square rounded-lg border-2 border-dashed border-gray-700 hover:border-brand-600 transition-all flex flex-col items-center justify-center gap-2 bg-[#1a1d21] group"
            >
              <Icons.Upload className="w-6 h-6 text-gray-500 group-hover:text-brand-600 transition-colors" />
              <span className="text-[9px] font-bold text-gray-500 group-hover:text-white transition-colors">
                Upload Your Own
              </span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUploadMockup} className="hidden" />

            <div className="grid grid-cols-2 gap-2">
              {/* Custom mockup thumbnail if uploaded */}
              {customMockup && (
                <button
                  onClick={() => {
                    setActiveMockupId('custom');
                  }}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    activeMockupId === 'custom' ? 'border-brand-600' : 'border-transparent hover:border-gray-600'
                  }`}
                >
                  <img src={customMockup} alt="Custom mockup" className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-brand-600/90 p-1.5 backdrop-blur-sm">
                    <span className="text-[8px] font-bold text-white block truncate">Your Upload</span>
                  </div>
                </button>
              )}

              {filteredMockups.map((m) => (
                <div key={m.id} className="relative aspect-square">
                  {/* Batch Selection Checkbox */}
                  {batchMode && (
                    <label className="absolute top-1 left-1 z-20">
                      <input
                        type="checkbox"
                        checked={selectedMockupIds.includes(m.id)}
                        onChange={() => toggleMockupSelection(m.id)}
                        className="w-4 h-4 rounded border-2 border-white/50 accent-brand-600 bg-black/50"
                      />
                    </label>
                  )}

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(m.id);
                    }}
                    className="absolute top-1 right-1 z-20 p-1.5 bg-black/60 hover:bg-red-500/80 rounded-full transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
                  >
                    <Icons.Heart
                      className={`w-3 h-3 ${favoriteMockups.includes(m.id) ? 'fill-red-500 text-red-500' : 'text-white'}`}
                    />
                  </button>

                  {/* Suggested Badge */}
                  {suggestedMockups.includes(m.id) && !showFavoritesOnly && (
                    <div className="absolute bottom-12 right-1 z-20 px-1.5 py-0.5 bg-brand-600 text-white text-[7px] font-black uppercase rounded-sm shadow-lg">
                      ✨ Suggested
                    </div>
                  )}

                  <button
                    onClick={() => !batchMode && setActiveMockupId(m.id)}
                    className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition-all group ${
                      activeMockupId === m.id ? 'border-brand-600' : 'border-transparent hover:border-gray-600'
                    } ${batchMode ? 'cursor-pointer' : 'cursor-pointer'}`}
                  >
                    <img src={m.bg} alt={m.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1.5 backdrop-blur-sm">
                      <span className="text-[8px] font-bold text-white block truncate">{m.name}</span>
                    </div>
                  </button>
                </div>
              ))}

              {/* Vecteezy Results */}
              {vecteezyResults.length > 0 && (
                <div className="col-span-2 pt-2 border-t border-gray-800 mt-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2 flex items-center gap-1">
                    <Icons.Globe className="w-3 h-3" /> Vecteezy Results
                  </h4>
                </div>
              )}
              {vecteezyResults.map((v) => (
                <div key={v.id} className="relative aspect-square">
                  <button
                    onClick={() => !batchMode && setActiveMockupId(v.id)}
                    className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition-all group ${
                      activeMockupId === v.id ? 'border-blue-400' : 'border-transparent hover:border-blue-500/50'
                    }`}
                  >
                    <img src={v.preview_url} alt={v.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/80 p-1.5 backdrop-blur-sm">
                      <span className="text-[8px] font-bold text-white block truncate">{v.title}</span>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Live Preview */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-dark-1 relative">
          {/* Before/After Toggle */}
          {generatedPreview && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 ${
                  showComparison
                    ? 'bg-brand-600 text-white shadow-lg shadow-purple-900/30'
                    : 'bg-surface-dark-3 text-gray-400 border border-gray-700 hover:border-white/20'
                }`}
              >
                <Icons.Compare className="w-3.5 h-3.5" />
                Before/After
              </button>
            </div>
          )}

          <div
            ref={previewContainerRef}
            className="w-full h-full flex items-center justify-center relative max-w-4xl max-h-[80vh]"
          >
            {isGenerating && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl">
                <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
              </div>
            )}
            {generatedPreview ? (
              showComparison ? (
                /* Before/After Comparison Slider */
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Before Image (Original Design) */}
                  <div className="relative w-full h-full">
                    {previewImage && (
                      <img
                        src={previewImage}
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-xl border border-white/5"
                        alt="Original design"
                      />
                    )}
                  </div>

                  {/* After Image (Mockup) with Clip */}
                  <div
                    className="absolute inset-0 overflow-hidden rounded-xl"
                    style={{ clipPath: `inset(0 ${100 - comparisonPosition}% 0 0)` }}
                  >
                    <img
                      src={generatedPreview}
                      className="max-w-full max-h-full object-contain shadow-2xl border border-white/5"
                      alt="Mockup preview"
                    />
                  </div>

                  {/* Slider Handle */}
                  <div
                    className="absolute inset-y-0 w-1 bg-brand-600 cursor-ew-resize shadow-[0_0_20px_rgba(125,42,232,0.5)]"
                    style={{ left: `${comparisonPosition}%` }}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      const handleMove = (moveEvent: PointerEvent) => {
                        const rect = (moveEvent.currentTarget as HTMLElement)?.parentElement?.getBoundingClientRect();
                        if (rect) {
                          const x = moveEvent.clientX - rect.left;
                          const newPos = Math.max(0, Math.min(100, (x / rect.width) * 100));
                          setComparisonPosition(newPos);
                        }
                      };
                      const handleUp = () => {
                        document.removeEventListener('pointermove', handleMove);
                        document.removeEventListener('pointerup', handleUp);
                      };
                      document.addEventListener('pointermove', handleMove);
                      document.addEventListener('pointerup', handleUp);
                    }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center shadow-lg">
                      <Icons.ChevronLeft className="w-4 h-4 text-white" />
                      <Icons.ChevronRight className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Labels */}
                  <div className="absolute top-4 left-4 bg-black/70 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Before</span>
                  </div>
                  <div className="absolute top-4 right-4 bg-black/70 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">After</span>
                  </div>
                </div>
              ) : (
                /* Normal Preview */
                <div className="relative group">
                  <img
                    src={generatedPreview}
                    className="max-w-full max-h-full object-contain shadow-2xl rounded-xl border border-white/5"
                    alt="Mockup preview"
                  />
                  {useCornerPinning && cornerPoints && (
                    <CornerHandles
                      cornerPoints={cornerPoints}
                      onCornerChange={handleCornerChange}
                      containerWidth={previewContainerSize.width}
                      containerHeight={previewContainerSize.height}
                      isVisible={useCornerPinning}
                    />
                  )}
                </div>
              )
            ) : (
              <span className="text-gray-600 font-bold uppercase tracking-widest animate-pulse">
                Generating Live Preview...
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Controls */}
        <div className="w-[320px] flex flex-col border-l border-gray-800 bg-surface-dark-2 shrink-0 overflow-y-auto custom-scrollbar">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-600">Settings</h3>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="p-1.5 hover:bg-white/5 rounded-md text-gray-400 hover:text-white transition-all"
                title="Download Mockup"
              >
                <Icons.Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleAddToCanvas}
                className="p-1.5 bg-brand-600/20 hover:bg-brand-600/30 rounded-md text-brand-600 transition-all"
                title="Add to Canvas"
              >
                <Icons.Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-8">
            {/* Corner Pinning */}
            <div className="p-4 bg-gradient-to-br from-brand-600/10 to-transparent border border-brand-600/20 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-white">
                  Corner Pinning (4-Point Perspective)
                </span>
                <button
                  onClick={() => {
                    setUseCornerPinning(!useCornerPinning);
                    if (!useCornerPinning) {
                      const defaultCorners = getDefaultCornerPoints(
                        previewContainerSize.width,
                        previewContainerSize.height,
                        placement
                      );
                      setCornerPoints(defaultCorners);
                    }
                  }}
                  className={`px-3 py-1 rounded-md text-[9px] font-black transition-all ${
                    useCornerPinning ? 'bg-brand-600 text-white shadow-lg' : 'bg-white/5 text-gray-500'
                  }`}
                >
                  {useCornerPinning ? 'ON' : 'OFF'}
                </button>
              </div>

              {useCornerPinning && (
                <div className="space-y-4">
                  <div className="flex gap-1.5">
                    {(['flat', 'angled', 'curved'] as const).map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          setPerspectivePreset(preset);
                          if (preset === 'flat') {
                            setCurve(0);
                            updatePlacement('skewX', 0);
                            updatePlacement('skewY', 0);
                          } else if (preset === 'angled') {
                            updatePlacement('skewX', 10);
                            updatePlacement('skewY', 5);
                          } else if (preset === 'curved') {
                            setCurve(15);
                          }
                        }}
                        className={`flex-1 py-1.5 rounded-md text-[8px] font-black uppercase transition-all ${
                          perspectivePreset === preset
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase">
                      <span>Curve Intensity</span>
                      <span className="text-brand-600">{curve}°</span>
                    </div>
                    <input
                      type="range"
                      min="-30"
                      max="30"
                      value={curve}
                      onChange={(e) => setCurve(Number(e.target.value))}
                      className="w-full h-1.5 bg-surface-dark-3 rounded-full appearance-none cursor-pointer accent-brand-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Adjustments */}
            <div className="space-y-6">
              {/* Position */}
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Position (X / Y)
                  </span>
                  <span className="text-[10px] font-mono text-brand-600">
                    {Math.round(placement.left)}%, {Math.round(placement.top)}%
                  </span>
                </div>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={placement.left}
                    onChange={(e) => updatePlacement('left', Number(e.target.value))}
                    className="w-full h-1 bg-surface-dark-3 rounded-full appearance-none cursor-pointer accent-white"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={placement.top}
                    onChange={(e) => updatePlacement('top', Number(e.target.value))}
                    className="w-full h-1 bg-surface-dark-3 rounded-full appearance-none cursor-pointer accent-white"
                  />
                </div>
              </div>

              {/* Scale & Rotate */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block">
                  Scale / Rotate
                </span>
                <div className="space-y-4">
                  <input
                    type="range"
                    min="10"
                    max="150"
                    value={placement.width}
                    onChange={(e) => updatePlacement('width', Number(e.target.value))}
                    className="w-full h-1 bg-surface-dark-3 rounded-full appearance-none cursor-pointer accent-white"
                  />
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={placement.rotate}
                    onChange={(e) => updatePlacement('rotate', Number(e.target.value))}
                    className="w-full h-1 bg-surface-dark-3 rounded-full appearance-none cursor-pointer accent-white"
                  />
                </div>
              </div>

              {/* Perspective */}
              {!useCornerPinning && (
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block">
                    Perspective (Skew X / Y)
                  </span>
                  <div className="space-y-4">
                    <input
                      type="range"
                      min="-45"
                      max="45"
                      value={placement.skewX || 0}
                      onChange={(e) => updatePlacement('skewX', Number(e.target.value))}
                      className="w-full h-1 bg-surface-dark-3 rounded-full appearance-none cursor-pointer accent-accent"
                    />
                    <input
                      type="range"
                      min="-45"
                      max="45"
                      value={placement.skewY || 0}
                      onChange={(e) => updatePlacement('skewY', Number(e.target.value))}
                      className="w-full h-1 bg-surface-dark-3 rounded-full appearance-none cursor-pointer accent-accent"
                    />
                  </div>
                </div>
              )}

              {/* 3D Lighting & Shadows */}
              <div className="pt-4 border-t border-gray-800 space-y-4 mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block">
                  3D Lighting & Shadows
                </span>

                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase">
                    <span>Shadow Intensity</span>
                    <span className="text-white">{shadowIntensity}x</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={shadowIntensity}
                    onChange={(e) => setShadowIntensity(Number(e.target.value))}
                    className="w-full h-1 bg-surface-dark-3 rounded-full appearance-none cursor-pointer accent-brand-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase">
                    <span>Reflection Gloss</span>
                    <span className="text-white">{Math.round(reflectionIntensity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={reflectionIntensity}
                    onChange={(e) => setReflectionIntensity(Number(e.target.value))}
                    className="w-full h-1 bg-surface-dark-3 rounded-full appearance-none cursor-pointer accent-brand-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase">
                    <span>Brightness</span>
                    <span className="text-white">{lightingBrightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="1"
                    value={lightingBrightness}
                    onChange={(e) => setLightingBrightness(Number(e.target.value))}
                    className="w-full h-1 bg-surface-dark-3 rounded-full appearance-none cursor-pointer accent-brand-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase">
                    <span>Contrast</span>
                    <span className="text-white">{lightingContrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="1"
                    value={lightingContrast}
                    onChange={(e) => setLightingContrast(Number(e.target.value))}
                    className="w-full h-1 bg-surface-dark-3 rounded-full appearance-none cursor-pointer accent-brand-600"
                  />
                </div>
              </div>
              {/* Blend Mode */}
              <div className="pt-4 border-t border-gray-800 space-y-3 mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block">Blend Mode</span>
                <select
                  value={placement.blendMode}
                  onChange={(e) => updatePlacement('blendMode', e.target.value)}
                  className="w-full bg-surface-dark-3 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-600 appearance-none"
                >
                  <option value="source-over">Normal</option>
                  <option value="multiply">Multiply (Realistic)</option>
                  <option value="screen">Screen (Light)</option>
                  <option value="overlay">Overlay</option>
                  <option value="soft-light">Soft Light</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleProRender}
              disabled={isProGenerating}
              className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                isProGenerating
                  ? 'bg-white/5 text-gray-600'
                  : 'bg-gradient-to-r from-brand-600 to-accent text-white shadow-lg shadow-purple-500/10'
              }`}
            >
              {isProGenerating ? (
                'Creating...'
              ) : (
                <>
                  <Icons.Zap className="w-3.5 h-3.5 text-yellow-300" /> Create Mockup
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-dark-2">
      {/* Category Tabs */}
      <div className="flex overflow-x-auto custom-scrollbar border-b border-gray-800 bg-[#0e1318]">
        {MOCKUP_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-400 hover:text-white'
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
            className="w-full bg-surface-dark-3 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-brand-600 focus:outline-none"
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
              className="px-2 py-1 bg-surface-dark-3 border border-gray-700 rounded hover:border-brand-600 transition-colors"
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
              className="px-2 py-1 bg-surface-dark-3 border border-gray-700 rounded hover:border-brand-600 transition-colors"
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
                    ? 'border-brand-600 ring-2 ring-brand-600/20'
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
              <button onClick={() => setSearchQuery('')} className="mt-2 text-brand-600 hover:underline">
                Clear search
              </button>
            </div>
          )}
        </div>

        {/* Preview & Controls */}
        <div className="bg-surface-dark-3 rounded-xl border border-gray-800 overflow-hidden">
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
                <div className="animate-spin w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full" />
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

          {/* Tabbed Adjustments */}
          <div className="bg-[#1a1d21]">
            <div className="flex border-b border-gray-800 bg-[#0e1318]">
              {(['placement', 'effects', 'presets'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab
                      ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-600/5'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-4 space-y-4">
              {activeTab === 'placement' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Position */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-400 font-bold uppercase tracking-wider">Position (X / Y)</span>
                      <span className="text-gray-500 font-mono">
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
                        className="h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
                      />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={placement.top}
                        onChange={(e) => updatePlacement('top', Number(e.target.value))}
                        className="h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
                      />
                    </div>
                  </div>

                  {/* Scale & Rotate */}
                  <div className="space-y-3">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                      Scale / Rotate
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="range"
                        min="10"
                        max="150"
                        value={placement.width}
                        onChange={(e) => updatePlacement('width', Number(e.target.value))}
                        className="h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
                      />
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={placement.rotate}
                        onChange={(e) => updatePlacement('rotate', Number(e.target.value))}
                        className="h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
                      />
                    </div>
                  </div>

                  {/* Corner Pinning Toggle */}
                  <div className="p-3 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold text-purple-300 uppercase tracking-wider">
                        4-Point Perspective
                      </span>
                      <button
                        onClick={() => {
                          setUseCornerPinning(!useCornerPinning);
                          if (!useCornerPinning) {
                            const defaultCorners = getDefaultCornerPoints(
                              previewContainerSize.width - 32,
                              previewContainerSize.height - 32,
                              placement
                            );
                            setCornerPoints(defaultCorners);
                          }
                        }}
                        className={`px-3 py-1 rounded text-[9px] font-bold border transition-all ${
                          useCornerPinning
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-gray-700 border-gray-600 text-gray-300'
                        }`}
                      >
                        {useCornerPinning ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    {useCornerPinning && (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-[8px] text-gray-500 uppercase">Cylindrical Curve</span>
                          <span className="text-[8px] text-white">{curve}°</span>
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
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'effects' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="space-y-3">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                      Blend Mode
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {['source-over', 'multiply', 'screen', 'overlay', 'soft-light'].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => updatePlacement('blendMode', mode)}
                          className={`px-3 py-2 text-[10px] font-bold rounded-lg border transition-all text-left flex justify-between items-center ${
                            placement.blendMode === mode
                              ? 'bg-brand-600/20 border-brand-600 text-white'
                              : 'bg-black border-gray-800 text-gray-500 hover:border-gray-600'
                          }`}
                        >
                          <span className="capitalize">{mode.replace('-', ' ')}</span>
                          {placement.blendMode === mode && <Icons.Check className="w-3 h-3 text-brand-600" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-400 font-bold uppercase tracking-wider">Design Opacity</span>
                      <span className="text-white font-mono">{Math.round((placement.opacity || 0.9) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={placement.opacity || 0.9}
                      onChange={(e) => updatePlacement('opacity', Number(e.target.value))}
                      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'presets' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg space-y-3">
                    <h4 className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Smart Alignment</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => {
                          const current = getMockupById(activeMockupId);
                          if (current) {
                            setPlacement(current.defaultPlacement);
                          }
                        }}
                        className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all"
                      >
                        <Icons.Magic className="w-3 h-3" />
                        Reset to Mockup Default
                      </button>
                      <button
                        onClick={() => {
                          const current = getMockupById(activeMockupId);
                          if (current) {
                            const isApparel = current.category === 'Apparel';
                            updatePlacement('blendMode', isApparel ? 'multiply' : 'source-over');
                            updatePlacement('opacity', isApparel ? 0.85 : 1);
                          }
                        }}
                        className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all"
                      >
                        <Icons.Zap className="w-3 h-3" />
                        Apply Smart Realistic Blend
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-800/20 border border-gray-700 rounded-lg space-y-3">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transform Reset</h4>
                    <button
                      onClick={() => setPlacement({ ...placement, skewX: 0, skewY: 0, rotate: 0 })}
                      className="w-full py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all"
                    >
                      <Icons.RefreshCw className="w-3 h-3" />
                      Clear Rotation & Skew
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-3 bg-[#0e1318] border-t border-gray-800 flex flex-col gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white py-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20"
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
                  : 'bg-gradient-to-r from-brand-600 to-accent hover:from-brand-700 hover:to-accent-dark text-white shadow-lg'
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
export default function MockupPanelWrapped(props: React.ComponentProps<typeof MockupPanel>) {
  return (
    <PanelErrorBoundary panelName="Mockup">
      <MockupPanel {...props} />
    </PanelErrorBoundary>
  );
}
