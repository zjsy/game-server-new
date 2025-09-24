import fastify from 'fastify';

import helloHttp from '../+handler';

test('GET /hello-http', async () => {
  const app = fastify();

  app.register(helloHttp, { prefix: '/hello-http' });

  const res = await app.inject({ method: 'GET', url: '/hello-http' });
  expect(res.json()).toEqual({ message: 'Hello, World!' });
});
