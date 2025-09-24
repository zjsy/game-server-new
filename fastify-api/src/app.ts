import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import underPressure from '@fastify/under-pressure';
import fastify from 'fastify';

import error from '~/plugins/error';
import router from '~/plugins/router';

export default () => {
  const app = fastify({
    logger: {
      transport: {
        target: '@fastify/one-line-logger',
      },
    },
  });

  app.register(cors, { origin: new RegExp(process.env.SITE_URL, 'gi') });
  app.register(helmet);
  app.register(rateLimit);
  app.register(underPressure, { exposeStatusRoute: '/api/healthz' });

  app.register(error);
  app.register(router);

  return app;
};
