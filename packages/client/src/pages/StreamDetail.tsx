import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { streamsApi } from '../services/api';
import { cn, getStatusColor, getStatusLabel, getSourceTypeLabel, getPlatformIcon, formatDuration, formatBitrate } from '../utils';
import {
  Play,
  Square as Stop,
  RotateCcw,
  Edit,
  Trash2,
  Server,
  BarChart,
  Clock,
  Globe,
  Zap,
  Palette,
  Calendar,
  Loader2,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
} from 'lucide-react';
import { Stream, StreamStatusResponse } from '../types';
import { RtmpTargetItem } from '../components/RtmpTargetItem';

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) => {
  return (
    <div className="bg-dark-800/50 border border-dark-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('w-5 h-5', color)} />
        <span className="text-dark-400 text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
};

export function StreamDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { streams, setStreamStatus, updateStream, removeStream } = useAppStore();
  const [stream, setStream] = useState<Stream | null>(null);
  const [status, setStatusState] = useState<StreamStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [vmafResult, setVmafResult] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadStream = async () => {
      try {
        const localStream = streams.find(s => s.id === id);
        if (localStream) {
          setStream(localStream);
        } else {
          const res = await streamsApi.get(id!);
          setStream(res.data);
        }
      } catch (error) {
        console.error('Failed to load stream:', error);
        navigate('/streams');
      } finally {
        setLoading(false);
      }
    };

    loadStream();
  }, [id, streams, navigate]);

  useEffect(() => {
    if (!id || !stream || (stream.status !== 'LIVE' && stream.status !== 'STARTING')) {
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await streamsApi.getStatus(id!);
        setStatusState(res.data);
      } catch (error) {
        console.error('Failed to fetch status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [id, stream?.status]);

  const handleStart = async () => {
    if (!stream) return;
    setActionLoading('start');
    try {
      await streamsApi.start(stream.id);
    } catch (error) {
      console.error('Failed to start stream:', error);
      alert('Failed to start stream');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async () => {
    if (!stream) return;
    setActionLoading('stop');
    try {
      await streamsApi.stop(stream.id);
    } catch (error) {
      console.error('Failed to stop stream:', error);
      alert('Failed to stop stream');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestart = async () => {
    if (!stream) return;
    setActionLoading('restart');
    try {
      await streamsApi.restart(stream.id);
    } catch (error) {
      console.error('Failed to restart stream:', error);
      alert('Failed to restart stream');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!stream) return;
    if (!confirm('Are you sure you want to delete this stream?')) return;
    setActionLoading('delete');
    try {
      await streamsApi.delete(stream.id);
      navigate('/streams');
    } catch (error) {
      console.error('Failed to delete stream:', error);
      alert('Failed to delete stream');
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

  if (!stream) {
    return (
      <div className="text-center py-12">
        <h2 className="text-white font-semibold mb-2">Stream not found</h2>
        <button onClick={() => navigate('/streams')} className="btn-primary">Back to Streams</button>
      </div>
    );
  }

  const currentStatus = status || stream;

  // Create a proper StreamStatusResponse for rtmpTargets using stream properties
  const rtmpStatus: StreamStatusResponse = {
    streamId: stream.id,
    status: currentStatus.status,
    broadcastId: stream.currentBroadcastId || null,
    currentBroadcastId: stream.currentBroadcastId || null,
    startedAt: stream.startedAt || null,
    uptime: stream.startedAt ? Math.floor((Date.now() - new Date(stream.startedAt).getTime()) / 1000) : 0,
    stats: status?.stats || { bitrate: 0, fps: 0, droppedFrames: 0, totalFrames: 0, speed: 0, audioLevel: 0 },
    health: status?.health || { isHealthy: true, lastCheck: new Date().toISOString(), reconnectCount: 0, lastError: null, networkLatency: 0 },
  };

  const rtmpTargets = stream.outputPlatforms.map((platform) => (
    <RtmpTargetItem key={platform} platform={platform} currentStatus={rtmpStatus} stream={{ ...stream, customRtmpUrls: stream.customRtmpUrls || undefined }} />
  ));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/streams')} className="p-2 rounded-lg hover:bg-dark-800 text-dark-400">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{stream.name}</h1>
            <p className="text-dark-400">{stream.description || 'No description'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium',
            getStatusColor(currentStatus.status)
          )}>
            {getStatusLabel(currentStatus.status)}
          </span>
          <button onClick={() => navigate('/streams/' + stream.id + '/edit')} className="btn-secondary" disabled={!!actionLoading}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Stream Controls</h2>
            <div className="flex flex-wrap gap-3">
              {currentStatus.status === 'LIVE' ? (
                <button onClick={handleStop} className="btn-danger" disabled={actionLoading === 'stop'}>
                  <Stop className="w-4 h-4 mr-2" />
                  {actionLoading === 'stop' ? 'Stopping...' : 'Stop Stream'}
                </button>
              ) : currentStatus.status === 'STARTING' ? (
                <button disabled className="btn-secondary">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </button>
              ) : (
                <button onClick={handleStart} className="btn-primary" disabled={actionLoading === 'start'}>
                  <Play className="w-4 h-4 mr-2" />
                  {actionLoading === 'start' ? 'Starting...' : 'Start Stream'}
                </button>
              )}
              <button onClick={handleRestart} className="btn-secondary" disabled={actionLoading === 'restart' || currentStatus.status !== 'LIVE'}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Restart
              </button>
              <button onClick={handleDelete} className="btn-danger" disabled={actionLoading === 'delete'}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="text-sm font-medium text-dark-400 mb-3">Stream Info</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-dark-400">Source Type</dt>
                  <dd className="text-white font-medium">{getSourceTypeLabel(stream.sourceType)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-dark-400">Resolution</dt>
                  <dd className="text-white font-medium">{stream.resolution}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-dark-400">FPS</dt>
                  <dd className="text-white font-medium">{stream.fps}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-dark-400">Video Bitrate</dt>
                  <dd className="text-white font-medium">{formatBitrate(stream.videoBitrate)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-dark-400">Audio Bitrate</dt>
                  <dd className="text-white font-medium">{formatBitrate(stream.audioBitrate)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-dark-400">Codec</dt>
                  <dd className="text-white font-medium">{stream.codec} ({stream.preset})</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-dark-400">Loop Mode</dt>
                  <dd className="text-white font-medium">{stream.loopMode}</dd>
                </div>
                {stream.maxDuration && (
                  <div className="flex justify-between">
                    <dt className="text-dark-400">Max Duration</dt>
                    <dd className="text-white font-medium">{stream.maxDuration}h</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="card">
              <h3 className="text-sm font-medium text-dark-400 mb-3">Output</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-dark-400">Platforms</dt>
                  <dd className="flex flex-wrap gap-1">
                    {stream.outputPlatforms.map((p) => (
                      <span key={p} className="badge-info text-xs">{getPlatformIcon(p)} {p}</span>
                    ))}
                  </dd>
                </div>
                {stream.fxPresetId && (
                  <div className="flex justify-between">
                    <dt className="text-dark-400">FX Preset</dt>
                    <dd className="text-white font-medium">{stream.fxPresetId}</dd>
                  </div>
                )}
                {stream.visualizerId && (
                  <div className="flex justify-between">
                    <dt className="text-dark-400">Visualizer</dt>
                    <dd className="text-white font-medium">{stream.visualizerId}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {status && status.status === 'LIVE' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Real-time Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="Bitrate" value={formatBitrate(status.stats.bitrate)} icon={BarChart} color="text-blue-400" />
                <StatCard label="FPS" value={status.stats.fps.toFixed(1)} icon={Server} color="text-green-400" />
                <StatCard label="Speed" value={status.stats.speed.toFixed(1) + 'x'} icon={Zap} color="text-yellow-400" />
                <StatCard label="Frames" value={status.stats.totalFrames.toLocaleString()} icon={BarChart} color="text-purple-400" />
                <StatCard label="Dropped" value={status.stats.droppedFrames.toString()} icon={AlertTriangle} color="text-red-400" />
                <StatCard label="Audio" value={status.stats.audioLevel.toFixed(1) + ' dB'} icon={Calendar} color="text-orange-400" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary-400" />
              RTMP Targets
            </h2>
            <div className="space-y-3">
              {rtmpTargets}
            </div>
          </div>

          {stream.fxPresetId && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                FX Preset: {stream.fxPresetId}
              </h2>
              <p className="text-dark-400 text-sm">Video and audio filters applied to this stream</p>
            </div>
          )}

          {stream.visualizerId && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-pink-400" />
                Visualizer: {stream.visualizerId}
              </h2>
              <p className="text-dark-400 text-sm">Audio-reactive visualization</p>
            </div>
          )}

          {stream.scheduleId && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-400" />
                Scheduled Stream
              </h2>
              <p className="text-dark-400 text-sm">Managed by schedule: {stream.scheduleId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
