// Hardware Acceleration Detection

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface EncoderInfo {
  name: string;
  hwaccel: 'cuda' | 'qsv' | 'videotoolbox' | 'amf' | 'none';
  vendor: 'nvidia' | 'intel' | 'apple' | 'amd' | 'cpu';
  preset: string;
  available: boolean;
}

const ENCODER_PRIORITY: Omit<EncoderInfo, 'available'>[] = [
  { name: 'h264_nvenc', hwaccel: 'cuda', vendor: 'nvidia', preset: 'p4' },
  { name: 'h264_qsv', hwaccel: 'qsv', vendor: 'intel', preset: 'medium' },
  { name: 'h264_videotoolbox', hwaccel: 'videotoolbox', vendor: 'apple', preset: 'medium' },
  { name: 'h264_amf', hwaccel: 'amf', vendor: 'amd', preset: 'quality' },
  { name: 'libx264', hwaccel: 'none', vendor: 'cpu', preset: 'veryfast' },
];

let cachedEncoders: EncoderInfo[] | null = null;

export async function detectAvailableEncoders(): Promise<EncoderInfo[]> {
  if (cachedEncoders) return cachedEncoders;

  try {
    const { stdout } = await execFileAsync('ffmpeg', ['-hide_banner', '-encoders']);
    const availableEncoders = new Set(
      stdout.split('\n')
        .filter(line => line.includes('V.....'))
        .map(line => line.trim().split(/\s+/)[1])
    );

    cachedEncoders = ENCODER_PRIORITY.map(enc => ({
      ...enc,
      available: availableEncoders.has(enc.name),
    })).filter(enc => enc.available);

    return cachedEncoders;
  } catch {
    cachedEncoders = ENCODER_PRIORITY.filter(e => e.hwaccel === 'none').map(e => ({ ...e, available: true }));
    return cachedEncoders;
  }
}

export async function getBestEncoder(preferred?: 'nvenc' | 'qsv' | 'auto'): Promise<EncoderInfo> {
  const available = await detectAvailableEncoders();

  if (preferred && preferred !== 'auto') {
    const match = available.find(e => e.hwaccel === preferred);
    if (match) return match;
  }

  return available[0] || ENCODER_PRIORITY[ENCODER_PRIORITY.length - 1];
}

export function buildEncoderArgs(encoder: EncoderInfo, bitrate: number, fps: number): string[] {
  const args = ['-c:v', encoder.name];

  if (encoder.hwaccel !== 'none') {
    args.push('-hwaccel', encoder.hwaccel);
  }

  args.push(
    '-preset', encoder.preset,
    '-b:v', `${bitrate}k`,
    '-maxrate', `${bitrate}k`,
    '-bufsize', `${bitrate * 2}k`,
    '-g', String(fps * 2),
    '-keyint_min', String(fps),
    '-sc_threshold', '0',
    '-pix_fmt', 'yuv420p'
  );

  return args;
}

export function clearEncoderCache(): void {
  cachedEncoders = null;
}