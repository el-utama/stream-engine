import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { authApi } from '../services/api';
import { cn } from '../utils';
import { Plus, LogOut, Youtube, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function Accounts() {
  const { accounts, setAccounts, removeAccount } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await authApi.getAccounts();
        setAccounts(res.data);
      } catch (error) {
        console.error('Failed to load accounts:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAccounts();
  }, [setAccounts]);

  const handleConnect = async () => {
    try {
      const res = await authApi.getGoogleUrl();
      setOauthUrl(res.data.url);
      window.location.href = res.data.url;
    } catch (error) {
      console.error('Failed to start OAuth:', error);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this YouTube account?')) return;
    try {
      await authApi.disconnectAccount(id);
      removeAccount(id);
    } catch (error) {
      console.error('Failed to disconnect account:', error);
      alert('Failed to disconnect account');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">YouTube Accounts</h1>
          <p className="text-dark-400 mt-1">Connect your YouTube channels for streaming</p>
        </div>
        <button onClick={handleConnect} className="btn-primary" disabled={loading}>
          <Plus className="w-4 h-4 mr-2" />
          Connect Account
        </button>
      </div>

      {oauthUrl && (
        <div className="card bg-blue-500/10 border-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Youtube className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">OAuth URL Generated</p>
              <p className="text-dark-400 text-sm">Redirecting to YouTube for authorization...</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="card text-center py-12">
          <Youtube className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No accounts connected</h3>
          <p className="text-dark-400 mb-4">Connect a YouTube account to start streaming</p>
          <button onClick={handleConnect} className="btn-primary inline-flex" disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            Connect Account
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">Channel</th>
                <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">Handle</th>
                <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">Channel ID</th>
                <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">Status</th>
                <th className="text-left px-4 py-3 text-dark-400 text-sm font-medium">Connected</th>
                <th className="text-right px-4 py-3 text-dark-400 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b border-dark-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {account.avatarUrl ? (
                        <img src={account.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                          <Youtube className="w-5 h-5 text-primary-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white">{account.channelName}</p>
                        <p className="text-dark-400 text-sm">{account.channelId}</p>
                      </div>
                    </div>
                    </td>
                    <td className="px-4 py-3 text-dark-300">
                      @{account.channelHandle || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-sm font-mono">
                      {account.channelId}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                        account.isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      )}>
                        {account.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-sm">
                      {new Date(account.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDisconnect(account.id)}
                        className="btn-danger text-sm"
                        disabled={loading}
                      >
                        <LogOut className="w-4 h-4 mr-1" />
                        Disconnect
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
