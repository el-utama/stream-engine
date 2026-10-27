import { useAppStore } from '../store';
import { streamsApi, fxPresetsApi, visualizersApi, schedulesApi } from '../services/api';
import { useEffect } from 'react';
import { cn } from '../utils';
import {
  PlayCircle,
  Zap,
  Palette,
  Calendar,
  TrendingUp,
  Server,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';

export function Dashboard() {
  const { streams, accounts, fxPresets, visualizers, schedules, setStreams, setFxPresets, setVisualizers, setSchedules } = useAppStore();

  const liveStreams = streams.filter(s => s.status === 'LIVE').length;
  const startingStreams = streams.filter(s => s.status === 'STARTING').length;
  const errorStreams = streams.filter(s => s.status === 'ERROR').length;
  const totalStreams = streams.length;

  const activeSchedules = schedules.filter(s => s.isActive).length;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [streamsRes, fxPresetsRes, visualizersRes, schedulesRes] = await Promise.all([
          streamsApi.list(),
          fxPresetsApi.list(true),
          visualizersApi.list(true),
          schedulesApi.list(),
        ]);
        setStreams(streamsRes.data);
        setFxPresets(fxPresetsRes.data);
        setVisualizers(visualizersRes.data);
        setSchedules(schedulesRes.data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };
    loadData();
  }, [setStreams, setFxPresets, setVisualizers, setSchedules]);

  const stats = [
    { label: 'Total Streams', value: totalStreams, icon: Server, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { label: 'Live Now', value: liveStreams, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
    { label: 'Starting', value: startingStreams, icon: Loader2, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    { label: 'Errors', value: errorStreams, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/20' },
  ];

  const recentStreams = streams.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-400 mt-1">Overview of your streaming engine</p>
        </div>
        <div className="flex gap-2">
          <NavLink to="/streams" className="btn-primary">
            <PlayCircle className="w-4 h-4 mr-2" />
            Create Stream
          </NavLink>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className={cn('p-3 rounded-xl', stat.bg)}>
                <stat.icon className={cn('w-6 h-6', stat.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NavLink to="/streams" className="card hover:bg-dark-700/50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <PlayCircle className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Create Stream</h3>
              <p className="text-dark-400 text-sm">Set up a new stream</p>
            </div>
          </div>
        </NavLink>

        <NavLink to="/fx-presets" className="card hover:bg-dark-700/50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">FX Presets</h3>
              <p className="text-dark-400 text-sm">{fxPresets.length} presets available</p>
            </div>
          </div>
        </NavLink>

        <NavLink to="/visualizers" className="card hover:bg-dark-700/50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-pink-500/20 rounded-xl">
              <Palette className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Visualizers</h3>
              <p className="text-dark-400 text-sm">{visualizers.length} visualizers</p>
            </div>
          </div>
        </NavLink>

        <NavLink to="/schedules" className="card hover:bg-dark-700/50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <Calendar className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Schedules</h3>
              <p className="text-dark-400 text-sm">{activeSchedules} active schedules</p>
            </div>
          </div>
        </NavLink>
      </div>

      {/* Recent Streams */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Recent Streams</h2>
          <NavLink to="/streams" className="text-sm text-primary-400 hover:text-primary-300">
            View all →
          </NavLink>
        </div>

        {recentStreams.length === 0 ? (
          <div className="text-center py-12">
            <Server className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-400 mb-4">No streams created yet</p>
            <NavLink to="/streams" className="btn-primary inline-flex">
              <PlayCircle className="w-4 h-4 mr-2" />
              Create your first stream
            </NavLink>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">Stream</th>
                  <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">Type</th>
                  <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">Platforms</th>
                  <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">Uptime</th>
                  <th className="text-right px-4 py-3 text-dark-400 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentStreams.map((stream) => (
                  <tr key={stream.id} className="border-b border-dark-700/50 hover:bg-dark-800/50">
                    <td className="px-4 py-3">
                      <NavLink to={`/streams/${stream.id}`} className="font-medium text-white hover:text-primary-400">
                        {stream.name}
                      </NavLink>
                      <p className="text-dark-400 text-sm">{stream.description || 'No description'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        stream.status === 'LIVE' ? 'bg-green-500/20 text-green-400' :
                        stream.status === 'STARTING' ? 'bg-yellow-500/20 text-yellow-400' :
                        stream.status === 'ERROR' ? 'bg-red-500/20 text-red-400' :
                        'bg-dark-600 text-dark-300'
                      }`}>
                        {stream.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark-300">
                      {stream.sourceType === 'VISUALIZER' ? '🎵 Visualizer' :
                       stream.sourceType === 'VIDEO_FILE' ? '📁 Video File' :
                       stream.sourceType === 'PLAYLIST' ? '📋 Playlist' :
                       stream.sourceType}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {stream.outputPlatforms.map((p) => (
                          <span key={p} className="badge-info text-xs">{p}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-dark-300 font-mono text-sm">
                      {stream.startedAt ? new Date(stream.startedAt).toLocaleTimeString() : '--:--:--'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <NavLink to={`/streams/${stream.id}`} className="btn-secondary text-sm">
                        View
                      </NavLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
