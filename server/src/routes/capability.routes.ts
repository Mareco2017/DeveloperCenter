import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { successResponse, errorResponse } from '../utils/response';
import * as capabilityService from '../services/capability.service';

/**
 * 能力路由
 * 处理能力管理相关请求
 */
const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * 创建能力
 * POST /api/capability
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { code, name, description, iconUrl, epassFuncId } = req.body;

    if (!code || !name) {
      errorResponse(res, '能力编码和名称不能为空', 400);
      return;
    }

    const capability = await capabilityService.createCapability(userId, {
      code,
      name,
      description,
      iconUrl,
      epassFuncId
    });

    successResponse(res, capability, '创建成功', 201);
  } catch (error: any) {
    errorResponse(res, error.message || '创建失败', 400);
  }
});

/**
 * 获取能力列表
 * GET /api/capability
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { keyword, status, onlyMine } = req.query;

    const capabilities = await capabilityService.getCapabilityList(userId, {
      keyword: keyword as string,
      status: status ? parseInt(status as string) : undefined,
      onlyMine: onlyMine === 'true'
    });

    successResponse(res, capabilities, '获取成功');
  } catch (error: any) {
    errorResponse(res, error.message || '获取失败', 400);
  }
});

/**
 * 获取能力详情
 * GET /api/capability/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const capability = await capabilityService.getCapabilityDetail(id);
    successResponse(res, capability, '获取成功');
  } catch (error: any) {
    errorResponse(res, error.message || '获取失败', 400);
  }
});

/**
 * 更新能力
 * PUT /api/capability/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = parseInt(req.params.id as string);
    const { name, description, iconUrl, epassFuncId } = req.body;

    const capability = await capabilityService.updateCapability(id, userId, {
      name,
      description,
      iconUrl,
      epassFuncId
    });

    successResponse(res, capability, '更新成功');
  } catch (error: any) {
    errorResponse(res, error.message || '更新失败', 400);
  }
});

/**
 * 删除能力
 * DELETE /api/capability/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = parseInt(req.params.id as string);

    await capabilityService.deleteCapability(id, userId);
    successResponse(res, null, '删除成功');
  } catch (error: any) {
    errorResponse(res, error.message || '删除失败', 400);
  }
});

/**
 * 发布能力
 * POST /api/capability/:id/publish
 */
router.post('/:id/publish', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = parseInt(req.params.id as string);

    await capabilityService.publishCapability(id, userId);
    successResponse(res, null, '发布成功');
  } catch (error: any) {
    errorResponse(res, error.message || '发布失败', 400);
  }
});

/**
 * 下架能力
 * POST /api/capability/:id/unpublish
 */
router.post('/:id/unpublish', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = parseInt(req.params.id as string);

    await capabilityService.unpublishCapability(id, userId);
    successResponse(res, null, '下架成功');
  } catch (error: any) {
    errorResponse(res, error.message || '下架失败', 400);
  }
});

/**
 * 获取配置包列表
 * GET /api/capability/:id/config-packages
 */
router.get('/:id/config-packages', async (req: Request, res: Response) => {
  try {
    const capabilityId = parseInt(req.params.id as string);
    const packages = await capabilityService.getConfigPackages(capabilityId);
    successResponse(res, packages, '获取成功');
  } catch (error: any) {
    errorResponse(res, error.message || '获取失败', 400);
  }
});

/**
 * 创建配置包
 * POST /api/capability/:id/config-packages
 */
router.post('/:id/config-packages', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const capabilityId = parseInt(req.params.id as string);
    const { name, description, items } = req.body;

    if (!name) {
      errorResponse(res, '配置包名称不能为空', 400);
      return;
    }

    const configPackage = await capabilityService.createConfigPackage(capabilityId, userId, {
      name,
      description,
      items: items || []
    });

    successResponse(res, configPackage, '创建成功', 201);
  } catch (error: any) {
    errorResponse(res, error.message || '创建失败', 400);
  }
});

/**
 * 更新配置包
 * PUT /api/capability/:id/config-packages/:packageId
 */
router.put('/:id/config-packages/:packageId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const packageId = parseInt(req.params.packageId as string);
    const { name, description, items } = req.body;

    const configPackage = await capabilityService.updateConfigPackage(packageId, userId, {
      name,
      description,
      items
    });

    successResponse(res, configPackage, '更新成功');
  } catch (error: any) {
    errorResponse(res, error.message || '更新失败', 400);
  }
});

/**
 * 删除配置包
 * DELETE /api/capability/:id/config-packages/:packageId
 */
router.delete('/:id/config-packages/:packageId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const packageId = parseInt(req.params.packageId as string);

    await capabilityService.deleteConfigPackage(packageId, userId);
    successResponse(res, null, '删除成功');
  } catch (error: any) {
    errorResponse(res, error.message || '删除失败', 400);
  }
});

export default router;
