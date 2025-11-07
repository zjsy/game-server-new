import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'

// 环境变量的JSON Schema定义
const envSchema = {
  type: 'object',
  required: ['NODE_ENV'],
  properties: {
    // 基础配置
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'production', 'test'],
      default: 'development',
    },
    LOG_LEVEL: {
      type: 'string',
      enum: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'],
      default: 'info',
    },

    // 数据库配置 - 写库
    RDS_HOST_WRITE: {
      type: 'string',
      default: '127.0.0.1',
    },
    // 数据库配置 - 读库
    RDS_HOST_READ: {
      type: 'string',
      default: '127.0.0.1',
    },
    DB_PORT: {
      type: 'integer',
      default: 3306,
    },
    DB_DATABASE: {
      type: 'string',
      default: 'fggame',
    },
    DB_USERNAME: {
      type: 'string',
      default: 'root',
    },
    DB_PASSWORD: {
      type: 'string',
      default: 'root',
    },
    DB_PREFIX: {
      type: 'string',
      default: '',
    },

    // Redis 配置
    REDIS_HOST: {
      type: 'string',
      default: '127.0.0.1',
    },
    REDIS_PORT: {
      type: 'integer',
      default: 6379,
    },
    REDIS_PASSWORD: {
      type: 'string',
      default: 'sy1314',
    },

    // 服务器配置
    FASTIFY_CLOSE_GRACE_DELAY: {
      type: 'integer',
      default: 1000,
    },

    // Centrifugo 配置
    CENTRIFUGO_API_URL: {
      type: 'string',
      default: 'http://localhost:8000/api',
    },
    CENTRIFUGO_WS_URL: {
      type: 'string',
      default: 'ws://localhost:8000/connection/websocket',
    },
    CENTRIFUGO_API_KEY: {
      type: 'string',
      default: 'my_api_key',
    },

    // JWT 鉴权配置
    JWT_SECRET: {
      type: 'string',
      default: 'change_this_to_a_secure_secret_in_production',
    },
    JWT_EXPIRES_IN: {
      type: 'string',
      default: '24h',
    },
  },
}

// TypeScript类型定义
export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'production' | 'test';
  LOG_LEVEL: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  RDS_HOST_WRITE: string;
  RDS_HOST_READ: string;
  DB_PORT: number;
  DB_DATABASE: string;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_PREFIX: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  FASTIFY_CLOSE_GRACE_DELAY: number;
  CENTRIFUGO_API_URL: string;
  CENTRIFUGO_WS_URL: string;
  CENTRIFUGO_API_KEY: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
}

// 扩展 Fastify 类型，使环境变量可通过 fastify.config 访问
declare module 'fastify' {
  interface FastifyInstance {
    config: EnvironmentVariables;
  }
}

const envPlugin: FastifyPluginAsync = async (fastify) => {
  // 注册 @fastify/env 插件
  await fastify.register(import('@fastify/env'), {
    schema: envSchema,
    // 允许从多个来源读取环境变量
    dotenv: {
      path: '.env',
      debug: fastify.log.level === 'debug',
    },
    // 数据处理选项
    data: process.env,
  })
}

// 导出为 Fastify 插件
export default fp(envPlugin, {
  name: 'env',
  dependencies: [],
})
