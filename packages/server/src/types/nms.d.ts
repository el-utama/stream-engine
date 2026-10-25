declare module 'node-media-server' {
  interface NMSConfig {
    rtmp: {
      port: number;
      chunk_size?: number;
      gop_cache?: boolean;
      ping?: number;
      ping_timeout?: number;
    };
    http: {
      port: number;
      allow_origin?: string;
      mediaroot?: string;
    };
    auth?: {
      api?: boolean;
      api_user?: string;
      api_pass?: string;
    };
    relay?: {
      ffmpeg?: string;
      tasks?: Array<{
        app: string;
        mode: string;
        edge: string;
      }>;
    };
  }

  interface StreamInfo {
    id: string;
    StreamPath: string;
    args: any;
  }

  class NodeMediaServer {
    constructor(config: NMSConfig);
    run(): void;
    stop(): void;
    on(event: 'prePublish', listener: (id: string, streamPath: string, args: any) => void): this;
    on(event: 'postPublish', listener: (id: string, streamPath: string, args: any) => void): this;
    on(event: 'donePublish', listener: (id: string, streamPath: string, args: any) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
  }

  export default NodeMediaServer;
}