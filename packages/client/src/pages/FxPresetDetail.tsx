import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { fxPresetsApi } from '../services/api';
import { cn, getIntensityColor, getIntensityLabel } from '../utils';
import {
  Play,
  Copy,
  Download,
  Upload,
  Trash2,
  Edit,
  ChevronLeft,
  Zap,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { FxPreset, VmafTestResult } from '../types';

export function FxPresetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fxPresets, setFxPresets, updateFxPreset, removeFxPreset } = useAppStore();
  const [preset, setPreset] = useState<FxPreset | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [vmafResult, setVmafResult] = useState<VmafTestResult | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadPreset = async () => {
      try {
        const res = await fxPresetsApi.get(id!);
        setPreset(res.data);
      } catch (error) {
        console.error('Failed to load preset:', error);
        navigate('/fx-presets');
      } finally {
        setLoading(false);
      }
    };
    loadPreset();
  }, [id, navigate]);

  const handleTestVmaf = async () => {
    if (!preset) return;
    setActionLoading('test-vmaf');
    try {
      const res = await fxPresetsApi.testVmaf(preset.id);
      setVmafResult(res.data);
      alert(`VMAF Test Complete!\nScore: ${res.data.vmafScore?.toFixed(1) || 'N/A'}\nMean: ${res.data.details?.stats?.mean?.toFixed(1) || 'N/A'}\nStdDev: ${res.data.details?.stats?.stddev?.toFixed(2) || 'N/A'}`);
    } catch (error) {
      console.error('VMAF test failed:', error);
      alert('VMAF test failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async () => {
    if (!preset) return;
    const newName = prompt('Enter name for duplicate:');
    if (!newName) return;
    setActionLoading('duplicate');
    try {
      const res = await fxPresetsApi.duplicate(preset.id, newName);
      navigate(`/fx-presets/${res.data.id}`);
    } catch (error) {
      console.error('Failed to duplicate:', error);
      alert('Failed to duplicate preset');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = async () => {
    if (!preset) return;
    try {
      const res = await fxPresetsApi.export(preset.id);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fx-preset-${preset.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed');
    }
  };

  const handleDelete = async () => {
    if (!preset) return;
    if (!confirm('Are you sure you want to delete this preset?')) return;
    setActionLoading('delete');
    try {
      await fxPresetsApi.delete(preset.id);
      navigate('/fx-presets');
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete preset');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!preset) {
    return (
      <div className="text-center py-12">
        <h2 className="text-white font-semibold mb-2">Preset not found</h2>
        <button onClick={() => navigate('/fx-presets')} className="btn-primary">Back to Presets</button>
      </div>
    );
  }

  const isBuiltIn = preset.isBuiltIn || preset.id.startsWith('builtin-');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/fx-presets')} className="p-2 rounded-lg hover:bg-dark-800 text-dark-400">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">{preset.name}</h1>
              <p className="text-dark-400">{preset.description || 'No description'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium',
            getIntensityColor(preset.intensity)
          )}>
            {getIntensityLabel(preset.intensity)}
          </span>
          {preset.vmafScore !== null && preset.vmafScore !== undefined && (
            <span className="badge-success">VMAF: {preset.vmafScore.toFixed(1)}</span>
          )}
          {preset.isBuiltIn && <span className="badge-info">Built-in</span>}
          <button onClick={() => setShowEditModal(true)} className="btn-secondary" disabled={editing}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </button>
        </div>
      </div>

      {/* VMAF Result */}
      {vmafResult && (
        <div className="card bg-green-500/10 border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold">VMAF Test Result</h3>
              <div className="flex flex-wrap gap-4 text-sm mt-1 text-dark-300">
                <span><strong>Score:</strong> {vmafResult.vmafScore?.toFixed(1) || 'N/A'}</span>
                {vmafResult.details && (
                  <>
                    <span><strong>Mean:</strong> {vmafResult.details.stats.mean.toFixed(1)}</span>
                    <span><strong>StdDev:</strong> {vmafResult.details.stats.stddev.toFixed(2)}</span>
                    <span><strong>Min/Max:</strong> {vmafResult.details.stats.min.toFixed(1)} / {vmafResult.details.stats.max.toFixed(1)}</span>
                  </>
                )}
              </div>
            </div>
            <button onClick={() => setVmafResult(null)} className="btn-ghost text-sm">
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              Preset Details
            </h2>
            <dl className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-dark-400">Name</dt>
                  <dd className="text-white font-medium">{preset.name}</dd>
                </div>
                <div>
                  <dt className="text-dark-400">Intensity</dt>
                  <dd className="flex items-center gap-2">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                      getIntensityColor(preset.intensity)
                    )}>
                      {getIntensityLabel(preset.intensity)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-dark-400">Type</dt>
                  <dd className="text-white font-medium">{preset.isBuiltIn ? 'Built-in' : 'Custom'}</dd>
                </div>
                <div>
                  <dt className="text-dark-400">Version</dt>
                  <dd className="text-white font-medium">v{preset.version}</dd>
                </div>
                <div>
                  <dt className="text-dark-400">VMAF Score</dt>
                  <dd className="text-white font-medium">
                    {preset.vmafScore !== null && preset.vmafScore !== undefined
                      ? `${preset.vmafScore.toFixed(1)}`
                      : 'Not tested'}
                  </dd>
                </div>
                <div>
                  <dt className="text-dark-400">VMAF Tested</dt>
                  <dd className="text-white font-medium">
                    {preset.vmafTestedAt ? new Date(preset.vmafTestedAt).toLocaleString() : 'Never'}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Video Filters */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              Video Filters ({Object.keys(preset.videoFilters || {}).length})
            </h2>
            <pre className="bg-dark-900/50 border border-dark-700 rounded-lg p-4 overflow-x-auto text-sm">
              <code>{JSON.stringify(preset.videoFilters || {}, null, 2)}</code>
            </pre>
          </div>

          {/* Audio Filters */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-400" />
              Audio Filters ({Object.keys(preset.audioFilters || {}).length})
            </h2>
            <pre className="bg-dark-900/50 border border-dark-700 rounded-lg p-4 overflow-x-auto text-sm">
              <code>{JSON.stringify(preset.audioFilters || {}, null, 2)}</code>
            </pre>
          </div>

          {/* Custom Filter Graph */}
          {preset.customFilterGraph && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Custom Filter Graph</h2>
              <pre className="bg-dark-900/50 border border-dark-700 rounded-lg p-4 overflow-x-auto text-sm">
                <code>{preset.customFilterGraph}</code>
              </pre>
            </div>
          )}

          {/* Tags */}
          {preset.tags && preset.tags.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {preset.tags.map((tag) => (
                  <span key={tag} className="badge-info text-sm">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* VMAF Test */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-green-400" />
              Quality Test
            </h2>
            <p className="text-dark-400 text-sm mb-4">Run VMAF quality assessment to measure the perceptual quality impact of this preset.</p>
            <button
              onClick={async () => {
                setActionLoading('test-vmaf');
                try {
                  const res = await fxPresetsApi.testVmaf(preset.id);
                  setVmafResult(res.data);
                } catch (error) {
                  console.error('VMAF test failed:', error);
                  alert('VMAF test failed');
                } finally {
                  setActionLoading(null);
                }
              }}
              className="btn-primary w-full"
              disabled={actionLoading === 'test-vmaf'}
            >
              {actionLoading === 'test-vmaf' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run VMAF Test
                </>
              )}
            </button>
            <p className="text-dark-500 text-xs mt-2 text-center">Uses FFmpeg libvmaf to compare against reference video</p>
          </div>

          {/* Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Actions</h2>
            <div className="space-y-3">
              <button onClick={async () => {
                const newName = prompt('Enter name for duplicate:');
                if (!newName) return;
                setActionLoading('duplicate');
                try {
                  const res = await fxPresetsApi.duplicate(preset.id, newName);
                  navigate(`/fx-presets/${res.data.id}`);
                } catch (error) {
                  console.error('Failed to duplicate:', error);
                  alert('Failed to duplicate preset');
                } finally {
                  setActionLoading(null);
                }
              }} className="btn-secondary w-full justify-start" disabled={actionLoading === 'duplicate'}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate Preset
              </button>
              <button onClick={handleExport} className="btn-secondary w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Export as JSON
              </button>
              <button onClick={() => setShowEditModal(true)} className="btn-secondary w-full justify-start" disabled={editing}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Preset
              </button>
              {preset.isBuiltIn && (
                <p className="text-dark-500 text-xs text-center">Built-in presets cannot be modified or deleted</p>
              )}
              {!preset.isBuiltIn && (
                <button onClick={async () => {
                  if (!confirm('Are you sure you want to delete this preset?')) return;
                  setActionLoading('delete');
                  try {
                    await fxPresetsApi.delete(preset.id);
                    navigate('/fx-presets');
                  } catch (error) {
                    console.error('Failed to delete:', error);
                    alert('Failed to delete preset');
                  } finally {
                    setActionLoading(null);
                  }
                }} className="btn-danger w-full justify-start" disabled={actionLoading === 'delete'}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Preset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-dark-900 border border-dark-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <EditPresetModal
              preset={preset}
              onClose={() => setShowEditModal(false)}
              onSubmit={async (data) => {
                setEditing(true);
                try {
                  await fxPresetsApi.update(preset.id, data);
                  const res = await fxPresetsApi.get(preset.id);
                  setPreset(res.data);
                  setShowEditModal(false);
                } catch (error) {
                  console.error('Failed to update preset:', error);
                  alert('Failed to update preset');
                } finally {
                  setEditing(false);
                }
              }}
              editing={editing}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function EditPresetModal({ preset, onClose, onSubmit, editing }: { preset: FxPreset; onClose: () => void; onSubmit: (data: Partial<FxPreset>) => void; editing: boolean }) {
  const [formData, setFormData] = useState<Partial<FxPreset>>({
    name: preset.name,
    description: preset.description,
    intensity: preset.intensity,
    videoFilters: preset.videoFilters,
    audioFilters: preset.audioFilters,
    customFilterGraph: preset.customFilterGraph,
    tags: preset.tags || [],
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
        <h2 className="text-xl font-bold text-white">Edit Preset</h2>
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
            required
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="input min-h-[80px] resize-y"
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
          />
        </div>

        <div>
          <label className="label">Tags (comma separated)</label>
          <input
            type="text"
            value={formData.tags?.join(', ') || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
            className="input"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
        <button type="button" onClick={onClose} className="btn-secondary" disabled={editing}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={editing}>
          {editing ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
