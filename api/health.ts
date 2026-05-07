import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Function 轻量健康检查。
 * 场景：不加载 Express、TypeORM、sqlite3，用来区分 Vercel Function 基础启动是否正常，以及数据库初始化是否单独失败。
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: 'ok',
    runtime: 'vercel-function',
    timestamp: new Date().toISOString()
  });
}
