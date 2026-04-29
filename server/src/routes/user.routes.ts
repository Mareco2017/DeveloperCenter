import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { successResponse, errorResponse } from '../utils/response';
import * as enterpriseService from '../services/enterprise.service';

/**
 * 用户路由
 * 处理用户信息和企业认证相关请求
 */
const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * 获取用户信息
 * GET /api/user/profile
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    // 用户信息已在auth.service中实现，这里可以扩展
    successResponse(res, req.user, '获取成功');
  } catch (error: any) {
    errorResponse(res, error.message || '获取失败', 400);
  }
});

/**
 * 提交企业认证
 * POST /api/user/enterprise-auth
 */
router.post('/enterprise-auth', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { enterpriseName, creditCode, licenseUrl, legalPerson } = req.body;

    if (!enterpriseName) {
      errorResponse(res, '企业名称不能为空', 400);
      return;
    }

    const auth = await enterpriseService.submitEnterpriseAuth(userId, {
      enterpriseName,
      creditCode,
      licenseUrl,
      legalPerson
    });

    successResponse(res, auth, '提交成功', 201);
  } catch (error: any) {
    errorResponse(res, error.message || '提交失败', 400);
  }
});

/**
 * 获取企业认证信息
 * GET /api/user/enterprise-auth
 */
router.get('/enterprise-auth', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const auth = await enterpriseService.getEnterpriseAuth(userId);

    if (!auth) {
      errorResponse(res, '未找到企业认证信息', 404);
      return;
    }

    successResponse(res, auth, '获取成功');
  } catch (error: any) {
    errorResponse(res, error.message || '获取失败', 400);
  }
});

/**
 * 更新企业认证信息
 * PUT /api/user/enterprise-auth
 */
router.put('/enterprise-auth', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { enterpriseName, creditCode, licenseUrl, legalPerson } = req.body;

    const auth = await enterpriseService.updateEnterpriseAuth(userId, {
      enterpriseName,
      creditCode,
      licenseUrl,
      legalPerson
    });

    successResponse(res, auth, '更新成功');
  } catch (error: any) {
    errorResponse(res, error.message || '更新失败', 400);
  }
});

export default router;
