import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { streamsApi } from '../services/api';
import { cn, getStatusColor, getStatusLabel, getSourceTypeLabel, getPlatformIcon } from '../utils';
import {
  Plus,
  Play,
  Stop,
  RotateCcw,
  Trash2,
  Edit,
  Search,
  Filter,
  Loader2,
  MoreHorizontal,
} from 'lucide-react';
import { Stream, SourceType } from '../types';

export function Streams() {
  const navigate = useNavigate();
  const { streams, setStreams, addStream, updateStream, removeStream } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadStreams = async () => {
      try {
        const res = await streamsApi.list();
        setStreams(res.data);
      } catch (error) {
        console.error('Failed to load streams:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStreams();
  }, [setStreams]);

  const filteredStreams = streams.filter((stream) => {
    const matchesSearch = stream.name.toLowerCase().includes(search.toLowerCase()) ||
      stream.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || stream.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async (data: Partial<Stream>) => {
    setCreating(true);
    try {
      const res = await streamsApi.create(data);
      navigate(`/streams/${res.data.id}`);
    } catch (error) {
      console.error('Failed to create stream:', error);
      alert('Failed to create stream');
    } finally {
      setCreating(false);
      setShowCreateModal(false);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await streamsApi.start(id);
    } catch (error) {
      console.error('Failed to start stream:', error);
      alert('Failed to start stream');
    }
  };

  const handleStop = async (id: string) => {
    try {
      await streamsApi.stop(id);
    } catch (error) {
      console.error('Failed to stop stream:', error);
      alert('Failed to stop stream');
    }
  };

  const handleRestart = async (id: string) => {
    try {
      await streamsApi.restart(id);
    } catch (error) {
      console.error('Failed to restart stream:', error);
      alert('Failed to restart stream');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stream?')) return;
    try {
      await streamsApi.delete(id);
      removeStream(id);
    } catch (error) {
      console.error('Failed to delete stream:', error);
      alert('Failed to delete stream');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Streams</h1>
          <p className="text-dark-400 mt-1">Manage your streaming configurations</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary" disabled={loading}>
          <Plus className="w-4 h-4 mr-2" />
          Create Stream
        </button>
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
          <input
            type="text"
            placeholder="Search streams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-dark-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All Status</option>
            <option value="LIVE">🟢 Live</option>
            <option value="STARTING">🟡 Starting</option>
            <option value="ERROR">🔴 Error</option>
            <option value="STOPPED">⚫ Stopped</option>
          </select>
        </div>
      </div>

      {/* Streams Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        ) : filteredStreams.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-white font-semibold mb-2">No streams found</h3>
            <p className="text-dark-400 mb-4">Create your first stream to get started</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary inline-flex">
              <Plus className="w-4 h-4 mr-2" />
              Create Stream
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">Stream</th>
                  <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">Source</th>
                  <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">Platforms</th>
                  <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">FX / Visualizer</th>
                  <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">Schedule</th>
                  <th className="text-right px-4 py-3 text-dark-400 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStreams.map((stream) => (
                  <tr key={stream.id} className="border-b border-dark-700/50 hover:bg-dark-800/50">
                    <td className="px-4 py-3">
                      <NavLink to={`/streams/${stream.id}`} className="font-medium text-white hover:text-primary-400">
                        {stream.name}
                      </NavLink>
                      <p className="text-dark-400 text-sm truncate max-w-xs">{stream.description || 'No description'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                        stream.status === 'LIVE' ? 'bg-green-500/20 text-green-400' :
                        stream.status === 'STARTING' ? 'bg-yellow-500/20 text-yellow-400' :
                        stream.status === 'ERROR' ? 'bg-red-500/20 text-red-400' :
                        'bg-dark-600 text-dark-300'
                      )}>
                        {getStatusLabel(stream.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge-gray">{getSourceTypeLabel(stream.sourceType)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {stream.outputPlatforms.map((p) => (
                          <span key={p} className="badge-info text-xs">
                            {getPlatformIcon(p)} {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {stream.fxPresetId && <span className="badge-info text-xs">FX: {stream.fxPresetId.slice(0, 8)}</span>}
                        {stream.visualizerId && <span className="badge-info text-xs">Viz: {stream.visualizerId.slice(0, 8)}</span>}
                        {!stream.fxPresetId && !stream.visualizerId && <span className="badge-gray">None</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-dark-300">
                      {stream.scheduleId ? `Scheduled` : 'Manual'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <NavLink to={`/streams/${stream.id}`} className="btn-secondary text-sm" title="Details">
                          <Edit className="w-4 h-4" />
                        </NavLink>
                        {stream.status === 'LIVE' ? (
                          <button onClick={() => handleStop(stream.id)} className="btn-danger text-sm" title="Stop">
                            <Stop className="w-4 h-4" />
                          </button>
                        ) : stream.status === 'STARTING' ? (
                          <button disabled className="btn-secondary text-sm" title="Starting...">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </button>
                        ) : (
                          <button onClick={() => handleStart(stream.id)} className="btn-primary text-sm" title="Start">
                            <Play className="w-4 h-4 mr-1" />
                            Start
                          </button>
                        )}
                        <button onClick={() => handleRestart(stream.id)} className="btn-secondary text-sm" title="Restart">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(stream.id)} className="btn-ghost text-sm text-red-400 hover:bg-red-500/10" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Stream Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-dark-900 border border-dark-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CreateStreamModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreate} creating={creating} />
          </div>
        </div>
      )}
    </div>
  );
}

function CreateStreamModal({ onClose, onSubmit, creating }: { onClose: () => void; onSubmit: (data: Partial<Stream>) => void; creating: boolean }) {
  const [formData, setFormData] = useState<Partial<Stream>>({
    name: '',
    description: '',
    sourceType: 'VIDEO_FILE',
    videoFiles: [],
    outputPlatforms: ['CUSTOM_RTMP'],
    customRtmpUrls: { CUSTOM_RTMP: { url: '', key: '' } },
    resolution: '1920x1080',
    fps: 30,
    videoBitrate: 4000,
    audioBitrate: 128,
    codec: 'libx264',
    preset: 'veryfast',
    loopMode: 'INFINITE',
    shuffleEnabled: false,
    crossfadeDuration: 3,
    fxPresetId: '',
    audioSource: 'VIDEO',
    audioFiles: [],
    noiseProfile: 'PINK',
    noiseAmplitude: 0.01,
    autoRestart: true,
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
        <h2 className="text-xl font-bold text-white">Create New Stream</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-800 text-dark-400">
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="label">Stream Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="input"
            placeholder="My 24/7 Music Stream"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="label">Description</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            className="input min-h-[80px] resize-y"
            placeholder="Optional description"
          />
        </div>

        <div>
          <label className="label">Source Type</label>
          <select value={formData.sourceType} onChange={(e) => handleChange('sourceType', e.target.value)} className="input">
            <option value="VIDEO_FILE">📁 Video File(s)</option>
            <option value="PLAYLIST">📋 Playlist</option>
            <option value="VISUALIZER">🎵 Visualizer Only</option>
            <option value="RTMP_PUSH">📤 RTMP Push (OBS)</option>
          </select>
        </div>

        <div>
          <label className="label">FX Preset</label>
          <select value={formData.fxPresetId || ''} onChange={(e) => handleChange('fxPresetId', e.target.value || '')} className="input">
            <option value="">None (Clean)</option>
            <optgroup label="Built-in Presets">
              <option value="builtin-soft">Soft (Minimal)</option>
              <option value="builtin-balanced">Balanced (General)</option>
              <option value="builtin-aggressive">Aggressive (Max)</option>
              <option value="builtin-cid_aware">CID Aware</option>
              <option value="builtin-cid_aggressive">CID Aggressive</option>
              <option value="builtin-music_stream">Music Stream</option>
              <option value="builtin-gaming">Gaming</option>
            </optgroup>
          </select>
        </div>
      </div>

      <div className="border-t border-dark-700 pt-4">
        <h3 className="font-semibold text-white mb-4">Output Platforms</h3>
        <div className="space-y-3">
          {formData.outputPlatforms?.map((platform, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={platform}
                onChange={(e) => {
                  const newPlatforms = [...(formData.outputPlatforms || [])];
                  newPlatforms[index] = e.target.value;
                  handleChange('outputPlatforms', newPlatforms);
                }}
                className="input w-40"
              >
                <option value="YOUTUBE">📺 YouTube</option>
                <option value="TWITCH">🟣 Twitch</option>
                <option value="FACEBOOK">📘 Facebook</option>
                <option value="CUSTOM_RTMP">🔗 Custom RTMP</option>
              </select>
              {platform === 'CUSTOM_RTMP' && (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="RTMP URL (e.g. rtmp://a.rtmp.youtube.com/live2)"
                    value={formData.customRtmpUrls?.[platform]?.url || ''}
                    onChange={(e) => handleChange('customRtmpUrls', {
                      ...formData.customRtmpUrls,
                      [platform]: { ...formData.customRtmpUrls?.[platform], url: e.target.value }
                    })}
                    className="input flex-1"
                  />
                  <input
                    type="text"
                    placeholder="Stream Key"
                    value={formData.customRtmpUrls?.[platform]?.key || ''}
                    onChange={(e) => handleChange('customRtmpUrls', {
                      ...formData.customRtmpUrls,
                      [platform]: { ...formData.customRtmpUrls?.[platform], key: e.target.value }
                    })}
                    className="input w-48"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
        <button type="button" onClick={onClose} className="btn-secondary" disabled={creating}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={creating}>
          {creating ? 'Creating...' : 'Create Stream'}
        </button>
      </div>
    </form>
  );
}
