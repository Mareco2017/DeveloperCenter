import { Router, Request, Response } from 'express';
import { register, login, refreshToken, getUserInfo } from '../services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { successResponse, errorResponse } from '../utils/response';

/**
 * 认证路由
 * 处理用户注册、登录等认证相关请求
 */
const router = Router();

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, phone, email } = req.body;

    // 参数验证
    if (!username || !password) {
      errorResponse(res, '用户名和密码不能为空', 400);
      return;
    }

    // 用户名长度验证
    if (username.length < 3 || username.length > 20) {
      errorResponse(res, '用户名长度应在3-20个字符之间', 400);
      return;
    }

    // 密码长度验证
    if (password.length < 6) {
      errorResponse(res, '密码长度不能少于6个字符', 400);
      return;
    }

    // 注册
    const user = await register(username, password, phone, email);
    successResponse(res, user, '注册成功', 201);
  } catch (error: any) {
    errorResponse(res, error.message || '注册失败', 400);
  }
});

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // 参数验证
    if (!username || !password) {
      errorResponse(res, '用户名和密码不能为空', 400);
      return;
    }

    // 登录
    const result = await login(username, password);
    successResponse(res, result, '登录成功');
  } catch (error: any) {
    errorResponse(res, error.message || '登录失败', 400);
  }
});

/**
 * 刷新Token
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      errorResponse(res, '刷新Token不能为空', 400);
      return;
    }

    const newAccessToken = await refreshToken(token);
    successResponse(res, { accessToken: newAccessToken }, '刷新成功');
  } catch (error: any) {
    errorResponse(res, error.message || '刷新失败', 401);
  }
});

/**
 * 获取当前用户信息
 * GET /api/auth/profile
 */
router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await getUserInfo(userId);
    successResponse(res, user, '获取成功');
  } catch (error: any) {
    errorResponse(res, error.message || '获取失败', 400);
  }
});

export default router;
