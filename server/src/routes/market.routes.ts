import { Router, Request, Response } from 'express';
import { optionalAuthMiddleware } from '../middleware/auth.middleware';
import { successResponse, errorResponse } from '../utils/response';
import * as marketService from '../services/market.service';

/**
 * 能力市场路由
 * 处理能力市场相关请求
 */
const router = Router();

// 市场列表和详情可以公开访问
router.use(optionalAuthMiddleware);

/**
 * 获取能力市场列表
 * GET /api/market/capabilities
 */
router.get('/capabilities', async (req: Request, res: Response) => {
  try {
    const { keyword, page, pageSize } = req.query;

    const result = await marketService.getMarketCapabilities({
      keyword: keyword as string,
      page: page ? parseInt(page as string) : 1,
      pageSize: pageSize ? parseInt(pageSize as string) : 20
    });

    successResponse(res, result, '获取成功');
  } catch (error: any) {
    errorResponse(res, error.message || '获取失败', 400);
  }
});

/**
 * 获取能力市场详情
 * GET /api/market/capabilities/:id
 */
router.get('/capabilities/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const capability = await marketService.getMarketCapabilityDetail(id);
    successResponse(res, capability, '获取成功');
  } catch (error: any) {
    errorResponse(res, error.message || '获取失败', 400);
  }
});

/**
 * 获取能力的配置包列表
 * GET /api/market/capabilities/:id/config-packages
 */
router.get('/capabilities/:id/config-packages', async (req: Request, res: Response) => {
  try {
    const capabilityId = parseInt(req.params.id as string);
    const packages = await marketService.getCapabilityConfigPackages(capabilityId);
    successResponse(res, packages, '获取成功');
  } catch (error: any) {
    errorResponse(res, error.message || '获取失败', 400);
  }
});

export default router;
