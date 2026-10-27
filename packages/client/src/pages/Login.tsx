import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAppStore } from '../store';
import { Monitor, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const { setUser } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.getGoogleUrl();
      window.location.href = res.data.url;
    } catch (err) {
      setError('Failed to initiate Google login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/20 mb-4">
            <Monitor className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Stream Engine</h1>
          <p className="text-dark-400">Sign in with Google to continue</p>
        </div>

        <div className="card space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full btn-primary py-4 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                <Globe className="w-5 h-5 mr-2" />
                Continue with Google
              </>
            )}
          </button>
        </div>

        <div className="text-center text-dark-500 text-sm">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}
