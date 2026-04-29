import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { errorResponse } from '../utils/response';

/**
 * 扩展Express Request类型，添加user属性
 */
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * JWT认证中间件
 * 验证请求中的Token
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // 从请求头中获取Token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      errorResponse(res, '未提供认证Token', 401);
      return;
    }

    // 解析Token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      errorResponse(res, 'Token格式错误', 401);
      return;
    }

    const token = parts[1];

    // 验证Token
    const payload = verifyToken(token);
    req.user = payload;

    next();
  } catch (error) {
    errorResponse(res, 'Token无效或已过期', 401);
  }
};

/**
 * 可选认证中间件
 * 验证Token但不强制要求
 */
export const optionalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      next();
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      next();
      return;
    }

    const token = parts[1];
    const payload = verifyToken(token);
    req.user = payload;

    next();
  } catch (error) {
    next();
  }
};
