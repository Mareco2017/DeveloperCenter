import 'reflect-metadata';
import dotenv from 'dotenv';

import { createApp } from './app';
import { initializeDatabase } from './config/database';

/**
 * 加载本地后端环境变量。
 * 场景：本地开发或独立 Node 部署时读取 server/.env / 进程环境；Vercel Function 入口会自行复用同一配置。
 */
dotenv.config();

const PORT = process.env.PORT || 3001;

/**
 * 启动本地 Express 服务。
 * 依赖：数据库初始化成功后才监听端口，避免前端请求进入半初始化状态。
 */
const startServer = async () => {
  try {
    await initializeDatabase();

    const app = createApp();
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();
