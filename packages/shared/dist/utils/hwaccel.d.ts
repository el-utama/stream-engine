export interface EncoderInfo {
    name: string;
    hwaccel: 'cuda' | 'qsv' | 'videotoolbox' | 'amf' | 'none';
    vendor: 'nvidia' | 'intel' | 'apple' | 'amd' | 'cpu';
    preset: string;
    available: boolean;
}
export declare function detectAvailableEncoders(): Promise<EncoderInfo[]>;
export declare function getBestEncoder(preferred?: 'nvenc' | 'qsv' | 'auto'): Promise<EncoderInfo>;
export declare function buildEncoderArgs(encoder: EncoderInfo, bitrate: number, fps: number): string[];
export declare function clearEncoderCache(): void;
//# sourceMappingURL=hwaccel.d.ts.map