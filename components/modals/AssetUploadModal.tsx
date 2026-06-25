import React, { useState, useCallback, useRef } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { ModalWrapper } from './ModalWrapper';
import { db } from '../../lib/supabase/client';
import { Icons } from '../../constants';

interface AssetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = ['Templates', 'Icons', 'Illustrations', 'Fonts', 'Textures', 'UI Kits', 'Social Media', 'Print'] as const;

export const AssetUploadModal: React.FC<AssetUploadModalProps> = React.memo(({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [price, setPrice] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
      setError('Please upload an image or video file');
      return;
    }
    setFile(selectedFile);
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
  }, [handleFileSelect]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category || !file || !price) {
      setError('Please fill in all required fields');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const { data: { user } } = await db.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await db.storage.from('assets').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { error: dbError } = await db.from('assets').insert({
        creator_id: user.id,
        title: title.trim(),
        category,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        price: parseFloat(price),
        file_url: fileName,
        status: 'pending',
      });
      if (dbError) throw dbError;
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload asset');
    } finally {
      setIsSubmitting(false);
    }
  }, [title, category, tags, price, file, onClose]);

  const selectClass = 'w-full px-3 py-2 text-sm rounded-xl bg-surface-dark-3 text-white border border-white/10 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-600 transition-all duration-200';

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl">
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Upload Asset</h2>
          <p className="text-gray-400 text-sm">Share your creation with the community</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragOver ? 'border-brand-500 bg-brand-500/10' : 'border-white/20 hover:border-white/40'}`}
            role="button"
            aria-label="Drop zone for asset file"
          >
            <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} className="hidden" aria-hidden="true" />
            {preview ? (
              <img src={preview} alt="Asset preview" className="max-h-40 mx-auto rounded-lg" />
            ) : (
              <>
                <Icons.Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Drag & drop or click to upload</p>
                <p className="text-gray-500 text-xs mt-1">PNG, JPG, SVG, or MP4</p>
              </>
            )}
          </div>
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Asset name" required aria-label="Asset title" />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="category" className="text-xs font-medium text-gray-400">Category</label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required aria-label="Select category" className={selectClass}>
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <Input label="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="minimal, modern, template" aria-label="Tags" />
          <Input label="Price ($)" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="9.99" required aria-label="Price in dollars" />
          {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
          <Button type="submit" variant="primary" size="lg" loading={isSubmitting} className="w-full" aria-label="Submit for review">
            Submit for Review
          </Button>
        </form>
      </div>
    </ModalWrapper>
  );
});
