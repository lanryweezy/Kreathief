import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Icons } from '../../constants';
import { vecteezyService, VecteezyResource } from '../../services/vecteezyService';
import { MockupModal } from '../modals/MockupModal';
import { CornerHandles } from '../mockup/CornerHandles';
import {
  getMockupsByCategory,
  searchMockups,
  getMockupById,
  MockupPlacement,
} from '../../services/enhancedMockupsLibrary';
import { log } from '../../utils/log';
import { dynamicMockupsService } from '../../services/dynamicMockupsService';
import { CornerPoints } from '../../services/perspectiveTransform';

import { useStore } from '../../store/useStore';
import { v4 as uuidv4 } from 'uuid';
import { PanelErrorBoundary } from './PanelErrorBoundary';
import { MockupLibrary } from './MockupLibrary';
import { MockupControls } from './MockupControls';

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
  const [isLive, setIsLive] = useState(false);
  const [isProGenerating, setIsProGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [useCornerPinning, setUseCornerPinning] = useState(false);
  const [cornerPoints, setCornerPoints] = useState<CornerPoints | null>(null);
  const [curve, setCurve] = useState(0);
  const [perspectivePreset, setPerspectivePreset] = useState<'flat' | 'angled' | 'curved'>('flat');
  const [previewContainerSize, setPreviewContainerSize] = useState({ width: 800, height: 600 });
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const [customMockup, setCustomMockup] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPosition, setComparisonPosition] = useState(50);

  const [batchMode, setBatchMode] = useState(false);
  const [selectedMockupIds, setSelectedMockupIds] = useState<string[]>([]);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, name: '' });

  const [favoriteMockups, setFavoriteMockups] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kreathief_mockup_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [vecteezyResults, setVecteezyResults] = useState<VecteezyResource[]>([]);
  const [isSearchingVecteezy, setIsSearchingVecteezy] = useState(false);

  const [suggestedMockups, setSuggestedMockups] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const APP_STORE_PRESETS = {
    'iOS Complete': ['iphone_16_pro', 'iphone_16_pro_max', 'ipad_pro', 'macbook'],
    'Android Complete': ['pixel_9_pro', 'samsung_s24', 'android_tablet'],
    'Social Media Pack': ['instagram_post', 'instagram_story', 'facebook_post', 'twitter_header'],
    'Print Pack': ['business_card', 'flyer_table', 'magazine', 'poster_frame'],
  };

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

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const regions: { x: number; y: number; width: number; height: number; variance: number }[] = [];

      const gridSize = 20;
      const regionW = canvas.width / gridSize;
      const regionH = canvas.height / gridSize;

      for (let gy = 5; gy < gridSize - 5; gy++) {
        for (let gx = 5; gx < gridSize - 5; gx++) {
          const x = Math.floor(gx * regionW);
          const y = Math.floor(gy * regionH);
          const w = Math.floor(regionW * 3);
          const h = Math.floor(regionH * 3);

          let sum = 0;
          let sumSq = 0;
          let count = 0;

          for (let py = y; py < y + h; py += 4) {
            for (let px = x; px < x + w; px += 4) {
              const idx = (py * canvas.width + px) * 4;
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

      regions.sort((a, b) => a.variance - b.variance);

      const best = regions[0];

      if (best) {
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

  const suggestMockups = async () => {
    setIsAnalyzing(true);
    try {
      const designUrl = await captureDesign();
      if (!designUrl) {
        return;
      }

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

      const aspectRatio = canvas.width / canvas.height;

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

      addToast(`Generated ${selectedMockupIds.length} mockups!`, 'success');
      setBatchMode(false);
      setSelectedMockupIds([]);
    } catch (error) {
      log.error('[MockupPanel] Batch generation failed', error);
      addToast('Batch generation failed', 'error');
    } finally {
      setIsBatchGenerating(false);
    }
  };

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

  const mockups = useMemo(() => {
    if (searchQuery.trim()) {
      return searchMockups(searchQuery);
    }
    return getMockupsByCategory(activeCategory);
  }, [activeCategory, searchQuery]);

  const filteredMockups = useMemo(() => {
    let result = mockups;

    if (showFavoritesOnly) {
      result = result.filter((m) => favoriteMockups.includes(m.id));
    }

    if (suggestedMockups.length > 0 && !showFavoritesOnly) {
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

  useEffect(() => {
    if (currentMockup) {
      setPlacement(currentMockup.defaultPlacement);
      setCornerPoints(null);
      setCurve(0);
      setPerspectivePreset('flat');
    }
  }, [currentMockup]);

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

  const generateComposite = async (): Promise<string | null> => {
    if (!previewImage) {
      return null;
    }

    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        const worker = new Worker(new URL('../../workers/mockup.worker.ts', import.meta.url), { type: 'module' });

        const bgImg = await new Promise<HTMLImageElement>((res, rej) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => res(img);
          img.onerror = rej;
          img.src = currentMockup.bg;
        });

        const designImg = await new Promise<HTMLImageElement>((res, rej) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => res(img);
          img.onerror = rej;
          img.src = previewImage;
        });

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
        );
      } catch (err) {
        log.error('Mockup Worker setup failed', err);
        resolve(null);
      }
    });
  };

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
        mockupId: activeMockupId,
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

  const libraryProps = {
    variant,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    filteredMockups,
    activeMockupId,
    setActiveMockupId,
    batchMode,
    toggleBatchMode,
    selectedMockupIds,
    toggleMockupSelection,
    isBatchGenerating,
    batchProgress,
    generateBatchMockups,
    showFavoritesOnly,
    setShowFavoritesOnly,
    favoriteMockups,
    toggleFavorite,
    suggestedMockups,
    isAnalyzing,
    suggestMockups,
    customMockup,
    handleUploadMockup,
    vecteezyResults,
    isSearchingVecteezy,
    APP_STORE_PRESETS,
    generatePreset,
    placement,
    setPlacement,
    isDetecting,
    handleAutoDetect,
    mockups,
  };

  const controlsProps = {
    variant,
    activeTab,
    setActiveTab,
    placement,
    updatePlacement,
    setPlacement,
    shadowIntensity,
    setShadowIntensity,
    reflectionIntensity,
    setReflectionIntensity,
    lightingBrightness,
    setLightingBrightness,
    lightingContrast,
    setLightingContrast,
    useCornerPinning,
    setUseCornerPinning,
    setCornerPoints,
    curve,
    setCurve,
    perspectivePreset,
    setPerspectivePreset,
    previewContainerSize,
    activeMockupId,
    handleDownload,
    handleProRender,
    isProGenerating,
    handleAddToCanvas,
  };

  if (variant === 'full') {
    return (
      <div className="flex h-full w-full bg-surface-dark-2 text-white overflow-hidden relative">
        <MockupLibrary {...libraryProps} onClose={onClose} />

        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-dark-1 relative">
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
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="relative w-full h-full">
                    {previewImage && (
                      <img
                        src={previewImage}
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-xl border border-white/5"
                        alt="Original design"
                      />
                    )}
                  </div>

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

                  <div className="absolute top-4 left-4 bg-black/70 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Before</span>
                  </div>
                  <div className="absolute top-4 right-4 bg-black/70 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">After</span>
                  </div>
                </div>
              ) : (
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

        <MockupControls {...controlsProps} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-dark-2">
      <MockupLibrary {...libraryProps} />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        <div className="bg-surface-dark-3 rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-surface-dark-2">
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
            className="aspect-video relative bg-surface-dark-2 flex items-center justify-center p-4 overflow-hidden"
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
                {useCornerPinning && cornerPoints && (
                  <CornerHandles
                    cornerPoints={cornerPoints}
                    onCornerChange={handleCornerChange}
                    containerWidth={previewContainerSize.width - 32}
                    containerHeight={previewContainerSize.height - 32}
                    isVisible={useCornerPinning}
                  />
                )}
              </>
            ) : (
              <span className="text-gray-600 text-xs">Generating preview...</span>
            )}
          </div>

          <MockupControls {...controlsProps} />
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
