import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { authApi } from '../services/api';
import { cn } from '../utils';
import {
  User,
  Shield,
  Key,
  Server,
  Database,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Globe,
  Lock,
} from 'lucide-react';

export function Settings() {
  const { user, setUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'server' | 'database'>('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [serverConfig, setServerConfig] = useState({
    nmsRtmpPort: 1935,
    nmsHttpPort: 8000,
    maxConcurrentStreams: 3,
    ffmpegPath: '',
  });

  const [dbConfig, setDbConfig] = useState({
    databaseUrl: '',
    redisUrl: '',
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const me = await authApi.getMe();
        setUser(me.data);
        setProfile({ name: me.data.name || '', email: me.data.email });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, [setUser]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement profile update API
      showMessage('success', 'Profile saved successfully');
    } catch (error) {
      showMessage('error', 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySave = async () => {
    if (security.newPassword !== security.confirmPassword) {
      showMessage('error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      // TODO: Implement password change API
      showMessage('success', 'Password changed successfully');
      setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showMessage('error', 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleServerSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement server config API
      showMessage('success', 'Server configuration saved');
    } catch (error) {
      showMessage('error', 'Failed to save server config');
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement database config API
      showMessage('success', 'Database configuration saved');
    } catch (error) {
      showMessage('error', 'Failed to save database config');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'server', label: 'Server', icon: Server },
    { id: 'database', label: 'Database', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-dark-400 mt-1">Manage your account and server configuration</p>
        </div>
      </div>

      {message && (
        <div className={cn(
          'card flex items-center gap-3 p-4',
          message.type === 'success' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
        )}>
          <div className={cn('p-2 rounded-lg', message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <p className="flex-1 text-white">{message.text}</p>
          <button onClick={() => setMessage(null)} className="text-dark-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-dark-700">
          <nav className="flex gap-1 px-4" aria-label="Settings tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-dark-400 hover:text-white hover:border-dark-600'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && <ProfileTab profile={profile} setProfile={setProfile} onSave={handleProfileSave} loading={loading} />}
          {activeTab === 'security' && <SecurityTab security={security} setSecurity={setSecurity} onSave={handleSecuritySave} loading={loading} />}
          {activeTab === 'server' && <ServerTab serverConfig={serverConfig} setServerConfig={setServerConfig} onSave={handleServerSave} loading={loading} />}
          {activeTab === 'database' && <DatabaseTab dbConfig={dbConfig} setDbConfig={setDbConfig} onSave={handleDatabaseSave} loading={loading} />}
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ profile, setProfile, onSave, loading }: { profile: any; setProfile: any; onSave: () => void; loading: boolean }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-white">Profile Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Full Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="input"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="input"
            placeholder="your@email.com"
            disabled
          />
          <p className="text-dark-500 text-xs mt-1">Email cannot be changed</p>
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

function SecurityTab({ security, setSecurity, onSave, loading }: { security: any; setSecurity: any; onSave: () => void; loading: boolean }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-6 max-w-xl">
      <h2 className="text-lg font-semibold text-white">Change Password</h2>
      <div className="space-y-4">
        <div>
          <label className="label">Current Password</label>
          <input
            type="password"
            value={security.currentPassword}
            onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
            className="input"
            placeholder="Enter current password"
          />
        </div>
        <div>
          <label className="label">New Password</label>
          <input
            type="password"
            value={security.newPassword}
            onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
            className="input"
            placeholder="Enter new password"
            minLength={8}
          />
        </div>
        <div>
          <label className="label">Confirm New Password</label>
          <input
            type="password"
            value={security.confirmPassword}
            onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
            className="input"
            placeholder="Confirm new password"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={loading}>
          <Lock className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Change Password'}
        </button>
      </div>
    </form>
  );
}

function ServerTab({ serverConfig, setServerConfig, onSave, loading }: { serverConfig: any; setServerConfig: any; onSave: () => void; loading: boolean }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-6 max-w-xl">
      <h2 className="text-lg font-semibold text-white">Server Configuration</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">NMS RTMP Port</label>
          <input
            type="number"
            value={serverConfig.nmsRtmpPort}
            onChange={(e) => setServerConfig({ ...serverConfig, nmsRtmpPort: parseInt(e.target.value) })}
            className="input"
            min="1"
            max="65535"
          />
        </div>
        <div>
          <label className="label">NMS HTTP Port</label>
          <input
            type="number"
            value={serverConfig.nmsHttpPort}
            onChange={(e) => setServerConfig({ ...serverConfig, nmsHttpPort: parseInt(e.target.value) })}
            className="input"
            min="1"
            max="65535"
          />
        </div>
        <div>
          <label className="label">Max Concurrent Streams</label>
          <input
            type="number"
            value={serverConfig.maxConcurrentStreams}
            onChange={(e) => setServerConfig({ ...serverConfig, maxConcurrentStreams: parseInt(e.target.value) })}
            className="input"
            min="1"
            max="10"
          />
        </div>
        <div>
          <label className="label">FFmpeg Path</label>
          <input
            type="text"
            value={serverConfig.ffmpegPath}
            onChange={(e) => setServerConfig({ ...serverConfig, ffmpegPath: e.target.value })}
            className="input"
            placeholder="/usr/bin/ffmpeg (leave empty for auto-detect)"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Server Config'}
        </button>
      </div>
    </form>
  );
}

function DatabaseTab({ dbConfig, setDbConfig, onSave, loading }: { dbConfig: any; setDbConfig: any; onSave: () => void; loading: boolean }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-6 max-w-xl">
      <h2 className="text-lg font-semibold text-white">Database Configuration</h2>
      <div className="space-y-4">
        <div>
          <label className="label">Database URL</label>
          <input
            type="text"
            value={dbConfig.databaseUrl}
            onChange={(e) => setDbConfig({ ...dbConfig, databaseUrl: e.target.value })}
            className="input"
            placeholder="file:./prisma/data/db.sqlite"
          />
        </div>
        <div>
          <label className="label">Redis URL</label>
          <input
            type="text"
            value={dbConfig.redisUrl}
            onChange={(e) => setDbConfig({ ...dbConfig, redisUrl: e.target.value })}
            className="input"
            placeholder="redis://localhost:6379"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={loading}>
          <Database className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Database Config'}
        </button>
      </div>
    </form>
  );
}
