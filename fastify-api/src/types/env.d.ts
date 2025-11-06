/// <reference types="fastify" />

import { EnvironmentVariables } from '../plugins/env.js'
import type { MySQLPromisePool } from '@fastify/mysql'

declare module 'fastify' {
  interface FastifyInstance {
    config: EnvironmentVariables
    mysql: {
      write: MySQLPromisePool
      read: MySQLPromisePool
    }
  }
}
