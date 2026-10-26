// Auth Routes - Google OAuth PKCE

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { google } from 'googleapis';
import { z } from 'zod';
import * as crypto from 'crypto';
import { authCallbackSchema, authUrlQuerySchema } from '@stream-engine/shared/schemas/auth.schema';
import { getEncryption } from '../utils/encryption.js';

// Type helpers for Fastify request types
interface AuthUrlQuery {
  state?: string;
}

interface AuthCallbackQuery {
  code: string;
  state?: string;
  scope?: string;
  authuser?: string;
  prompt?: string;
}

interface AccountIdParams {
  id: string;
}

interface RefreshTokenBody {
  accountId: string;
}

const authRoutes: FastifyPluginAsync = async (app) => {
  const oauth2Client = new google.auth.OAuth2(
    app.config.GOOGLE_CLIENT_ID,
    app.config.GOOGLE_CLIENT_SECRET,
    app.config.GOOGLE_REDIRECT_URI
  );

  // Generate PKCE challenge
  function generateCodeVerifier(): string {
    const array = crypto.randomBytes(32);
    return Buffer.from(array).toString('base64url');
  }

  function generateCodeChallenge(verifier: string): string {
    // PKCE S256: code_challenge = BASE64URL(SHA256(code_verifier))
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  // GET /api/auth/youtube/url - Get OAuth URL
  app.get('/youtube/url', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          state: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
  }, async (request: FastifyRequest<{ Querystring: AuthUrlQuery }>, reply: FastifyReply) => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    // Always generate a state if not provided
    const state = request.query.state || crypto.randomUUID();
    
    await app.redis.setex(`oauth:verifier:${state}`, 600, codeVerifier);

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.force-ssl',
        'https://www.googleapis.com/auth/youtube.upload',
      ],
      prompt: 'consent',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    } as any);

    return { url };
  });

  // GET /api/auth/youtube/callback - Handle OAuth callback
  app.get('/youtube/callback', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          code: { type: 'string', minLength: 1 },
          state: { type: 'string' },
          scope: { type: 'string' },
          authuser: { type: 'string' },
          prompt: { type: 'string' },
        },
        required: ['code'],
        additionalProperties: false,
      },
    },
  }, async (request: FastifyRequest<{ Querystring: AuthCallbackQuery }>, reply: FastifyReply) => {
    const { code, state } = request.query;

    const codeVerifier = await app.redis.get(`oauth:verifier:${state || 'default'}`);
    if (!codeVerifier) {
      return reply.code(400).send({ error: 'Invalid or expired state' });
    }

    try {
      const tokenResponse = await oauth2Client.getToken({
        code,
        codeVerifier,
      });

      const tokens = tokenResponse.tokens;
      oauth2Client.setCredentials(tokens);

      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
      const channelsResponse = await youtube.channels.list({
        part: ['snippet', 'contentDetails', 'statistics'],
        mine: true,
      });

      const channels = channelsResponse.data.items || [];
      if (channels.length === 0) {
        return reply.code(400).send({ error: 'No YouTube channels found' });
      }

      const encryption = getEncryption();
      const savedAccounts = [];

      for (const channel of channels) {
        const refreshTokenEnc = await encryption.encrypt(tokens.refresh_token!);
        const accessTokenEnc = tokens.access_token ? await encryption.encrypt(tokens.access_token) : null;

        const account = await app.prisma.youTubeAccount.upsert({
          where: { channelId: channel.id! },
          update: {
            channelName: channel.snippet?.title!,
            channelHandle: channel.snippet?.customUrl || null,
            refreshTokenEnc,
            accessTokenEnc,
            tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            avatarUrl: channel.snippet?.thumbnails?.default?.url || null,
            isActive: true,
          },
          create: {
            userId: 'default-user',
            channelId: channel.id!,
            channelName: channel.snippet?.title!,
            channelHandle: channel.snippet?.customUrl || null,
            refreshTokenEnc,
            accessTokenEnc,
            tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            avatarUrl: channel.snippet?.thumbnails?.default?.url || null,
            isActive: true,
          },
        });

        savedAccounts.push(account);
      }

      await app.redis.del(`oauth:verifier:${state || 'default'}`);

      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/accounts?connected=true`);
    } catch (error) {
      app.log.error({ err: error }, 'OAuth callback failed');
      return reply.code(500).send({ error: 'Authentication failed' });
    }
  });

  // GET /api/auth/youtube/accounts - List connected accounts
  app.get('/youtube/accounts', async (request, reply) => {
    const accounts = await app.prisma.youTubeAccount.findMany({
      where: { userId: 'default-user' },
      select: {
        id: true,
        channelId: true,
        channelName: true,
        channelHandle: true,
        avatarUrl: true,
        isActive: true,
      },
    });
    return accounts;
  });

  // DELETE /api/auth/youtube/accounts/:id - Disconnect account
  app.delete('/youtube/accounts/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', pattern: '^[a-z0-9]{25}$' },
        },
        required: ['id'],
        additionalProperties: false,
      },
    },
  }, async (request: FastifyRequest<{ Params: AccountIdParams }>, reply: FastifyReply) => {
    await app.prisma.youTubeAccount.delete({
      where: { id: request.params.id },
    });
    return { success: true };
  });

  // POST /api/auth/youtube/refresh - Force token refresh
  app.post('/youtube/refresh', {
    schema: {
      body: {
        type: 'object',
        properties: {
          accountId: { type: 'string', pattern: '^[a-z0-9]{25}$' },
        },
        required: ['accountId'],
        additionalProperties: false,
      },
    },
  }, async (request: FastifyRequest<{ Body: RefreshTokenBody }>, reply: FastifyReply) => {
    const account = await app.prisma.youTubeAccount.findUnique({
      where: { id: request.body.accountId },
    });
    if (!account) return reply.code(404).send({ error: 'Account not found' });

    const encryption = getEncryption();
    const refreshToken = await encryption.decrypt(account.refreshTokenEnc);

    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();

    const newAccessTokenEnc = credentials.access_token ? await encryption.encrypt(credentials.access_token) : null;
    const newRefreshTokenEnc = credentials.refresh_token ? await encryption.encrypt(credentials.refresh_token) : account.refreshTokenEnc;

    await app.prisma.youTubeAccount.update({
      where: { id: account.id },
      data: {
        accessTokenEnc: newAccessTokenEnc,
        refreshTokenEnc: newRefreshTokenEnc,
        tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
      },
    });

    return { success: true };
  });
};

export default authRoutes;