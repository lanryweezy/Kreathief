import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../../constants';
import * as unsplashService from '../../services/unsplashService';
import * as freepikService from '../../services/freepikService';
import { useStore } from '../../store/useStore';
import { generateLayerId } from '../../utils/layers/layerUtils';
import { PanelHeader } from './PanelHeader';
import { SearchInput } from '../SearchInput';
import { AssetThumbnail } from '../AssetThumbnail';
import { log } from '../../utils/log';

interface PhotoItem {
  id: string;
  url: string;
  thumbnail: string;
  alt: string;
  author: string;
  authorLink?: string;
  source: string;
  type?: string;
}

interface AssetsPanelProps {
  provider?: 'unsplash';
}

export const AssetsPanel: React.FC<AssetsPanelProps> = ({ provider }) => {
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
  const [activeSource, setActiveSource] = useState<string>(provider || 'unsplash');
  const searchTimeoutRef = useRef<any>(null);
  const tabCacheRef = useRef<Record<string, { photos: PhotoItem[]; query: string }>>({});

  useEffect(() => {
    if (provider) {
      setActiveSource(provider);
    }
  }, [provider]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(val);
    }, 500);
  };

  useEffect(() => {
    handleSearch('abstract');
  }, [activeSource]);

  const handleSearch = async (searchQuery: string) => {
    const q = searchQuery || 'trending';
    const cached = tabCacheRef.current[activeSource];
    if (cached && cached.query === q && cached.photos.length > 0) {
      setPhotos(cached.photos);
      return;
    }
    setIsLoading(true);
    setHasSearched(true);
    try {
      const combined: PhotoItem[] = [];
      const q = searchQuery || 'trending';

      if (activeSource === 'unsplash') {
        try {
          const results = await unsplashService.searchPhotos(q);
          results.forEach((p) => {
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

      let finalPhotos = combined;
      if (activeSource === 'all' && combined.length > 0) {
        const groups: Record<string, PhotoItem[]> = {};
        combined.forEach((p) => {
          if (!groups[p.source]) {
            groups[p.source] = [];
          }
          groups[p.source].push(p);
        });
        const maxLen = Math.max(...Object.values(groups).map((g) => g.length));
        const interleaved: PhotoItem[] = [];
        for (let i = 0; i < maxLen; i++) {
          for (const source of Object.keys(groups)) {
            if (i < groups[source].length) {
              interleaved.push(groups[source][i]);
            }
          }
        }
        finalPhotos = interleaved;
      }
      // Always publish results — previously only the 'all' source ever called
      // setPhotos, so single-provider searches (e.g. Unsplash) never rendered.
      setPhotos(finalPhotos);
      tabCacheRef.current[activeSource] = { photos: finalPhotos.slice(0, 20), query: q };
    } catch (e) {
      log.error('[AssetsPanel] Search error', e);
    } finally {
      setIsLoading(false);
    }
  };

  const sourceColors: Record<string, string> = {
    iconscout: 'bg-blue-500/30 text-blue-300',
    unsplash: 'bg-white/20 text-white',
    pixabay: 'bg-cyan-500/30 text-cyan-300',
    pexels: 'bg-teal-500/30 text-teal-300',
    freepik: 'bg-emerald-500/30 text-emerald-300',
    vecteezy: 'bg-orange-500/30 text-orange-300',
  };

  const sourceLabels: Record<string, string> = {
    iconscout: 'IS',
    unsplash: 'U',
    pixabay: 'PB',
    pexels: 'PX',
    freepik: 'F',
    vecteezy: 'V',
  };

  return (
    <div className="flex flex-col h-full bg-surface-dark-2 overflow-hidden">
      {!provider && <PanelHeader title="Pro Photos" icon={<Icons.Image className="w-5 h-5 text-accent" />} />}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col">
        <div className="mb-4">
          <SearchInput
            placeholder="Search millions of photos..."
            value={query}
            onChange={(val) => handleQueryChange(val)}
            onClear={() => handleQueryChange('')}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
            className="py-2.5 text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
              <p className="text-xs text-gray-500">Searching photos...</p>
            </div>
          ) : photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 pb-12 content-start">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square rounded-lg overflow-hidden relative group cursor-pointer bg-surface-dark-3 border border-gray-700 hover:border-accent transition-all"
                  onClick={() => onAddImageLayer(photo.url)}
                >
                  <AssetThumbnail
                    src={photo.thumbnail}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    alt={photo.alt}
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
                            className="underline hover:text-accent"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {photo.author}
                          </a>
                        ) : (
                          <span>{photo.author}</span>
                        )}
                      </div>
                      <span
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${sourceColors[photo.source] || 'bg-gray-500/30 text-gray-300'}`}
                      >
                        {sourceLabels[photo.source] || photo.source.slice(0, 2).toUpperCase()}
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
    </div>
  );
};

export default AssetsPanel;
