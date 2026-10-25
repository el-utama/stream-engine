// Node-Media-Server Plugin for Fastify

import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import NodeMediaServer from 'node-media-server';

const nmsPlugin: FastifyPluginAsync = async (app) => {
  const nmsConfig = {
    rtmp: {
      port: app.config.RTMP_PORT,
      chunk_size: 60000,
      gop_cache: true,
      ping: 30,
      ping_timeout: 60,
    },
    http: {
      port: app.config.HTTP_FLV_PORT,
      allow_origin: '*',
      mediaroot: './media',
    },
    auth: {
      api: true,
      api_user: 'admin',
      api_pass: 'changeme', // Should be from env in production
    },
  };

  const nms = new NodeMediaServer(nmsConfig);

  // Event handlers
  nms.on('prePublish', async (id, StreamPath, args) => {
    app.log.info({ id, StreamPath }, 'Pre-publish');
    // TODO: Validate stream key
  });

  nms.on('postPublish', async (id, StreamPath, args) => {
    app.log.info({ id, StreamPath }, 'Post-publish');
    // TODO: Update stream status to LIVE
  });

  nms.on('donePublish', async (id, StreamPath, args) => {
    app.log.info({ id, StreamPath }, 'Done publish');
    // TODO: Handle stream end
  });

  nms.on('error', (err) => {
    app.log.error({ err }, 'NMS error');
  });

  nms.run();

  app.decorate('nms', nms);

  app.addHook('onClose', async (instance) => {
    instance.nms.stop();
  });
};

export default fp(nmsPlugin);