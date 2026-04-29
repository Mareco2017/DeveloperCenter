import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

import { initializeDatabase } from './config/database';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import teamRoutes from './routes/team.routes';
import capabilityRoutes from './routes/capability.routes';
import marketRoutes from './routes/market.routes';
import productRoutes from './routes/product.routes';
import scenarioRoutes from './routes/scenario.routes';

/**
 * 加载环境变量
 */
dotenv.config();

/**
 * 创建Express应用
 */
const app = express();
const PORT = process.env.PORT || 3001;

/**
 * 中间件配置
 */
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * 静态文件服务
 */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/**
 * API路由
 */
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/capability', capabilityRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/product', productRoutes);
app.use('/api/scenarios', scenarioRoutes);

/**
 * 健康检查
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * 错误处理中间件
 */
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    code: 500,
    message: err.message || '服务器内部错误',
    data: null
  });
});

/**
 * 启动服务器
 */
const startServer = async () => {
  try {
    // 初始化数据库
    await initializeDatabase();
    
    // 启动服务
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();
