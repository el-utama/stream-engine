import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { fxPresetsApi } from '../services/api';
import { cn, getIntensityColor, getIntensityLabel, BUILTIN_FX_PRESETS } from '../utils';
import {
  Plus,
  Play,
  Search,
  Filter,
  Loader2,
  Copy,
  Download,
  Upload,
  Trash2,
  Edit,
  Eye,
  Zap,
} from 'lucide-react';
import { FxPreset } from '../types';

export function FxPresets() {
  const { fxPresets, setFxPresets, addFxPreset, updateFxPreset, removeFxPreset } = useAppStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showBuiltIn, setShowBuiltIn] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [testingVmaf, setTestingVmaf] = useState<string | null>(null);

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const res = await fxPresetsApi.list(showBuiltIn);
        setFxPresets(res.data);
      } catch (error) {
        console.error('Failed to load presets:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPresets();
  }, [setFxPresets, showBuiltIn]);

  const filteredPresets = fxPresets.filter((preset) =>
    preset.name.toLowerCase().includes(search.toLowerCase()) ||
    preset.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (data: Partial<FxPreset>) => {
    setCreating(true);
    try {
      const res = await fxPresetsApi.create(data);
      navigate(`/fx-presets/${res.data.id}`);
    } catch (error) {
      console.error('Failed to create preset:', error);
      alert('Failed to create preset');
    } finally {
      setCreating(false);
      setShowCreateModal(false);
    }
  };

  const handleTestVmaf = async (id: string) => {
    setTestingVmaf(id);
    try {
      const res = await fxPresetsApi.testVmaf(id);
      alert(`VMAF Score: ${res.data.vmafScore?.toFixed(1) || 'N/A'}`);
    } catch (error) {
      console.error('VMAF test failed:', error);
      alert('VMAF test failed');
    } finally {
      setTestingVmaf(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    const newName = prompt('Enter name for duplicate:');
    if (!newName) return;
    try {
      const res = await fxPresetsApi.duplicate(id, newName);
      navigate(`/fx-presets/${res.data.id}`);
    } catch (error) {
      console.error('Failed to duplicate:', error);
      alert('Failed to duplicate preset');
    }
  };

  const handleExport = async (id: string) => {
    try {
      const res = await fxPresetsApi.export(id);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fx-preset-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed');
    }
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await fxPresetsApi.import(data);
      navigate(`/fx-presets/${res.data.id}`);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed - invalid JSON');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this preset?')) return;
    try {
      await fxPresetsApi.delete(id);
      removeFxPreset(id);
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete preset');
    }
  };

  const builtInPresets = BUILTIN_FX_PRESETS.map(p => ({
    ...p,
    isBuiltIn: true,
    videoFilters: p.videoFilters || {},
    audioFilters: p.audioFilters || {},
  }));

  const allPresets = showBuiltIn ? [...builtInPresets, ...fxPresets] : fxPresets;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">FX Presets</h1>
          <p className="text-dark-400 mt-1">Manage video & audio filter presets</p>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 text-dark-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showBuiltIn}
              onChange={(e) => setShowBuiltIn(e.target.checked)}
              className="w-4 h-4 rounded border-dark-600 text-primary-500 focus:ring-primary-500"
            />
            Show built-in presets ({BUILTIN_FX_PRESETS.length})
          </label>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary" disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            Create Preset
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
          <input
            type="text"
            placeholder="Search presets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
              className="hidden"
              id="import-file"
            />
            <label htmlFor="import-file" className="btn-secondary">
              <Upload className="w-4 h-4 mr-2" />
              Import JSON
            </label>
          </div>
        </div>
      </div>

      {/* Presets Grid */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {allPresets
              .filter((p) =>
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.description?.toLowerCase().includes(search.toLowerCase())
              )
              .map((preset) => (
                <FxPresetCard
                  key={preset.id}
                  preset={preset as FxPreset}
                  onTestVmaf={handleTestVmaf}
                  onDuplicate={handleDuplicate}
                  onExport={handleExport}
                  onDelete={handleDelete}
                  onNavigate={(id) => navigate(`/fx-presets/${id}`)}
                  testingVmaf={testingVmaf === preset.id}
                />
              ))}
            {allPresets.filter(p => 
              p.name.toLowerCase().includes(search.toLowerCase()) ||
              p.description?.toLowerCase().includes(search.toLowerCase())
            ).length === 0 && (
              <div className="col-span-full text-center py-12">
                <Zap className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                <p className="text-dark-400 mb-4">No presets found</p>
                <button onClick={() => setShowCreateModal(true)} className="btn-primary inline-flex">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Preset
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
            <CreatePresetModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreate} creating={creating} />
          </div>
        </div>
      )}
    </div>
  );
}

