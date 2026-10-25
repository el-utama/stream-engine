// Shared Enums and Config Types - Separate to avoid circular dependencies
export var SourceType;
(function (SourceType) {
    SourceType["VIDEO_FILE"] = "VIDEO_FILE";
    SourceType["PLAYLIST"] = "PLAYLIST";
    SourceType["RTMP_PUSH"] = "RTMP_PUSH";
    SourceType["WEBCAM"] = "WEBCAM";
    SourceType["VISUALIZER"] = "VISUALIZER";
})(SourceType || (SourceType = {}));
export var LoopMode;
(function (LoopMode) {
    LoopMode["INFINITE"] = "INFINITE";
    LoopMode["ONCE"] = "ONCE";
    LoopMode["COUNT"] = "COUNT";
})(LoopMode || (LoopMode = {}));
export var Platform;
(function (Platform) {
    Platform["YOUTUBE"] = "YOUTUBE";
    Platform["TWITCH"] = "TWITCH";
    Platform["FACEBOOK"] = "FACEBOOK";
    Platform["CUSTOM_RTMP"] = "CUSTOM_RTMP";
})(Platform || (Platform = {}));
export var StreamStatus;
(function (StreamStatus) {
    StreamStatus["STOPPED"] = "STOPPED";
    StreamStatus["STARTING"] = "STARTING";
    StreamStatus["LIVE"] = "LIVE";
    StreamStatus["ERROR"] = "ERROR";
    StreamStatus["RECONNECTING"] = "RECONNECTING";
    StreamStatus["STOPPING"] = "STOPPING";
})(StreamStatus || (StreamStatus = {}));
export var AudioSource;
(function (AudioSource) {
    AudioSource["VIDEO"] = "VIDEO";
    AudioSource["FILE"] = "FILE";
    AudioSource["NOISE"] = "NOISE";
    AudioSource["MIX"] = "MIX";
})(AudioSource || (AudioSource = {}));
export var NoiseProfile;
(function (NoiseProfile) {
    NoiseProfile["WHITE"] = "WHITE";
    NoiseProfile["PINK"] = "PINK";
    NoiseProfile["BROWN"] = "BROWN";
    NoiseProfile["BLUE"] = "BLUE";
    NoiseProfile["VIOLET"] = "VIOLET";
    NoiseProfile["VELVET"] = "VELVET";
    NoiseProfile["CUSTOM"] = "CUSTOM";
})(NoiseProfile || (NoiseProfile = {}));
export var FxIntensity;
(function (FxIntensity) {
    FxIntensity["LOW"] = "LOW";
    FxIntensity["MEDIUM"] = "MEDIUM";
    FxIntensity["HIGH"] = "HIGH";
    FxIntensity["AGGRESSIVE"] = "AGGRESSIVE";
})(FxIntensity || (FxIntensity = {}));
export var VisualizerType;
(function (VisualizerType) {
    VisualizerType["SPECTRUM_BARS"] = "SPECTRUM_BARS";
    VisualizerType["WAVEFORM"] = "WAVEFORM";
    VisualizerType["CIRCULAR"] = "CIRCULAR";
    VisualizerType["PARTICLES"] = "PARTICLES";
    VisualizerType["CUSTOM"] = "CUSTOM";
})(VisualizerType || (VisualizerType = {}));
export var BackgroundType;
(function (BackgroundType) {
    BackgroundType["COLOR"] = "COLOR";
    BackgroundType["GRADIENT"] = "GRADIENT";
    BackgroundType["IMAGE"] = "IMAGE";
    BackgroundType["VIDEO"] = "VIDEO";
})(BackgroundType || (BackgroundType = {}));
export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (LogLevel = {}));
//# sourceMappingURL=enums.js.map