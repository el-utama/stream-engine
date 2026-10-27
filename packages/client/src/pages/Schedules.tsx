import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { schedulesApi } from '../services/api';
import { cn, formatDate } from '../utils';
import {
  Plus,
  Play,
  Search,
  Filter,
  Loader2,
  Trash2,
  Edit,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Schedule } from '../types';

export function Schedules() {
  const { schedules, setSchedules, addSchedule, updateSchedule, removeSchedule } = useAppStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [creating, setCreating] = useState(false);
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);

  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const [schedulesRes, statusRes] = await Promise.all([
          schedulesApi.list(),
          schedulesApi.getStatus(),
        ]);
        setSchedules(schedulesRes.data);
        setSchedulerStatus(statusRes.data);
      } catch (error) {
        console.error('Failed to load schedules:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSchedules();
  }, [setSchedules]);

  const handleCreate = async (data: Partial<Schedule>) => {
    setCreating(true);
    try {
      const res = await schedulesApi.create(data);
      navigate(`/schedules/${res.data.id}`);
    } catch (error) {
      console.error('Failed to create schedule:', error);
      alert('Failed to create schedule');
    } finally {
      setCreating(false);
      setShowCreateModal(false);
    }
  };

  const handleUpdate = async (id: string, data: Partial<Schedule>) => {
    setCreating(true);
    try {
      await schedulesApi.update(id, data);
      setEditingSchedule(null);
    } catch (error) {
      console.error('Failed to update schedule:', error);
      alert('Failed to update schedule');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await schedulesApi.toggle(id);
      updateSchedule(id, { isActive: !isActive });
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
      alert('Failed to toggle schedule');
    }
  };

  const handleRun = async (id: string) => {
    if (!confirm('Run this schedule now?')) return;
    try {
      await schedulesApi.run(id);
      alert('Schedule triggered successfully');
    } catch (error) {
      console.error('Failed to run schedule:', error);
      alert('Failed to run schedule');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await schedulesApi.delete(id);
      removeSchedule(id);
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete schedule');
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Schedules</h1>
          <p className="text-dark-400 mt-1">Automate your streams with cron scheduling</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCreateModal(true)} className="btn-primary" disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            Create Schedule
          </button>
        </div>
      </div>

      {/* Scheduler Status */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-400" />
            Scheduler Status
          </h2>
          <span className={cn(
            'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
            schedulerStatus?.running ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          )}>
            {schedulerStatus?.running ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Running
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3" />
                Stopped
              </>
            )}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-dark-400">Queued Jobs</dt>
            <dd className="text-white font-medium">{schedulerStatus?.scheduledJobs || 0}</dd>
          </div>
          <div>
            <dt className="text-dark-400">Running Jobs</dt>
            <dd className="text-white font-medium">{schedulerStatus?.runningJobs || 0}</dd>
          </div>
          <div>
            <dt className="text-dark-400">Completed</dt>
            <dd className="text-white font-medium">{schedulerStatus?.completedJobs || 0}</dd>
          </div>
          <div>
            <dt className="text-dark-400">Failed</dt>
            <dd className="text-white font-medium">{schedulerStatus?.failedJobs || 0}</dd>
          </div>
        </div>
      </div>

      {/* Schedules List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No schedules created</h3>
            <p className="text-dark-400 mb-4">Create a schedule to automate your streams</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary inline-flex">
              <Plus className="w-4 h-4 mr-2" />
              Create Schedule
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">Schedule</th>
                  <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">Cron Expression</th>
                  <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">Timezone</th>
                  <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">Stream</th>
                  <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">Max Duration</th>
                  <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">Next Run</th>
                  <th className="text-right px-4 py-3 text-dark-400 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="border-b border-dark-700/50 hover:bg-dark-800/50">
                    <td className="px-4 py-3">
                      <NavLink to={`/schedules/${schedule.id}`} className="font-medium text-white hover:text-primary-400">
                        {schedule.name}
                      </NavLink>
                    </td>
                    <td className="px-4 py-3 text-dark-300 font-mono text-sm">{schedule.cronExpression}</td>
                    <td className="px-4 py-3 text-dark-300">{schedule.timezone}</td>
                    <td className="px-4 py-3 text-dark-300">
                      {schedule.stream?.name || schedule.streamId || 'Not assigned'}
                    </td>
                    <td className="px-4 py-3 text-dark-300">
                      {schedule.maxDuration ? `${schedule.maxDuration}h` : 'Unlimited'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(schedule.id, schedule.isActive)}
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                          schedule.isActive
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        )}
                      >
                        {schedule.isActive ? (
                          <>
                            <ToggleLeft className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <ToggleRight className="w-3 h-3" />
                            Paused
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-dark-300 text-sm">
                      {schedule.nextRunAt ? formatDate(schedule.nextRunAt) : 'Not scheduled'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleRun(schedule.id)} className="btn-primary text-sm" title="Run Now">
                          <Play className="w-4 h-4 mr-1" />
                          Run
                        </button>
                        <button onClick={() => handleEdit(schedule)} className="btn-secondary text-sm" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(schedule.id)} className="btn-ghost text-red-400 hover:bg-red-500/10 text-sm" title="Delete">
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

      {/* Create/Edit Modal */}
      {(showCreateModal || editingSchedule) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-dark-900 border border-dark-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <ScheduleModal
              schedule={editingSchedule}
              onClose={() => {
                setShowCreateModal(false);
                setEditingSchedule(null);
              }}
              onSubmit={editingSchedule ? handleUpdate : handleCreate}
              creating={creating}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleModal({
  schedule,
  onClose,
  onSubmit,
  creating,
}: { schedule: Schedule | null; onClose: () => void; onSubmit: (data: Partial<Schedule>) => void; creating: boolean }) {
  const [formData, setFormData] = useState<Partial<Schedule>>({
    name: schedule?.name || '',
    cronExpression: schedule?.cronExpression || '0 8 * * *',
    timezone: schedule?.timezone || 'UTC',
    startDate: schedule?.startDate ? schedule.startDate.split('T')[0] : '',
    endDate: schedule?.endDate ? schedule.endDate.split('T')[0] : '',
    maxDuration: schedule?.maxDuration || '',
    isActive: schedule?.isActive ?? true,
    streamId: schedule?.streamId || '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (submitData.maxDuration === '') delete submitData.maxDuration;
    if (submitData.startDate === '') delete submitData.startDate;
    if (submitData.endDate === '') delete submitData.endDate;
    if (submitData.streamId === '') delete submitData.streamId;
    onSubmit(schedule?.id || '', submitData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (submitData.maxDuration === '') delete submitData.maxDuration;
    if (submitData.startDate === '') delete submitData.startDate;
    if (submitData.endDate === '') delete submitData.endDate;
    if (submitData.streamId === '') delete submitData.streamId;
    onSubmit(schedule?.id || '', submitData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">{schedule ? 'Edit Schedule' : 'Create Schedule'}</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-800 text-dark-400">
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="label">Schedule Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="input"
            placeholder="Daily 8AM Music Stream"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Cron Expression *</label>
            <input
              type="text"
              value={formData.cronExpression}
              onChange={(e) => handleChange('cronExpression', e.target.value)}
              className="input font-mono"
              placeholder="0 8 * * *"
              required
            />
            <p className="text-dark-500 text-xs mt-1">e.g., "0 8 * * *" = Daily at 8:00 AM</p>
          </div>

          <div>
            <label className="label">Timezone</label>
            <select value={formData.timezone} onChange={(e) => handleChange('timezone', e.target.value)} className="input">
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern (EST/EDT)</option>
              <option value="America/Chicago">Central (CST/CDT)</option>
              <option value="America/Denver">Mountain (MST/MDT)</option>
              <option value="America/Los_Angeles">Pacific (PST/PDT)</option>
              <option value="Europe/London">London (GMT/BST)</option>
              <option value="Europe/Paris">Paris (CET/CEST)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Asia/Shanghai">Shanghai (CST)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Start Date (optional)</label>
            <input type="date" value={formData.startDate} onChange={(e) => handleChange('startDate', e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">End Date (optional)</label>
            <input type="date" value={formData.endDate} onChange={(e) => handleChange('endDate', e.target.value)} className="input" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Max Duration (hours, optional)</label>
            <input
              type="number"
              value={formData.maxDuration}
              onChange={(e) => handleChange('maxDuration', e.target.value)}
              className="input"
              placeholder="4"
              min="1"
              max="168"
            />
          </div>
          <div>
            <label className="label">Stream to Run</label>
            <select value={formData.streamId} onChange={(e) => handleChange('streamId', e.target.value)} className="input">
              <option value="">Select a stream...</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            className="w-4 h-4 rounded border-dark-600 text-primary-500 focus:ring-primary-500"
          />
          <label htmlFor="isActive" className="text-white text-sm">Active</label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
        <button type="button" onClick={onClose} className="btn-secondary" disabled={creating}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={creating}>
          {creating ? 'Saving...' : (schedule ? 'Save Changes' : 'Create Schedule')}
        </button>
      </div>
    </form>
  );
}
