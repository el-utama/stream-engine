// Type declarations for external modules without types

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

declare module 'ioredis' {
  interface RedisOptions {
    maxRetriesPerRequest?: number;
    retryStrategy?: (times: number) => number | Error;
    lazyConnect?: boolean;
  }

  interface Redis {
    connect(): Promise<void>;
    quit(): Promise<void>;
    ping(): Promise<string>;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'connect', listener: () => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
  }

  const Redis: {
    new (url: string, options?: RedisOptions): Redis;
  };
  export default Redis;
}

declare module 'bullmq' {
  interface QueueOptions {
    connection: any;
  }

  interface WorkerOptions {
    connection: any;
  }

  class Queue {
    constructor(name: string, options: QueueOptions);
    close(): Promise<void>;
    add(name: string, data: any, opts?: any): Promise<any>;
  }

  class Worker {
    constructor(name: string, processor: (job: any) => Promise<any>, options: WorkerOptions);
    close(): Promise<void>;
  }

  export { Queue, Worker };
}