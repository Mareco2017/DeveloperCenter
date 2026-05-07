import type { VercelRequest, VercelResponse } from '@vercel/node';
import 'reflect-metadata';
import dotenv from 'dotenv';

import { createApp } from '../server/src/app';
import { AppDataSource, initializeDatabase } from '../server/src/config/database';

dotenv.config();

const app = createApp();
let databaseReady: Promise<void> | null = null;

/**
 * 确保 Serverless 实例只初始化一次数据库连接。
 * 场景：Vercel Function 冷启动时建立连接，后续同一实例复用连接，避免重复 initialize 抛错。
 */
const ensureDatabaseReady = async (): Promise<void> => {
  if (AppDataSource.isInitialized) {
    return;
  }

  if (!databaseReady) {
    databaseReady = initializeDatabase().catch((error) => {
      databaseReady = null;
      throw error;
    });
  }

  await databaseReady;
};

/**
 * Vercel API 入口。
 * 依赖：vercel.json 将 /api/* 转发到本入口，再由 Express 按原始 /api/* 路由分发。
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureDatabaseReady();
  return app(req, res);
}
