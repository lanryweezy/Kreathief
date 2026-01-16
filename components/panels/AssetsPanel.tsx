import React, { useState, useEffect } from 'react';
import { Icons } from '../../constants';
import * as unsplashService from '../../services/unsplashService';

interface AssetsPanelProps {
    onAddImageLayer: (src: string) => void;
}

export const AssetsPanel: React.FC<AssetsPanelProps> = ({ onAddImageLayer }) => {
    const [query, setQuery] = useState('');
    const [photos, setPhotos] = useState<unsplashService.UnsplashPhoto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        // Initial fetch of trending photos
        handleSearch('nature');
    }, []);

    const handleSearch = async (searchQuery: string) => {
        setIsLoading(true);
        setHasSearched(true);
        try {
            const results = await unsplashService.searchPhotos(searchQuery || 'trending');
            setPhotos(results);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#13161a] p-4 overflow-hidden">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                <Icons.Image className="w-5 h-5 text-[#00c4cc]" />
                Pro Photos
            </h3>

            <div className="relative mb-6">
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
                        <div className="animate-spin w-8 h-8 border-4 border-[#00c4cc] border-t-transparent rounded-full font-bold"></div>
                        <p className="text-xs text-gray-500">Searching Unsplash...</p>
                    </div>
                ) : photos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 pb-10">
                        {photos.map((photo) => (
                            <div
                                key={photo.id}
                                className="aspect-square rounded-lg overflow-hidden relative group cursor-pointer bg-[#1e1e1e] border border-gray-700 hover:border-[#00c4cc] transition-all"
                                onClick={() => onAddImageLayer(photo.url)}
                            >
                                <img src={photo.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={photo.alt} />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                    <div className="text-[9px] text-white truncate max-w-full">
                                        by <a href={photo.user.link} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#00c4cc]" onClick={e => e.stopPropagation()}>{photo.user.name}</a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : hasSearched && (
                    <div className="text-center text-gray-500 mt-10">
                        <p className="text-sm">No photos found for "{query}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};
