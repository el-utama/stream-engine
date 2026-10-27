import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}

export function formatBitrate(kbps: number): string {
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`;
  return `${kbps} kbps`;
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString();
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'LIVE': return 'text-green-400 bg-green-500/20';
    case 'STARTING': return 'text-yellow-400 bg-yellow-500/20';
    case 'ERROR': return 'text-red-400 bg-red-500/20';
    case 'RECONNECTING': return 'text-blue-400 bg-blue-500/20';
    case 'STOPPED': return 'text-dark-400 bg-dark-600';
    default: return 'text-dark-400 bg-dark-600';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'LIVE': return '🟢 LIVE';
    case 'STARTING': return '🟡 STARTING';
    case 'ERROR': return '🔴 ERROR';
    case 'RECONNECTING': return '🔵 RECONNECTING';
    case 'STOPPED': return '⚫ STOPPED';
    default: return status;
  }
}

export function getPlatformIcon(platform: string): string {
  switch (platform) {
    case 'YOUTUBE': return '📺';
    case 'TWITCH': return '🟣';
    case 'FACEBOOK': return '📘';
    case 'CUSTOM_RTMP': return '🔗';
    default: return '📡';
  }
}

export function getSourceTypeLabel(type: string): string {
  switch (type) {
    case 'VIDEO_FILE': return '📁 Video Files';
    case 'PLAYLIST': return '📋 Playlist';
    case 'RTMP_PUSH': return '📤 RTMP Push (OBS)';
    case 'WEBCAM': return '📷 Webcam';
    case 'VISUALIZER': return '🎵 Visualizer Only';
    default: return type;
  }
}

export function getIntensityColor(intensity: string): string {
  switch (intensity) {
    case 'LOW': return 'text-green-400 bg-green-500/20';
    case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/20';
    case 'HIGH': return 'text-orange-400 bg-orange-500/20';
    case 'AGGRESSIVE': return 'text-red-400 bg-red-500/20';
    default: return 'text-dark-400 bg-dark-600';
  }
}

export function getIntensityLabel(intensity: string): string {
  switch (intensity) {
    case 'LOW': return 'Low (Subtle)';
    case 'MEDIUM': return 'Medium (Balanced)';
    case 'HIGH': return 'High (Strong)';
    case 'AGGRESSIVE': return 'Aggressive (Maximum)';
    default: return intensity;
  }
}

export const BUILTIN_FX_PRESETS = [
  { id: 'builtin-soft', name: 'Soft', intensity: 'LOW', description: 'Minimal processing for archival quality' },
  { id: 'builtin-balanced', name: 'Balanced', intensity: 'MEDIUM', description: 'General purpose daily driver' },
  { id: 'builtin-aggressive', name: 'Aggressive', intensity: 'HIGH', description: 'Maximum anti-ghosting' },
  { id: 'builtin-cid_aware', name: 'CID Aware', intensity: 'MEDIUM', description: 'Content ID evasion (moderate)' },
  { id: 'builtin-cid_aggressive', name: 'CID Aggressive', intensity: 'HIGH', description: 'Maximum CID evasion' },
  { id: 'builtin-music_stream', name: 'Music Stream', intensity: 'MEDIUM', description: 'Audio-reactive with visualizer' },
  { id: 'builtin-gaming', name: 'Gaming', intensity: 'MEDIUM', description: 'High motion content (FPS, battle royale)' },
];

export const BUILTIN_VISUALIZERS = [
  { id: 'builtin-spectrumBars', name: 'Spectrum Bars', type: 'SPECTRUM_BARS' },
  { id: 'builtin-waveform', name: 'Waveform', type: 'WAVEFORM' },
  { id: 'builtin-circular', name: 'Circular', type: 'CIRCULAR' },
  { id: 'builtin-dualView', name: 'Dual View', type: 'DUAL_VIEW' },
  { id: 'builtin-minimal', name: 'Minimal', type: 'MINIMAL' },
];
