import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { cn } from '../utils';
import {
  LayoutDashboard,
  Users,
  PlayCircle,
  Zap,
  BarChart2,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  User,
  Globe,
  Monitor,
  Palette,
  Clock,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Accounts', href: '/accounts', icon: Users },
  { name: 'Streams', href: '/streams', icon: PlayCircle },
  { name: 'FX Presets', href: '/fx-presets', icon: Zap },
  { name: 'Visualizers', href: '/visualizers', icon: Palette },
  { name: 'Schedules', href: '/schedules', icon: Calendar },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, user } = useAppStore();
  const location = useLocation();

  if (!sidebarOpen) return null;

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-dark-900/95 border-r border-dark-700 backdrop-blur-sm transition-transform duration-300">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-dark-700">
          <NavLink to="/" className="flex items-center gap-2 text-white font-bold text-lg">
            <Monitor className="w-6 h-6 text-primary-500" />
            <span>Stream Engine</span>
          </NavLink>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-dark-800 text-dark-400"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                )
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-dark-700">
          {user ? (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name || user.email}</p>
                <p className="text-xs text-dark-400 truncate">{user.email}</p>
              </div>
            </div>
          ) : (
            <NavLink
              to="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-dark-300 hover:bg-dark-800 hover:text-white"
            >
              <Settings className="w-5 h-5" />
              Settings
            </NavLink>
          )}
        </div>
      </div>
    </aside>
  );
}

export function Header() {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const location = useLocation();

  return (
    <header className={cn('fixed top-0 right-0 left-0 z-40 h-16 bg-dark-950/80 backdrop-blur-sm border-b border-dark-700 transition-all duration-300', sidebarOpen ? 'lg:left-64' : 'left-0')}>
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-dark-800 text-dark-400"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-white hidden sm:block">
            {location.pathname === '/' ? 'Dashboard' : location.pathname.split('/')[1]?.charAt(0).toUpperCase() + location.pathname.split('/')[1]?.slice(1)}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-dark-800 rounded-lg text-sm text-dark-400">
            <Globe className="w-4 h-4" />
            <span id="current-time" className="font-mono tabular-nums">00:00:00</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export function Layout() {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-dark-950">
      <Sidebar />
      <Header />
      <main className={cn('pt-16 min-h-screen transition-all duration-300', sidebarOpen ? 'lg:pl-64' : 'lg:pl-0')}>
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
