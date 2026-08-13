import React, { useState, useEffect, useCallback } from 'react';
import { Icons } from '../../constants';
import { db as supabase } from '../../lib/supabase/client';
import { log } from '../../utils/log';

interface FavoriteAsset {
  id: string;
  asset_id: string;
  asset_url: string;
  thumbnail_url: string;
  provider: string;
}

const LS_KEY = 'kreathief_asset_favorites';
const loadLocal = (): FavoriteAsset[] => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
};
const saveLocal = (items: FavoriteAsset[]) => localStorage.setItem(LS_KEY, JSON.stringify(items));

export const AssetFavorites: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setFavorites(loadLocal());
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await (supabase as any)
        .from('user_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) {
        setFavorites(data as any as FavoriteAsset[]);
        saveLocal(data as any as FavoriteAsset[]);
      }
    } catch (e) {
      log.error('[AssetFavorites] Load failed', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (fav: FavoriteAsset) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.asset_id !== fav.asset_id);
      saveLocal(next);
      return next;
    });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) await (supabase as any).from('user_favorites').delete().eq('user_id', user.id).eq('asset_id', fav.asset_id);
    } catch (e) {
      log.error('[AssetFavorites] Remove failed', e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#13161a] p-4 overflow-hidden">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        <Icons.Heart className="w-5 h-5 text-red-400" /> Favorites
      </h3>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-6 h-6 border-3 border-accent border-t-transparent rounded-full" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <Icons.Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No favorites yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {favorites.map((fav) => (
              <div
                key={fav.asset_id}
                className="aspect-square rounded-lg overflow-hidden relative group bg-surface-dark-3 border border-gray-700 hover:border-accent transition-all"
              >
                <img
                  src={fav.thumbnail_url || fav.asset_url}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  alt=""
                  loading="lazy"
                />
                <button
                  aria-label="Remove from favorites"
                  onClick={() => remove(fav)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <Icons.X className="w-3 h-3 text-white" />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] text-white/70">{fav.provider}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetFavorites;