function FxPresetCard({
  preset,
  onTestVmaf,
  onDuplicate,
  onExport,
  onDelete,
  onNavigate,
  testingVmaf,
}: {
  preset: FxPreset;
  onTestVmaf: (id: string) => void;
  onDuplicate: (id: string) => void;
  onExport: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (id: string) => void;
  testingVmaf: boolean;
}) {
  const isBuiltIn = preset.isBuiltIn || preset.id.startsWith('builtin-');

  return (
    <div className="card hover:bg-dark-700/50 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-white">{preset.name}</h3>
          {preset.isBuiltIn && (
            <span className="badge-info text-xs">Built-in</span>
          )}
        </div>
      </div>

      <p className="text-dark-400 text-sm mb-4 line-clamp-2">{preset.description || 'No description'}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
          getIntensityColor(preset.intensity)
        )}>
          {getIntensityLabel(preset.intensity)}
        </span>
        {Object.keys(preset.videoFilters || {}).length > 0 && (
          <span className="badge-info text-xs">Video: {Object.keys(preset.videoFilters).length}</span>
        )}
        {Object.keys(preset.audioFilters || {}).length > 0 && (
          <span className="badge-info text-xs">Audio: {Object.keys(preset.audioFilters).length}</span>
        )}
        {preset.vmafScore !== null && preset.vmafScore !== undefined && (
          <span className="badge-success text-xs">VMAF: {preset.vmafScore.toFixed(1)}</span>
        )}
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-dark-700">
        <button onClick={() => onNavigate(preset.id)} className="btn-primary flex-1 text-sm">
          <Eye className="w-4 h-4 mr-1" />
          View
        </button>
        {!preset.isBuiltIn && (
          <>
            <button onClick={() => onDuplicate(preset.id)} className="btn-secondary text-sm" title="Duplicate">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={() => onExport(preset.id)} className="btn-secondary text-sm" title="Export">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(preset.id)} className="btn-ghost text-red-400 hover:bg-red-500/10 text-sm" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
        <button onClick={() => onNavigate(preset.id)} className="btn-secondary text-sm" title="Test VMAF" disabled={preset.isBuiltIn}>
          <Play className="w-4 h-4 mr-1" />
          VMAF
        </button>
      </div>
    </div>
  );
}

function CreatePresetModal({ onClose, onSubmit, creating }: { onClose: () => void; onSubmit: (data: Partial<FxPreset>) => void; creating: boolean }) {
  const [formData, setFormData] = useState<Partial<FxPreset>>({
    name: '',
    description: '',
    intensity: 'MEDIUM',
    videoFilters: {},
    audioFilters: {},
    customFilterGraph: '',
    tags: [],
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
        <h2 className="text-xl font-bold text-white">Create FX Preset</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-800 text-dark-400">
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="label">Preset Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="input"
            placeholder="My Custom Preset"
            required
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="input min-h-[80px] resize-y"
            placeholder="Optional description"
          />
        </div>

        <div>
          <label className="label">Intensity</label>
          <select
            value={formData.intensity || 'MEDIUM'}
            onChange={(e) => setFormData(prev => ({ ...prev, intensity: e.target.value }))}
            className="input"
          >
            <option value="LOW">Low (Subtle)</option>
            <option value="MEDIUM">Medium (Balanced)</option>
            <option value="HIGH">High (Strong)</option>
            <option value="AGGRESSIVE">Aggressive (Maximum)</option>
          </select>
        </div>

        <div>
          <label className="label">Video Filters (JSON)</label>
          <textarea
            value={JSON.stringify(formData.videoFilters || {}, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setFormData(prev => ({ ...prev, videoFilters: parsed }));
              } catch {
                // Ignore invalid JSON
              }
            }}
            className="input min-h-[120px] resize-y font-mono text-sm"
            placeholder='{"crop": {"percent": 2, "randomize": true}, "colorJitter": {"brightness": 0.01}}'
          />
        </div>

        <div>
          <label className="label">Audio Filters (JSON)</label>
          <textarea
            value={JSON.stringify(formData.audioFilters || {}, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setFormData(prev => ({ ...prev, audioFilters: parsed }));
              } catch {
                // Ignore invalid JSON
              }
            }}
            className="input min-h-[120px] resize-y font-mono text-sm"
            placeholder='{"noise": {"type": "pink", "amplitude": 0.01}, "loudnorm": {"target": -16}}'
          />
        </div>

        <div>
          <label className="label">Tags (comma separated)</label>
          <input
            type="text"
            value={formData.tags?.join(', ') || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
            className="input"
            placeholder="music, streaming, gaming"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
        <button type="button" onClick={onClose} className="btn-secondary" disabled={creating}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={creating}>
          {creating ? 'Creating...' : 'Create Preset'}
        </button>
      </div>
    </form>
  );
}
