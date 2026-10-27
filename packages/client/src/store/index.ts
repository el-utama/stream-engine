import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, YouTubeAccount, Stream, FxPreset, Visualizer, Schedule, StreamStatusResponse } from '../types';

interface AppState {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Accounts
  accounts: YouTubeAccount[];
  setAccounts: (accounts: YouTubeAccount[]) => void;
  addAccount: (account: YouTubeAccount) => void;
  removeAccount: (id: string) => void;
  
  // Streams
  streams: Stream[];
  setStreams: (streams: Stream[]) => void;
  addStream: (stream: Stream) => void;
  updateStream: (id: string, data: Partial<Stream>) => void;
  removeStream: (id: string) => void;
  setStreamStatus: (id: string, status: StreamStatusResponse) => void;
  
  // FX Presets
  fxPresets: FxPreset[];
  setFxPresets: (presets: FxPreset[]) => void;
  addFxPreset: (preset: FxPreset) => void;
  updateFxPreset: (id: string, data: Partial<FxPreset>) => void;
  removeFxPreset: (id: string) => void;
  
  // Visualizers
  visualizers: Visualizer[];
  setVisualizers: (visualizers: Visualizer[]) => void;
  addVisualizer: (visualizer: Visualizer) => void;
  updateVisualizer: (id: string, data: Partial<Visualizer>) => void;
  removeVisualizer: (id: string) => void;
  
  // Schedules
  schedules: Schedule[];
  setSchedules: (schedules: Schedule[]) => void;
  addSchedule: (schedule: Schedule) => void;
  updateSchedule: (id: string, data: Partial<Schedule>) => void;
  removeSchedule: (id: string) => void;
  
  // UI State
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      setUser: (user) => set({ user }),
      
      // Accounts
      accounts: [],
      setAccounts: (accounts) => set({ accounts }),
      addAccount: (account) => set((state) => ({ accounts: [...state.accounts, account] })),
      removeAccount: (id) => set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) })),
      
      // Streams
      streams: [],
      setStreams: (streams) => set({ streams }),
      addStream: (stream) => set((state) => ({ streams: [stream, ...state.streams] })),
      updateStream: (id, data) => set((state) => ({
        streams: state.streams.map((s) => s.id === id ? { ...s, ...data } : s)
      })),
      removeStream: (id) => set((state) => ({ streams: state.streams.filter((s) => s.id !== id) })),
      setStreamStatus: (id, status) => set((state) => ({
        streams: state.streams.map((s) => s.id === id ? { ...s, ...status } : s)
      })),
      
      // FX Presets
      fxPresets: [],
      setFxPresets: (fxPresets) => set({ fxPresets }),
      addFxPreset: (preset) => set((state) => ({ fxPresets: [preset, ...state.fxPresets] })),
      updateFxPreset: (id, data) => set((state) => ({
        fxPresets: state.fxPresets.map((p) => p.id === id ? { ...p, ...data } : p)
      })),
      removeFxPreset: (id) => set((state) => ({ fxPresets: state.fxPresets.filter((p) => p.id !== id) })),
      
      // Visualizers
      visualizers: [],
      setVisualizers: (visualizers) => set({ visualizers }),
      addVisualizer: (visualizer) => set((state) => ({ visualizers: [visualizer, ...state.visualizers] })),
      updateVisualizer: (id, data) => set((state) => ({
        visualizers: state.visualizers.map((v) => v.id === id ? { ...v, ...data } : v)
      })),
      removeVisualizer: (id) => set((state) => ({ visualizers: state.visualizers.filter((v) => v.id !== id) })),
      
      // Schedules
      schedules: [],
      setSchedules: (schedules) => set({ schedules }),
      addSchedule: (schedule) => set((state) => ({ schedules: [schedule, ...state.schedules] })),
      updateSchedule: (id, data) => set((state) => ({
        schedules: state.schedules.map((s) => s.id === id ? { ...s, ...data } : s)
      })),
      removeSchedule: (id) => set((state) => ({ schedules: state.schedules.filter((s) => s.id !== id) })),
      
      // UI State
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'stream-engine-store',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
