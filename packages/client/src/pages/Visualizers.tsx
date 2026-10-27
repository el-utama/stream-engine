import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { visualizersApi } from '../services/api';
import { cn, BUILTIN_VISUALIZERS } from '../utils';
import {
  Plus,
  Search,
  Copy,
  Download,
  Upload,
  Trash2,
  Edit,
  Play,
  Eye,
  Palette,
  Loader2,
  Image,
} from 'lucide-react';
import { Visualizer } from '../types';

export function Visualizers() {
  const { visualizers, setVisualizers, addVisualizer, updateVisualizer, removeVisualizer } = useAppStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showBuiltIn, setShowBuiltIn] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadVisualizers = async () => {
      try {
        const res = await visualizersApi.list(showBuiltIn);
        setVisualizers(res.data);
      } catch (error) {
        console.error('Failed to load visualizers:', error);
      } finally {
        setLoading(false);
      }
    };
    loadVisualizers();
  }, [setVisualizers, showBuiltIn]);

  const builtInVisualizers = BUILTIN_VISUALIZERS.map(v => ({
    ...v,
    isBuiltIn: true,
    config: v.config || {},
    backgroundType: v.backgroundType || 'COLOR',
    backgroundConfig: v.backgroundConfig || { color: '#000000' },
    width: v.width || 1920,
    height: v.height || 1080,
    fps: v.fps || 30,
  }));

  const allVisualizers = showBuiltIn ? [...builtInVisualizers, ...visualizers] : visualizers;

  const handleCreate = async (data: Partial<Visualizer>) => {
    setCreating(true);
    try {
      const res = await visualizersApi.create(data);
      navigate(`/visualizers/${res.data.id}`);
    } catch (error) {
      console.error('Failed to create visualizer:', error);
      alert('Failed to create visualizer');
    } finally {
      setCreating(false);
      setShowCreateModal(false);
    }
  };

  const handlePreview = async (id: string) => {
    setPreviewing(id);
    try {
      const blob = await visualizersApi.preview(id, 10, 'mp4');
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Preview failed:', error);
      alert('Preview generation failed');
    } finally {
      setPreviewing(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    const newName = prompt('Enter name for duplicate:');
    if (!newName) return;
    try {
      const res = await visualizersApi.duplicate ? await visualizersApi.duplicate(id, newName) : await visualizersApi.create({ ...visualizers.find(v => v.id === id), name: newName });
      navigate(`/visualizers/${res.data.id}`);
    } catch (error) {
      console.error('Failed to duplicate:', error);
      alert('Failed to duplicate visualizer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this visualizer?')) return;
    try {
      await visualizersApi.delete(id);
      removeVisualizer(id);
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete visualizer');
    }
  };

  const allVisualizersList = showBuiltIn ? [...builtInVisualizers, ...visualizers] : visualizers;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Visualizers</h1>
          <p className="text-dark-400 mt-1">Audio-reactive visualizations for your streams</p>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 text-dark-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showBuiltIn}
              onChange={(e) => setShowBuiltIn(e.target.checked)}
              className="w-4 h-4 rounded border-dark-600 text-primary-500 focus:ring-primary-500"
            />
            Show built-in ({BUILTIN_VISUALIZERS.length})
          </label>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary" disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            Create Visualizer
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
          <input
            type="text"
            placeholder="Search visualizers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Visualizers Grid */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {allVisualizersList
              .filter((v) =>
                v.name.toLowerCase().includes(search.toLowerCase())
              )
              .map((visualizer) => (
                <VisualizerCard
                  key={visualizer.id}
                  visualizer={visualizer}
                  onPreview={handlePreview}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  onNavigate={(id) => navigate(`/visualizers/${id}`)}
                  previewing={previewing === visualizer.id}
                  previewUrl={previewUrl}
                  onClosePreview={() => {
                    setPreviewUrl(null);
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                  }}
                />
              ))}
            {allVisualizersList.filter(v => v.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
              <div className="col-span-full text-center py-12">
                <Palette className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                <p className="text-dark-400 mb-4">No visualizers found</p>
                <button onClick={() => setShowCreateModal(true)} className="btn-primary inline-flex">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Visualizer
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-dark-900 border border-dark-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CreateVisualizerModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreate} creating={creating} />
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75" onClick={() => {
          setPreviewUrl(null);
          if (previewUrl) URL.revokeObjectURL(previewUrl);
        }}>
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => {
              setPreviewUrl(null);
              if (previewUrl) URL.revokeObjectURL(previewUrl);
            }} className="absolute top-4 right-4 z-10 p-2 bg-dark-900/80 rounded-full text-white hover:bg-dark-800">
              ✕
            </button>
            <video src={previewUrl} controls autoPlay className="w-full h-auto rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}

