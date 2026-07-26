import React, { useState, useEffect, useCallback } from 'react';
import { Icons } from '../../constants';
import { db as supabase } from '../../lib/supabase/client';
import { ConfirmModal } from '../modals/ConfirmModal';
import { log } from '../../utils/log';

interface Col {
  id: string;
  name: string;
  created_at: string;
}
interface ColItem {
  id: string;
  asset_url: string;
  thumbnail_url: string | null;
}
const inputCls =
  'flex-1 bg-surface-dark-3 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-accent';

export const AssetCollections: React.FC = () => {
  const [cols, setCols] = useState<Col[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [items, setItems] = useState<ColItem[]>([]);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [del, setDel] = useState<Col | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCols = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    if (user) {
      try {
        const { data } = await (supabase as any)
          .from('user_collections')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setCols((data as Col[]) || []);
      } catch (e) {
        setCols([]);
      }
    }
    setLoading(false);
  }, []);

  const loadItems = useCallback(async (cid: string) => {
    try {
      const { data } = await (supabase as any)
        .from('collection_items')
        .select('*')
        .eq('collection_id', cid)
        .order('position');
      setItems((data as any as ColItem[]) || []);
    } catch (e) {
      setItems([]);
    }
  }, []);
  useEffect(() => {
    loadCols();
  }, [loadCols]);
  useEffect(() => {
    selId ? loadItems(selId) : setItems([]);
  }, [selId, loadItems]);
  const create = async () => {
    if (!newName.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    if (!user) return;
    const { data } = await (supabase as any)
      .from('user_collections')
      .insert({ user_id: user.id, name: newName.trim() })
      .select()
      .single();
    if (data) {
      setCols((p) => [data as Col, ...p]);
      setNewName('');
    }
  };
  const rename = async (id: string) => {
    if (!editName.trim()) return;
    await (supabase as any).from('user_collections').update({ name: editName.trim() }).eq('id', id);
    setCols((p) => p.map((c) => (c.id === id ? { ...c, name: editName.trim() } : c)));
    setEditId(null);
  };
  const deleteCol = async () => {
    if (!del) return;
    await (supabase as any).from('user_collections').delete().eq('id', del.id);
    setCols((p) => p.filter((c) => c.id !== del.id));
    if (selId === del.id) setSelId(null);
    setDel(null);
  };
  return (
    <div className="flex flex-col h-full bg-[#13161a] p-4 overflow-hidden">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        <Icons.Folder className="w-5 h-5 text-accent" /> Collections
      </h3>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          placeholder="New collection..."
          className={inputCls}
        />
        <button
          aria-label="Create collection"
          onClick={create}
          className="bg-accent hover:bg-accent-hover text-white rounded-lg px-3 py-2"
        >
          <Icons.Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-6 h-6 border-3 border-accent border-t-transparent rounded-full" />
          </div>
        ) : cols.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <Icons.Folder className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No collections yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cols.map((col) => (
              <div
                key={col.id}
                className={`rounded-lg border cursor-pointer transition-all ${selId === col.id ? 'bg-accent/10 border-accent' : 'bg-surface-dark-3 border-gray-700 hover:border-gray-600'}`}
                onClick={() => setSelId(selId === col.id ? null : col.id)}
              >
                <div className="flex items-center gap-2 p-3">
                  <Icons.Folder className="w-4 h-4 text-accent flex-shrink-0" />
                  {editId === col.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') rename(col.id);
                        if (e.key === 'Escape') setEditId(null);
                      }}
                      onBlur={() => rename(col.id)}
                      className="flex-1 bg-transparent border-b border-accent text-sm text-white outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="flex-1 text-sm text-white truncate">{col.name}</span>
                  )}
                  <button
                    aria-label="Rename collection"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditId(col.id);
                      setEditName(col.name);
                    }}
                    className="p-1 rounded hover:bg-white/10"
                  >
                    <Icons.Edit className="w-3 h-3 text-gray-400" />
                  </button>
                  <button
                    aria-label="Delete collection"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDel(col);
                    }}
                    className="p-1 rounded hover:bg-red-500/20"
                  >
                    <Icons.Trash className="w-3 h-3 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
                {selId === col.id && items.length > 0 && (
                  <div className="grid grid-cols-3 gap-1 px-3 pb-3">
                    {items.map((it) => (
                      <div
                        key={it.id}
                        className="aspect-square rounded bg-surface-dark-4 overflow-hidden"
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify(it))}
                      >
                        <img
                          src={it.thumbnail_url || it.asset_url}
                          className="w-full h-full object-cover"
                          alt=""
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={!!del}
        onClose={() => setDel(null)}
        onConfirm={deleteCol}
        title="Delete Collection"
        message={`Delete "${del?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};

export default AssetCollections;
