import { BaseService } from './base.service.js';
import { youtube_v3 } from 'googleapis';
import { Result } from '@stream-engine/shared/utils/result';
export declare class YouTubeService extends BaseService {
    private getOAuthClient;
    private getAuthenticatedClient;
    ensureBroadcast(stream: any): Promise<Result<{
        id: string;
        rtmpUrl: string;
        streamKey: string;
    }, {
        code: string;
        message: string;
    }>>;
    private getOrCreateLiveStream;
    private createBroadcast;
    private bindBroadcast;
    startBroadcast(youtube: youtube_v3.Youtube, broadcastId: string): Promise<Result<void, {
        code: string;
        message: string;
    }>>;
    stopBroadcast(youtube: youtube_v3.Youtube, broadcastId: string): Promise<Result<void, {
        code: string;
        message: string;
    }>>;
    deleteBroadcast(youtube: youtube_v3.Youtube, broadcastId: string): Promise<Result<void, {
        code: string;
        message: string;
    }>>;
    createLiveStream(accountId: string, title: string, description?: string): Promise<Result<{
        id: string;
        rtmpUrl: string;
        streamKey: string;
    }, {
        code: string;
        message: string;
    }>>;
    createLiveBroadcast(accountId: string, title: string, description?: string, streamId?: string): Promise<Result<{
        id: string;
        rtmpUrl: string;
        streamKey: string;
    }, {
        code: string;
        message: string;
    }>>;
}
//# sourceMappingURL=youtube.service.d.ts.map