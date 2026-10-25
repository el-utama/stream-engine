// Filter Graph Builder - Fluent API for FFmpeg filter_complex
export class FilterGraphBuilder {
    videoFilters = [];
    audioFilters = [];
    inputIndex = 0;
    // Video Filters
    crop(percent, randomize = true) {
        const p = percent / 100;
        const x = randomize ? `iw*${p}*random(0)` : `iw*${p}`;
        const y = randomize ? `ih*${p}*random(0)` : `ih*${p}`;
        this.videoFilters.push(`crop=iw*(1-${2 * p}):ih*(1-${2 * p}):${x}:${y}`);
        return this;
    }
    rotate(degrees, randomize = true) {
        const rad = degrees * Math.PI / 180;
        const val = randomize ? `${rad}*random(0)` : `${rad}`;
        this.videoFilters.push(`rotate=${val}`);
        return this;
    }
    flip(horizontal, vertical) {
        const h = horizontal ? 'hflip,' : '';
        const v = vertical ? 'vflip,' : '';
        if (h || v)
            this.videoFilters.push(`${h}${v}`.replace(/,$/, ''));
        return this;
    }
    colorJitter(brightness, contrast, saturation, gamma, hue) {
        this.videoFilters.push(`eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturation}:gamma=${gamma}:hue=${hue}`);
        return this;
    }
    noise(type, strength, temporal) {
        const mode = temporal ? 't' : 'u';
        this.videoFilters.push(`noisealls=${strength}:allf=${mode}`);
        return this;
    }
    frameJitter(dropRate, blendRate) {
        // Proper frame jitter: randomly drop frames and blend adjacent frames
        // Using select filter for frame dropping and tblend for blending
        const keepProb = 1 - dropRate;
        const blendExpr = blendRate > 0
            ? `tblend=all_mode=average:all_opacity=${blendRate}`
            : '';
        // Build frame selection: keep frames with probability (1-dropRate)
        // Then optionally blend adjacent frames
        if (blendRate > 0) {
            this.videoFilters.push(`select='gt(random(0),${dropRate})',${blendExpr}`);
        }
        else {
            this.videoFilters.push(`select='gt(random(0),${dropRate})'`);
        }
        return this;
    }
    speed(factor, pitchCorrection) {
        const atempo = pitchCorrection ? `atempo=${factor},` : '';
        this.videoFilters.push(`setpts=${1 / factor}*PTS`);
        this.audioFilters.push(`${atempo}atempo=${factor}`);
        return this;
    }
    // Watermark filter for invisible watermarking
    watermark(payload, strength = 0.1) {
        // Convert payload to binary pattern and embed as subtle noise pattern
        // Using drawtext with invisible color + noise pattern
        const hash = Buffer.from(payload).toString('base64');
        const numericHash = hash.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100;
        // Embed watermark as subtle luminance variation in noise
        this.videoFilters.push(`geq=lum='p(X,Y)+${strength}*sin(2*PI*X/w)*sin(2*PI*Y/h)*${numericHash / 100}'`);
        return this;
    }
    // Audio Filters
    noiseOverlay(type, amplitude, mixDb) {
        const noiseSrc = `anoisesrc=c=${type}:a=${amplitude}[noise]`;
        this.audioFilters.push(`${noiseSrc};[0:a][noise]amix=inputs=2:weights=1 ${mixDb}[aout]`);
        return this;
    }
    loudnorm(target, jitter) {
        const actualTarget = target + (Math.random() - 0.5) * jitter * 2;
        this.audioFilters.push(`loudnorm=I=${actualTarget}:TP=-1.5:LRA=11:print_format=summary`);
        return this;
    }
    pitchShift(semitones) {
        this.audioFilters.push(`rubberband=pitch=${semitones}`);
        return this;
    }
    tempo(factor) {
        this.audioFilters.push(`atempo=${factor}`);
        return this;
    }
    compand(attack, release, threshold, ratio) {
        this.audioFilters.push(`compand=attacks=${attack}:decays=${release}:points=-90/-90|-${threshold}/-${threshold * ratio}|0/0`);
        return this;
    }
    reverb(roomSize, damping, wetLevel) {
        this.audioFilters.push(`aecho=0.8:0.9:${roomSize * 1000}:${wetLevel}`);
        return this;
    }
    spectralSmear(intensity) {
        this.audioFilters.push(`afftdn=nr=${intensity * 20}:nf=-50`);
        return this;
    }
    // Build complete filter_complex
    build() {
        const parts = [];
        // Video chain
        if (this.videoFilters.length > 0) {
            let chain = '[0:v]';
            for (const filter of this.videoFilters) {
                chain += filter;
            }
            chain += '[vout]';
            parts.push(chain);
        }
        // Audio chain
        if (this.audioFilters.length > 0) {
            let chain = '[0:a]';
            for (const filter of this.audioFilters) {
                chain += filter;
            }
            chain += '[aout]';
            parts.push(chain);
        }
        return parts.join(';');
    }
    // Build playlist with crossfade - proper input mapping for multiple files
    static buildPlaylistCrossfade(videoCount, crossfadeSec, durations) {
        const videoParts = [];
        const audioParts = [];
        let currentOffset = 0;
        // Build video crossfade chain with proper input references
        for (let i = 0; i < videoCount - 1; i++) {
            const inputA = i === 0 ? '[0:v]' : `[v${i - 1}${i}]`;
            const inputB = `[${i + 1}:v]`;
            const output = `[v${i}${i + 1}]`;
            videoParts.push(`${inputA}${inputB}xfade=transition=fade:duration=${crossfadeSec}:offset=${currentOffset}${output}`);
            currentOffset += durations[i] - crossfadeSec;
        }
        currentOffset = 0;
        for (let i = 0; i < videoCount - 1; i++) {
            const inputA = i === 0 ? '[0:a]' : `[a${i - 1}${i}]`;
            const inputB = `[${i + 1}:a]`;
            const output = `[a${i}${i + 1}]`;
            audioParts.push(`${inputA}${inputB}acrossfade=d=${crossfadeSec}${output}`);
            currentOffset += durations[i] - crossfadeSec;
        }
        // Add final loop for infinite playback
        const finalVideo = videoCount > 1 ? `[v${videoCount - 2}${videoCount - 1}]` : '[0:v]';
        const finalAudio = videoCount > 1 ? `[a${videoCount - 2}${videoCount - 1}]` : '[0:a]';
        videoParts.push(`${finalVideo}loop=loop=-1:size=1000000[vlooped]`);
        audioParts.push(`${finalAudio}aloop=loop=-1:size=44100000[alooped]`);
        return [...videoParts, ...audioParts].join(';');
    }
    // Build filter graph for multi-input playlist (each video as separate input)
    static buildMultiInputPlaylist(videoCount, crossfadeSec, durations) {
        const inputArgs = [];
        const videoParts = [];
        const audioParts = [];
        let currentOffset = 0;
        // Build video crossfade chain with proper input references
        for (let i = 0; i < videoCount - 1; i++) {
            const inputA = i === 0 ? '[0:v]' : `[v${i - 1}${i}]`;
            const inputB = `[${i + 1}:v]`;
            const output = `[v${i}${i + 1}]`;
            videoParts.push(`${inputA}${inputB}xfade=transition=fade:duration=${crossfadeSec}:offset=${currentOffset}${output}`);
            currentOffset += durations[i] - crossfadeSec;
        }
        currentOffset = 0;
        for (let i = 0; i < videoCount - 1; i++) {
            const inputA = i === 0 ? '[0:a]' : `[a${i - 1}${i}]`;
            const inputB = `[${i + 1}:a]`;
            const output = `[a${i}${i + 1}]`;
            audioParts.push(`${inputA}${inputB}acrossfade=d=${crossfadeSec}${output}`);
            currentOffset += durations[i] - crossfadeSec;
        }
        // Add final loop for infinite playback
        const finalVideo = videoCount > 1 ? `[v${videoCount - 2}${videoCount - 1}]` : '[0:v]';
        const finalAudio = videoCount > 1 ? `[a${videoCount - 2}${videoCount - 1}]` : '[0:a]';
        videoParts.push(`${finalVideo}loop=loop=-1:size=1000000[vlooped]`);
        audioParts.push(`${finalAudio}aloop=loop=-1:size=44100000[alooped]`);
        const filterGraph = [...videoParts, ...audioParts].join(';');
        return { filterGraph, inputArgs };
    }
    // Apply built-in FX preset
    applyVideoPreset(config) {
        if (config.crop)
            this.crop(config.crop.percent, config.crop.randomize);
        if (config.rotate)
            this.rotate(config.rotate.degrees, config.rotate.randomize);
        if (config.flip)
            this.flip(config.flip.horizontal, config.flip.vertical);
        if (config.colorJitter) {
            const c = config.colorJitter;
            this.colorJitter(c.brightness, c.contrast, c.saturation, c.gamma, c.hue);
        }
        if (config.noise)
            this.noise(config.noise.type, config.noise.strength, config.noise.temporal);
        if (config.frameJitter?.enabled)
            this.frameJitter(config.frameJitter.dropRate, config.frameJitter.blendRate);
        if (config.speed)
            this.speed(config.speed.factor, config.speed.pitchCorrection);
        if (config.watermark?.enabled)
            this.watermark(config.watermark.payload, config.watermark.strength);
        return this;
    }
    applyAudioPreset(config) {
        if (config.noise)
            this.noiseOverlay(config.noise.type, config.noise.amplitude, config.noise.mixLevel);
        if (config.spectralSmear?.enabled)
            this.spectralSmear(config.spectralSmear.intensity);
        if (config.pitchShift)
            this.pitchShift(config.pitchShift.semitones);
        if (config.tempoShift)
            this.tempo(config.tempoShift.factor);
        if (config.compand)
            this.compand(config.compand.attack, config.compand.release, config.compand.threshold, config.compand.ratio);
        if (config.reverb)
            this.reverb(config.reverb.roomSize, config.reverb.damping, config.reverb.wetLevel);
        if (config.loudness)
            this.loudnorm(config.loudness.target, config.loudness.jitter);
        return this;
    }
}
//# sourceMappingURL=filter-graph.builder.js.map