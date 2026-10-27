import axios from 'axios';
import type { Stream, FxPreset, Visualizer, Schedule, YouTubeAccount, User, StreamStatusResponse, VmafTestResult } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth
export const authApi = {
  getGoogleUrl: () => api.get('/auth/google/url'),
  getMe: () => api.get<User>('/auth/me'),
  getAccounts: () => api.get<YouTubeAccount[]>('/auth/youtube/accounts'),
  disconnectAccount: (id: string) => api.delete(`/auth/youtube/accounts/${id}`),
};

// Streams
export const streamsApi = {
  list: () => api.get<Stream[]>('/streams'),
  get: (id: string) => api.get<Stream>(`/streams/${id}`),
  create: (data: Partial<Stream>) => api.post<{ id: string }>('/streams', data),
  update: (id: string, data: Partial<Stream>) => api.patch(`/streams/${id}`, data),
  delete: (id: string) => api.delete(`/streams/${id}`),
  start: (id: string) => api.post<{ success: boolean; rtmpTargets: any[] }>(`/streams/${id}/start`),
  stop: (id: string) => api.post(`/streams/${id}/stop`),
  restart: (id: string) => api.post(`/streams/${id}/restart`),
  getStatus: (id: string) => api.get<StreamStatusResponse>(`/streams/${id}/status`),
};

// FX Presets
export const fxPresetsApi = {
  list: (includeBuiltIn = true) => api.get<FxPreset[]>(`/fx-presets?includeBuiltIn=${includeBuiltIn}`),
  get: (id: string) => api.get<FxPreset>(`/fx-presets/${id}`),
  create: (data: Partial<FxPreset>) => api.post<{ id: string }>('/fx-presets', data),
  update: (id: string, data: Partial<FxPreset>) => api.patch(`/fx-presets/${id}`, data),
  delete: (id: string) => api.delete(`/fx-presets/${id}`),
  test: (id: string, sampleFile?: string, runVmaf?: boolean) =>
    api.post<VmafTestResult>(`/fx-presets/${id}/test`, { sampleFile, runVmaf }),
  testVmaf: (id: string, sampleFile?: string) =>
    api.post<VmafTestResult>(`/fx-presets/${id}/test-vmaf`, { sampleFile }),
  compare: (id1: string, id2: string) =>
    api.get(`/fx-presets/${id1}/diff/${id2}`),
  duplicate: (id: string, newName?: string) =>
    api.post<{ id: string }>(`/fx-presets/${id}/duplicate`, { newName }),
  export: (id: string) => api.get(`/fx-presets/${id}/export`),
  import: (data: { filterGraph?: string; metadata: any }) =>
    api.post<{ id: string }>('/fx-presets/import', data),
};

// Visualizers
export const visualizersApi = {
  list: (includeBuiltIn = true) => api.get<Visualizer[]>(`/visualizers?includeBuiltIn=${includeBuiltIn}`),
  get: (id: string) => api.get<Visualizer>(`/visualizers/${id}`),
  create: (data: Partial<Visualizer>) => api.post<{ id: string }>('/visualizers', data),
  update: (id: string, data: Partial<Visualizer>) => api.patch(`/visualizers/${id}`, data),
  delete: (id: string) => api.delete(`/visualizers/${id}`),
  preview: (id: string, duration = 10, format: 'mp4' | 'gif' = 'mp4') =>
    api.get(`/visualizers/${id}/preview`, {
      params: { duration, format },
      responseType: 'blob',
    }),
};

// Schedules
export const schedulesApi = {
  list: () => api.get<Schedule[]>('/schedules'),
  get: (id: string) => api.get<Schedule>(`/schedules/${id}`),
  create: (data: Partial<Schedule>) => api.post<{ id: string }>('/schedules', data),
  update: (id: string, data: Partial<Schedule>) => api.patch(`/schedules/${id}`, data),
  delete: (id: string) => api.delete(`/schedules/${id}`),
  toggle: (id: string) => api.post(`/schedules/${id}/toggle`),
  run: (id: string) => api.post(`/schedules/${id}/run`),
  getStatus: () => api.get('/schedules/status'),
};

export default api;
