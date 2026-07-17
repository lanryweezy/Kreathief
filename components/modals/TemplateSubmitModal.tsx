import React, { useState, useRef, useCallback } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { Button } from '../Button';
import { Input } from '../Input';
import { Icons } from '../../constants';
import { templateMarketplace, SubmitTemplateData } from '../../services/templateMarketplace';

interface TemplateSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES = ['Posters', 'Social', 'Print', 'Corporate', 'Branding', 'UI/UX', 'Illustration', 'Other'];

const TemplateSubmitModal: React.FC<TemplateSubmitModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [templateData, setTemplateData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith('.json')) {
      setError('Upload a valid JSON file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        setTemplateData(JSON.parse(ev.target?.result as string));
        setError('');
      } catch {
        setError('Invalid JSON format');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !category || !templateData) {
      setError('Title, category, and template file required');
      return;
    }
    setSubmitting(true);
    const data: SubmitTemplateData = {
      title: title.trim(),
      description: description.trim(),
      category,
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      templateData,
    };
    const result = await templateMarketplace.submitTemplate(data);
    setSubmitting(false);
    if (result) {
      resetForm();
      onClose();
      onSuccess?.();
    } else setError('Failed to submit template');
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setTagsInput('');
    setTemplateData(null);
    setError('');
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl">
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center">
            <Icons.Templates className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Submit Template</h2>
            <p className="text-xs text-gray-500">Share your design with the community</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Template Title"
            placeholder="My Awesome Template"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-400">Description</label>
            <textarea
              placeholder="Describe your template..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-xl bg-surface-dark-3 text-white border border-white/10 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 resize-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-400">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${category === cat ? 'bg-brand-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Tags (comma-separated)"
            placeholder="poster, neon, minimal"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-400">Template File (JSON)</label>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 border-2 border-dashed border-white/10 hover:border-brand-500/50 rounded-xl text-center transition-all group"
            >
              {templateData ? (
                <div className="flex items-center justify-center gap-2 text-brand-400">
                  <Icons.Check className="w-5 h-5" />
                  <span className="text-sm font-medium">Template loaded</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-gray-400">
                  <Icons.Upload className="w-8 h-8" />
                  <span className="text-sm">Click to upload template JSON</span>
                </div>
              )}
            </button>
          </div>
          {error && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={!title.trim() || !category || !templateData}
            className="flex-1"
          >
            Submit for Review
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default TemplateSubmitModal;
