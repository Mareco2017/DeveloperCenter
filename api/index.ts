import type { VercelRequest, VercelResponse } from '@vercel/node';
import 'reflect-metadata';
import dotenv from 'dotenv';
import type { Express } from 'express';

dotenv.config();

let app: Express | null = null;
let databaseReady: Promise<void> | null = null;

/**
 * 动态加载 Express 应用。
 * 场景：避免在 Vercel Function 模块加载阶段就导入 sqlite3/TypeORM；若原生模块加载失败，
 * 可以在 handler 内捕获并返回可诊断 JSON，而不是直接变成 Vercel 平台 500。
 */
const ensureAppReady = async (): Promise<Express> => {
  if (app) {
    return app;
  }

  const [{ createApp }, { AppDataSource, initializeDatabase }] = await Promise.all([
    import('../server/src/app'),
    import('../server/src/config/database')
  ]);

  if (AppDataSource.isInitialized) {
    app = createApp();
    return app;
  }

  if (!databaseReady) {
    databaseReady = initializeDatabase().catch((error) => {
      databaseReady = null;
      throw error;
    });
  }

  await databaseReady;
  app = createApp();
  return app;
};

/**
 * Vercel API 入口。
 * 依赖：vercel.json 将 /api/* 转发到本入口，再由 Express 按原始 /api/* 路由分发。
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const readyApp = await ensureAppReady();
    return readyApp(req, res);
  } catch (error: any) {
    console.error('Vercel API 初始化失败:', error);
    res.status(500).json({
      code: 500,
      message: 'API 初始化失败',
      data: null,
      error: error?.message || String(error)
    });
  }
}