function VisualizerCard({
  visualizer,
  onPreview,
  onDuplicate,
  onDelete,
  onNavigate,
  previewing,
  previewUrl,
  onClosePreview,
}: {
  visualizer: Visualizer;
  onPreview: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (id: string) => void;
  previewing: boolean;
  previewUrl: string | null;
  onClosePreview: () => void;
}) {
  const isBuiltIn = visualizer.isBuiltIn || visualizer.id.startsWith('builtin-');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SPECTRUM_BARS': return '📊';
      case 'WAVEFORM': return '📈';
      case 'CIRCULAR': return '🎯';
      case 'DUAL_VIEW': return '📊📈';
      case 'MINIMAL': return '📏';
      default: return '🎨';
    }
  };

  return (
    <div className="card hover:bg-dark-700/50 transition-colors group">
      <div className="aspect-video bg-dark-900 rounded-lg overflow-hidden relative mb-3">
        <div className="absolute inset-0 flex items-center justify-center bg-dark-900/50">
          <span className="text-6xl">{getTypeIcon(visualizer.type)}</span>
        </div>
        {previewUrl && (
          <video src={previewUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
        )}
      </div>

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-pink-400" />
          <h3 className="font-semibold text-white">{visualizer.name}</h3>
          {visualizer.isBuiltIn && <span className="badge-info text-xs">Built-in</span>}
        </div>
      </div>

      <p className="text-dark-400 text-sm mb-4 line-clamp-2">{visualizer.type}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="badge-info text-xs">{visualizer.width}x{visualizer.height}</span>
        <span className="badge-info text-xs">{visualizer.fps}fps</span>
        <span className="badge-info text-xs">{visualizer.backgroundType}</span>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-dark-700">
        <button onClick={() => onNavigate(visualizer.id)} className="btn-primary flex-1 text-sm">
          <Eye className="w-4 h-4 mr-1" />
          View
        </button>
        <button onClick={() => onPreview(visualizer.id)} className="btn-secondary text-sm" title="Preview" disabled={previewing}>
          <Play className="w-4 h-4 mr-1" />
          Preview
        </button>
        {!visualizer.isBuiltIn && (
          <>
            <button onClick={() => onDuplicate(visualizer.id)} className="btn-secondary text-sm" title="Duplicate">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(visualizer.id)} className="btn-ghost text-red-400 hover:bg-red-500/10 text-sm" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CreateVisualizerModal({ onClose, onSubmit, creating }: { onClose: () => void; onSubmit: (data: Partial<Visualizer>) => void; creating: boolean }) {
  const [formData, setFormData] = useState<Partial<Visualizer>>({
    name: '',
    type: 'SPECTRUM_BARS',
    config: {},
    backgroundType: 'COLOR',
    backgroundConfig: { color: '#000000' },
    width: 1920,
    height: 1080,
    fps: 30,
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Create Visualizer</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-800 text-dark-400">
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="label">Visualizer Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="input"
            placeholder="My Custom Visualizer"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Type</label>
            <select value={formData.type} onChange={(e) => handleChange('type', e.target.value)} className="input">
              <option value="SPECTRUM_BARS">📊 Spectrum Bars</option>
              <option value="WAVEFORM">📈 Waveform</option>
              <option value="CIRCULAR">🎯 Circular</option>
              <option value="DUAL_VIEW">📊 Dual View</option>
              <option value="MINIMAL">📏 Minimal</option>
            </select>
          </div>

          <div>
            <label className="label">Background Type</label>
            <select value={formData.backgroundType} onChange={(e) => handleChange('backgroundType', e.target.value)} className="input">
              <option value="COLOR">🎨 Solid Color</option>
              <option value="GRADIENT">🌈 Gradient</option>
              <option value="IMAGE">🖼️ Image</option>
              <option value="VIDEO">🎬 Video</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Width</label>
            <input type="number" value={formData.width} onChange={(e) => handleChange('width', parseInt(e.target.value))} className="input" min="640" max="3840" />
          </div>
          <div>
            <label className="label">Height</label>
            <input type="number" value={formData.height} onChange={(e) => handleChange('height', parseInt(e.target.value))} className="input" min="360" max="2160" />
          </div>
          <div>
            <label className="label">FPS</label>
            <input type="number" value={formData.fps} onChange={(e) => handleChange('fps', parseInt(e.target.value))} className="input" min="15" max="60" />
          </div>
        </div>

        <div>
          <label className="label">Background Color (for COLOR type)</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formData.backgroundConfig?.color || '#000000'}
              onChange={(e) => handleChange('backgroundConfig', { ...formData.backgroundConfig, color: e.target.value })}
              className="w-12 h-12 rounded border border-dark-600 cursor-pointer"
            />
            <input
              type="text"
              value={formData.backgroundConfig?.color || '#000000'}
              onChange={(e) => handleChange('backgroundConfig', { ...formData.backgroundConfig, color: e.target.value })}
              className="input flex-1 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="label">Config (JSON)</label>
          <textarea
            value={JSON.stringify(formData.config || {}, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleChange('config', parsed);
              } catch {
                // Ignore invalid JSON
              }
            }}
            className="input min-h-[100px] resize-y font-mono text-sm"
            placeholder='{"colors": ["#ff0000", "#00ff00"], "bars": 64}'
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
        <button type="button" onClick={onClose} className="btn-secondary" disabled={creating}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={creating}>
          {creating ? 'Creating...' : 'Create Visualizer'}
        </button>
      </div>
    </form>
  );
}
