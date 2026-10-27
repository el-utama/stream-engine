import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useAppStore } from './store';
import { authApi } from './services/api';
import { useEffect } from 'react';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Accounts } from './pages/Accounts';
import { Streams } from './pages/Streams';
import { StreamDetail } from './pages/StreamDetail';
import { FxPresets } from './pages/FxPresets';
import { FxPresetDetail } from './pages/FxPresetDetail';
import { Visualizers } from './pages/Visualizers';
import { Schedules } from './pages/Schedules';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';

function App() {
  const { user, setUser } = useAppStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await authApi.getMe();
        setUser(response.data);
      } catch {
        setUser(null);
      }
    };
    initAuth();
  }, [setUser]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="streams" element={<Streams />} />
        <Route path="streams/:id" element={<StreamDetail />} />
        <Route path="fx-presets" element={<FxPresets />} />
        <Route path="fx-presets/:id" element={<FxPresetDetail />} />
        <Route path="visualizers" element={<Visualizers />} />
        <Route path="schedules" element={<Schedules />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
