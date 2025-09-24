/// <reference types="vite-plugin-fastify-routes/client" />

declare namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: 'development' | 'production';

    HOST: string;
    PORT: number;

    SITE_URL: string;

    // 可选的环境变量
    DATABASE_URL?: string;
    API_BASE_URL?: string;
    JWT_SECRET?: string;
    LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
  }
}
