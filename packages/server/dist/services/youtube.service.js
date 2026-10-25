// YouTube Service - Live Streaming API Wrapper
import { BaseService } from './base.service.js';
import { google } from 'googleapis';
import { ok, isErr } from '@stream-engine/shared/utils/result';
export class YouTubeService extends BaseService {
    getOAuthClient() {
        const oauth2Client = new google.auth.OAuth2(this.config.GOOGLE_CLIENT_ID, this.config.GOOGLE_CLIENT_SECRET, this.config.GOOGLE_REDIRECT_URI);
        return oauth2Client;
    }
    async getAuthenticatedClient(accountId) {
        const account = await this.prisma.youTubeAccount.findUnique({ where: { id: accountId } });
        if (!account)
            throw new Error('Account not found');
        const encryption = this.encryption;
        const accessToken = account.accessTokenEnc ? await encryption.decrypt(account.accessTokenEnc) : null;
        const refreshToken = await encryption.decrypt(account.refreshTokenEnc);
        const oauth2Client = this.getOAuthClient();
        oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
        oauth2Client.on('tokens', async (tokens) => {
            if (tokens.access_token) {
                const newAccessTokenEnc = await encryption.encrypt(tokens.access_token);
                await this.prisma.youTubeAccount.update({
                    where: { id: accountId },
                    data: { accessTokenEnc: newAccessTokenEnc, tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null },
                });
            }
            if (tokens.refresh_token) {
                const newRefreshTokenEnc = await encryption.encrypt(tokens.refresh_token);
                await this.prisma.youTubeAccount.update({ where: { id: accountId }, data: { refreshTokenEnc: newRefreshTokenEnc } });
            }
        });
        return { youtube: google.youtube({ version: 'v3', auth: oauth2Client }), account };
    }
    async ensureBroadcast(stream) {
        const { youtube, account } = await this.getAuthenticatedClient(stream.accountId);
        const liveStream = await this.getOrCreateLiveStream(youtube, account.channelId);
        if (isErr(liveStream))
            return liveStream;
        const broadcast = await this.createBroadcast(youtube, {
            title: stream.titleTemplate || stream.name,
            description: stream.descriptionTemplate || '',
            tags: stream.tagsTemplate ? stream.tagsTemplate.split(',').map((t) => t.trim()) : [],
            scheduledStartTime: new Date(),
            enableAutoStart: true,
            enableAutoStop: true,
        });
        if (isErr(broadcast))
            return broadcast;
        const bindResult = await this.bindBroadcast(youtube, broadcast.value.id, liveStream.value.id);
        if (isErr(bindResult))
            return bindResult;
        return ok({
            id: broadcast.value.id,
            rtmpUrl: liveStream.value.cdn.ingestionInfo.ingestionAddress,
            streamKey: liveStream.value.cdn.ingestionInfo.streamName,
        });
    }
    async getOrCreateLiveStream(youtube, channelId) {
        const list = await youtube.liveStreams.list({ part: ['snippet', 'cdn', 'status'], mine: true, maxResults: 50 });
        const existing = list.data.items?.find(s => s.snippet?.channelId === channelId && s.status?.streamStatus === 'ready' && s.contentDetails?.isReusable);
        if (existing)
            return ok(existing);
        const created = await youtube.liveStreams.insert({
            part: ['snippet', 'cdn', 'contentDetails', 'status'],
            requestBody: {
                snippet: { channelId, title: 'Auto-generated Stream' },
                cdn: { format: '1080p', ingestionType: 'rtmp', resolution: '1080p', frameRate: '30fps' },
                contentDetails: { isReusable: true },
            },
        });
        return ok(created.data);
    }
    async createBroadcast(youtube, options) {
        const created = await youtube.liveBroadcasts.insert({
            part: ['snippet', 'status', 'contentDetails'],
            requestBody: {
                snippet: {
                    title: options.title,
                    description: options.description,
                },
                status: { privacyStatus: 'unlisted', selfDeclaredMadeForKids: false },
                contentDetails: { enableAutoStart: options.enableAutoStart, enableAutoStop: options.enableAutoStop },
            },
        });
        return ok(created.data);
    }
    async bindBroadcast(youtube, broadcastId, streamId) {
        await youtube.liveBroadcasts.bind({ part: ['id', 'contentDetails'], id: broadcastId, streamId });
        return ok(undefined);
    }
    async startBroadcast(youtube, broadcastId) {
        await youtube.liveBroadcasts.transition({ part: ['status'], id: broadcastId, broadcastStatus: 'live' });
        return ok(undefined);
    }
    async stopBroadcast(youtube, broadcastId) {
        await youtube.liveBroadcasts.transition({ part: ['status'], id: broadcastId, broadcastStatus: 'complete' });
        return ok(undefined);
    }
    async deleteBroadcast(youtube, broadcastId) {
        await youtube.liveBroadcasts.delete({ id: broadcastId });
        return ok(undefined);
    }
    async createLiveStream(accountId, title, description) {
        const { youtube, account } = await this.getAuthenticatedClient(accountId);
        const liveStream = await this.getOrCreateLiveStream(youtube, account.channelId);
        if (isErr(liveStream))
            return liveStream;
        return ok({
            id: liveStream.value.id,
            rtmpUrl: liveStream.value.cdn.ingestionInfo.ingestionAddress,
            streamKey: liveStream.value.cdn.ingestionInfo.streamName,
        });
    }
    async createLiveBroadcast(accountId, title, description, streamId) {
        const { youtube, account } = await this.getAuthenticatedClient(accountId);
        const liveStream = await this.getOrCreateLiveStream(youtube, account.channelId);
        if (isErr(liveStream))
            return liveStream;
        const broadcast = await this.createBroadcast(youtube, {
            title,
            description: description || '',
            tags: [],
            scheduledStartTime: new Date(),
            enableAutoStart: true,
            enableAutoStop: true,
        });
        if (isErr(broadcast))
            return broadcast;
        if (streamId) {
            const bindResult = await this.bindBroadcast(youtube, broadcast.value.id, streamId);
            if (isErr(bindResult))
                return bindResult;
        }
        return ok({
            id: broadcast.value.id,
            rtmpUrl: liveStream.value.cdn.ingestionInfo.ingestionAddress,
            streamKey: liveStream.value.cdn.ingestionInfo.streamName,
        });
    }
}
//# sourceMappingURL=youtube.service.js.map