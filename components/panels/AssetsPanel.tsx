import React, { useState, useEffect } from 'react';
import { Icons } from '../../constants';
import * as unsplashService from '../../services/unsplashService';
import * as freepikService from '../../services/freepikService';
import { vecteezyService } from '../../services/vecteezyService';
import { iconScoutService, IconScoutAssetType } from '../../services/iconScoutService';
import { useStore } from '../../store/useStore';
import { generateLayerId } from '../../utils/layers/layerUtils';
import { log } from '../../utils/log';

interface PhotoItem {
  id: string;
  url: string;
  thumbnail: string;
  alt: string;
  author: string;
  authorLink?: string;
  source: 'unsplash' | 'freepik' | 'vecteezy' | 'iconscout';
  type?: string;
}

export const AssetsPanel: React.FC = () => {
  const addLayer = useStore((state) => state.addLayer);
  const canvasSize = useStore((state) => state.canvasSize);

  const onAddImageLayer = (src: string, type: string = 'image') => {
    addLayer({
      id: generateLayerId(type),
      type: type as any,
      name: type === 'lottie' ? 'Animation' : 'Asset',
      src,
      x: canvasSize.width / 2 - 150,
      y: canvasSize.height / 2 - 150,
      width: 300,
      height: 300,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      blendMode: 'normal',
    } as any);
  };

  const [query, setQuery] = useState('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeSource, setActiveSource] = useState<'all' | 'unsplash' | 'freepik' | 'vecteezy' | 'iconscout'>('all');
  const [iconScoutType, setIconScoutType] = useState<IconScoutAssetType>('3d');

  useEffect(() => {
    handleSearch('abstract');
  }, []);

  const handleSearch = async (searchQuery: string) => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const combined: PhotoItem[] = [];

      if (activeSource === 'all' || activeSource === 'iconscout') {
        try {
          const isResults = await iconScoutService.search(searchQuery || 'trending', iconScoutType);
          isResults.forEach(asset => {
            combined.push({
              id: `is-${asset.uuid}`,
              url: asset.previewUrl,
              thumbnail: asset.previewUrl,
              alt: asset.name,
              author: asset.author,
              source: 'iconscout',
              type: asset.type === 'lottie' ? 'lottie' : 'image'
            });
          });
        } catch (e) {
          log.error('IconScout search failed', e);
        }
      }

      if (activeSource === 'all' || activeSource === 'unsplash') {
        try {
          const unsplashResults = await unsplashService.searchPhotos(searchQuery || 'trending');
          unsplashResults.forEach((p) => {
            combined.push({
              id: `us-${p.id}`,
              url: p.url,
              thumbnail: p.thumbnail,
              alt: p.alt,
              author: p.user.name,
              authorLink: p.user.link,
              source: 'unsplash',
            });
          });
        } catch (e) {
          log.error('[AssetsPanel] Unsplash search failed', e);
        }
      }

      if (activeSource === 'all' || activeSource === 'freepik') {
        try {
          const freepikResults = await freepikService.searchResources(searchQuery || 'trending');
          freepikResults.items.forEach((r) => {
            combined.push({
              id: `fp-${r.id}`,
              url: r.thumbnailUrl,
              thumbnail: r.thumbnailUrl || r.thumbnailUrl,
              alt: (r as any).name || (r as any).title || '',
              author: r.author,
              source: 'freepik',
            });
          });
        } catch (e) {
          log.error('Freepik search failed', e);
        }
      }

      if (activeSource === 'all' || activeSource === 'vecteezy') {
        try {
          const vecteezyResults = await vecteezyService.searchResources(searchQuery || 'trending');
          vecteezyResults.forEach((r) => {
            combined.push({
              id: `vz-${r.id}`,
              url: r.preview_url,
              thumbnail: r.thumbnail_url || r.preview_url,
              alt: (r as any).title,
              author: 'Vecteezy',
              source: 'vecteezy',
            });
          });
        } catch (e) {
          log.error('Vecteezy search failed', e);
        }
      }

      // Interleave results from all active sources for variety
      if (activeSource === 'all' && combined.length > 0) {
        const iconscout = combined.filter((p) => p.source === 'iconscout');
        const unsplash = combined.filter((p) => p.source === 'unsplash');
        const freepik = combined.filter((p) => p.source === 'freepik');
        const vecteezy = combined.filter((p) => p.source === 'vecteezy');
        const interleaved: PhotoItem[] = [];
        const maxLen = Math.max(iconscout.length, unsplash.length, freepik.length, vecteezy.length);
        for (let i = 0; i < maxLen; i++) {
          if (i < iconscout.length) {
            interleaved.push(iconscout[i]);
          }
          if (i < unsplash.length) {
            interleaved.push(unsplash[i]);
          }
          if (i < freepik.length) {
            interleaved.push(freepik[i]);
          }
          if (i < vecteezy.length) {
            interleaved.push(vecteezy[i]);
          }
        }
        setPhotos(interleaved);
      } else {
        setPhotos(combined);
      }
    } catch (e) {
      log.error('Search error', e);
    } finally {
      setIsLoading(false);
    }
  };

  const sources = [
    { id: 'all' as const, label: 'All' },
    { id: 'iconscout' as const, label: 'IconScout' },
    { id: 'unsplash' as const, label: 'Unsplash' },
    { id: 'freepik' as const, label: 'Freepik' },
    { id: 'vecteezy' as const, label: 'Vecteezy' },
  ];

  const iconScoutTypes: { id: IconScoutAssetType; label: string }[] = [
    { id: '3d', label: '3D' },
    { id: 'icon', label: 'Icons' },
    { id: 'illustration', label: 'Illustrations' },
    { id: 'lottie', label: 'Lottie' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#13161a] p-4 overflow-hidden">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        <Icons.Image className="w-5 h-5 text-[#00c4cc]" />
        Pro Photos
      </h3>

      {/* Source Tabs */}
      <div className="flex gap-1 mb-3 p-0.5 bg-[#1a1a1a] rounded-lg">
        {sources.map((src) => (
          <button
            key={src.id}
            onClick={() => {
              setActiveSource(src.id);
              if (hasSearched) {
                handleSearch(query || 'nature');
              }
            }}
            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${
              activeSource === src.id ? 'bg-[#00c4cc] text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {src.label}
          </button>
        ))}
      </div>

      {/* IconScout Type Selector */}
      {(activeSource === 'iconscout' || activeSource === 'all') && (
        <div className="flex gap-1 mb-4 p-0.5 bg-[#1a1a1a] rounded-lg">
          {iconScoutTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setIconScoutType(type.id);
                if (hasSearched) {
                  handleSearch(query || 'trending');
                }
              }}
              className={`flex-1 py-1.5 rounded-md text-[9px] font-medium transition-all ${
                iconScoutType === type.id ? 'bg-[#00c4cc]/20 text-[#00c4cc] border border-[#00c4cc]' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      )}

      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search millions of photos..."
          className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#00c4cc] transition-colors"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
        />
        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="animate-spin w-8 h-8 border-4 border-[#00c4cc] border-t-transparent rounded-full"></div>
            <p className="text-xs text-gray-500">Searching photos...</p>
          </div>
        ) : photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 pb-12 content-start">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="aspect-square rounded-lg overflow-hidden relative group cursor-pointer bg-[#1e1e1e] border border-gray-700 hover:border-[#00c4cc] transition-all"
                onClick={() => onAddImageLayer(photo.url)}
              >
                <img
                  src={photo.thumbnail}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  alt={photo.alt}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <div className="flex items-center justify-between w-full">
                    <div className="text-[9px] text-white truncate max-w-[70%]">
                      by{' '}
                      {photo.authorLink ? (
                        <a
                          href={photo.authorLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-[#00c4cc]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {photo.author}
                        </a>
                      ) : (
                        <span>{photo.author}</span>
                      )}
                    </div>
                    <span
                      className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                        photo.source === 'iconscout'
                          ? 'bg-blue-500/30 text-blue-300'
                          : photo.source === 'unsplash'
                            ? 'bg-white/20 text-white'
                            : photo.source === 'freepik'
                              ? 'bg-emerald-500/30 text-emerald-300'
                              : 'bg-orange-500/30 text-orange-300'
                      }`}
                    >
                      {photo.source === 'iconscout' ? 'IS' : photo.source === 'unsplash' ? 'U' : photo.source === 'freepik' ? 'F' : 'V'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          hasSearched && (
            <div className="text-center text-gray-500 mt-10">
              <p className="text-sm">No photos found for &quot;{query}&quot;</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AssetsPanel;
