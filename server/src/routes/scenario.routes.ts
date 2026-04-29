import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { successResponse, errorResponse } from '../utils/response';
import * as scenarioService from '../services/scenario.service';

/**
 * 场景方案路由
 * 处理场景方案能力配置相关请求
 */
const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * 获取场景能力配置列表
 * GET /api/scenarios/:id/capabilities
 */
router.get('/:id/capabilities', async (req: Request, res: Response) => {
  try {
    const scenarioId = parseInt(req.params.id as string);
    const capabilities = await scenarioService.getScenarioCapabilities(scenarioId);
    successResponse(res, capabilities, '获取成功');
  } catch (error: any) {
    errorResponse(res, error.message || '获取失败', 400);
  }
});

/**
 * 添加能力到场景方案
 * POST /api/scenarios/:id/capabilities
 */
router.post('/:id/capabilities', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const scenarioId = parseInt(req.params.id as string);
    const { capabilityId } = req.body;

    if (!capabilityId) {
      errorResponse(res, '能力ID不能为空', 400);
      return;
    }

    const sc = await scenarioService.addScenarioCapability(scenarioId, userId, {
      capabilityId
    });

    successResponse(res, sc, '添加成功', 201);
  } catch (error: any) {
    errorResponse(res, error.message || '添加失败', 400);
  }
});

/**
 * 更新场景能力配置
 * PUT /api/scenarios/:id/capabilities/:capabilityId
 */
router.put('/:id/capabilities/:capabilityId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const scId = parseInt(req.params.capabilityId as string);
    const { status } = req.body;

    if (status === undefined) {
      errorResponse(res, '状态不能为空', 400);
      return;
    }

    const sc = await scenarioService.updateScenarioCapability(scId, userId, { status });
    successResponse(res, sc, '更新成功');
  } catch (error: any) {
    errorResponse(res, error.message || '更新失败', 400);
  }
});

/**
 * 移除场景能力配置
 * DELETE /api/scenarios/:id/capabilities/:capabilityId
 */
router.delete('/:id/capabilities/:capabilityId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const scId = parseInt(req.params.capabilityId as string);

    await scenarioService.removeScenarioCapability(scId, userId);
    successResponse(res, null, '移除成功');
  } catch (error: any) {
    errorResponse(res, error.message || '移除失败', 400);
  }
});

export default router;
