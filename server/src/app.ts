import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import teamRoutes from './routes/team.routes';
import capabilityRoutes from './routes/capability.routes';
import marketRoutes from './routes/market.routes';
import productRoutes from './routes/product.routes';
import scenarioRoutes from './routes/scenario.routes';

/**
 * 创建 Express 应用实例。
 * 场景：本地开发由 index.ts 监听端口，Vercel 部署由 api/index.ts 作为 Serverless Function 入口复用同一套路由。
 */
export const createApp = () => {
  const app = express();

  /**
   * 全局中间件配置。
   * 依赖：helmet/cors/morgan 统一处理安全头、跨域和请求日志，express.json 负责解析前端 JSON 请求体。
   */
  app.use(helmet());
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  /**
   * 静态文件服务。
   * 场景：本地后端可直接访问上传目录；Vercel Serverless 下仅作为兼容挂载，持久化上传仍需独立对象存储。
   */
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  /**
   * API 路由挂载。
   * 依赖：前端 axios baseURL 为 /api 时，各业务模块仍沿用现有 /api/* 路由契约。
   */
  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/team', teamRoutes);
  app.use('/api/capability', capabilityRoutes);
  app.use('/api/market', marketRoutes);
  app.use('/api/product', productRoutes);
  app.use('/api/scenarios', scenarioRoutes);

  /**
   * 健康检查。
   * 场景：部署后可通过 /health 或 Function 内部探针确认服务实例可响应。
   */
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  /**
   * 统一错误处理。
   * 依赖：业务路由抛出的异常最终转为前端 request.ts 可识别的标准响应结构。
   */
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
      code: 500,
      message: err.message || '服务器内部错误',
      data: null
    });
  });

  return app;
};

export default createApp;
