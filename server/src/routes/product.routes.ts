import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { successResponse, errorResponse } from '../utils/response';
import * as productService from '../services/product.service';
import * as adminMenuService from '../services/adminMenu.service';

/**
 * 产品路由
 * 处理产品管理相关请求
 */
const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * 创建产品
 * POST /api/product
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, description, iconUrl } = req.body;

    if (!name) {
      errorResponse(res, '产品名称不能为空', 400);
      return;
    }

    const product = await productService.createProduct(userId, {
      name,
      description,
      iconUrl
    });

    successResponse(res, product, '创建成功', 201);
  } catch (error: any) {
    errorResponse(res, error.message || '创建失败', 400);
  }
});

/**
 * 获取产品列表
 * GET /api/product
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { keyword, status, onlyMine } = req.query;

    const products = await productService.getProductList(userId, {
      keyword: keyword as string,
      status: status ? parseInt(status as string) : undefined,
      onlyMine: onlyMine === 'true'
    });

    successResponse(res, products, '获取成功');
  } catch (error: any) {
    errorResponse(res, error.message || '获取失败', 400);
  }
});

/**
 * 获取产品详情
 * GET /api/product/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const product = await productService.getProductDetail(id);
    successResponse(res, product, '获取成功');
  } catch (error: any) {
    errorResponse(res, error.message || '获取失败', 400);
  }
});

/**
 * 更新产品
 * PUT /api/product/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = parseInt(req.params.id as string);
    const { name, description, iconUrl } = req.body;

    const product = await productService.updateProduct(id, userId, {
      name,
      description,
      iconUrl
    });

    successResponse(res, product, '更新成功');
  } catch (error: any) {
    errorResponse(res, error.message || '更新失败', 400);
  }
});

/**
 * 删除产品
 * DELETE /api/product/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = parseInt(req.params.id as string);

    await productService.deleteProduct(id, userId);
    successResponse(res, null, '删除成功');
  } catch (error: any) {
    errorResponse(res, error.message || '删除失败', 400);
  }
});

/**
 * 发布产品
 * POST /api/product/:id/publish
 */
router.post('/:id/publish', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = parseInt(req.params.id as string);

    await productService.publishProduct(id, userId);
    successResponse(res, null, '发布成功');
  } catch (error: any) {
    errorResponse(res, error.message || '发布失败', 400);
  }
});

/**
 * 下架产品
 * POST /api/product/:id/unpublish
 */
router.post('/:id/unpublish', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = parseInt(req.params.id as string);

    await productService.unpublishProduct(id, userId);
    successResponse(res, null, '下架成功');
  } catch (error: any) {
    errorResponse(res, error.message || '下架失败', 400);
  }
});

/**
 * 获取产品绑定的能力列表
 * GET /api/product/:id/capabilities
 */
router.get('/:id/capabilities', async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id as string);
    const capabilities = await productService.getProductCapabilities(productId);
    successResponse(res, capabilities, '获取成功');
  } catch (error: any) {
    errorResponse(res, error.message || '获取失败', 400);
  }
});

/**
 * 绑定能力到产品
 * POST /api/product/:id/capabilities
 */
router.post('/:id/capabilities', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const productId = parseInt(req.params.id as string);
    const { capabilityId } = req.body;

    if (!capabilityId) {
      errorResponse(res, '能力ID不能为空', 400);
      return;
    }

    const binding = await productService.bindCapability(productId, userId, {
      capabilityId
    });

    successResponse(res, binding, '绑定成功', 201);
  } catch (error: any) {
    errorResponse(res, error.message || '绑定失败', 400);
  }
});

/**
 * 解绑能力
 * DELETE /api/product/:id/capabilities/:capabilityId
 */
router.delete('/:id/capabilities/:capabilityId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const productId = parseInt(req.params.id as string);
    const capabilityId = parseInt(req.params.capabilityId as string);

    await productService.unbindCapability(productId, userId, capabilityId);
    successResponse(res, null, '解绑成功');
  } catch (error: any) {
    errorResponse(res, error.message || '解绑失败', 400);
  }
});

/**
 * 更新能力绑定配置
 * PUT /api/product/:id/capabilities/:capabilityId
 */
router.put('/:id/capabilities/:capabilityId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const productId = parseInt(req.params.id as string);
    const capabilityId = parseInt(req.params.capabilityId as string);
    const { configPackageId, sortOrder } = req.body;

    await productService.updateCapabilityBinding(productId, userId, capabilityId, {
      configPackageId,
      sortOrder
    });

    successResponse(res, null, '更新成功');
  } catch (error: any) {
    errorResponse(res, error.message || '更新失败', 400);
  }
});

/**
 * 获取终端版本列表
 * GET /api/product/:id/terminals
 */
router.get('/:id/terminals', async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id as string);
    const terminals = await productService.getTerminals(productId);
    successResponse(res, terminals, '获取成功');
  } catch (error: any) {
    errorResponse(res, error.message || '获取失败', 400);
  }
});

/**
 * 创建终端
 * POST /api/product/:id/terminals
 */
router.post('/:id/terminals', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const productId = parseInt(req.params.id as string);
    const { name, type } = req.body;

    if (!name) {
      errorResponse(res, '终端名称不能为空', 400);
      return;
    }

    if (!type || ![1, 2, 3].includes(type)) {
      errorResponse(res, '终端类型必须是 1-移动端、2-小程序、3-PC端', 400);
      return;
    }

    const terminal = await productService.createTerminal(productId, userId, {
      name,
      type
    });

    successResponse(res, terminal, '创建成功', 201);
  } catch (error: any) {
    errorResponse(res, error.message || '创建失败', 400);
  }
});

/**
 * 更新终端版本
 * PUT /api/product/:id/terminals/:terminalId
 */
router.put('/:id/terminals/:terminalId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const terminalId = parseInt(req.params.terminalId as string);
    const { name, version, downloadUrl, forceUpdate, updateDesc, status } = req.body;

    const terminal = await productService.updateTerminal(terminalId, userId, {
      name,
      version,
      downloadUrl,
      forceUpdate,
      updateDesc,
      status
    });

    successResponse(res, terminal, '更新成功');
  } catch (error: any) {
    errorResponse(res, error.message || '更新失败', 400);
  }
});

/**
 * 删除终端版本
 * DELETE /api/product/:id/terminals/:terminalId
 */
router.delete('/:id/terminals/:terminalId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const terminalId = parseInt(req.params.terminalId as string);

    await productService.deleteTerminal(terminalId, userId);
    successResponse(res, null, '删除成功');
  } catch (error: any) {
    errorResponse(res, error.message || '删除失败', 400);
  }
});

/**
 * 获取场景方案列表
 * GET /api/product/:id/scenarios
 */
router.get('/:id/scenarios', async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id as string);
    const scenarios = await productService.getScenarios(productId);
    successResponse(res, scenarios, '获取成功');
  } catch (error: any) {
    errorResponse(res, error.message || '获取失败', 400);
  }
});

/**
 * 创建场景方案
 * POST /api/product/:id/scenarios
 */
router.post('/:id/scenarios', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const productId = parseInt(req.params.id as string);
    const { code, name } = req.body;

    if (!code || !name) {
      errorResponse(res, '场景编码和名称不能为空', 400);
      return;
    }

    const scenario = await productService.createScenario(productId, userId, {
      code,
      name
    });

    successResponse(res, scenario, '创建成功', 201);
  } catch (error: any) {
    errorResponse(res, error.message || '创建失败', 400);
  }
});

/**
 * 更新场景方案
 * PUT /api/product/:id/scenarios/:scenarioId
 */
router.put('/:id/scenarios/:scenarioId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const scenarioId = parseInt(req.params.scenarioId as string);
    const { name, loginIdentityConfig, h5PortalConfig, pcPortalConfig } = req.body;

    const scenario = await productService.updateScenario(scenarioId, userId, {
      name,
      loginIdentityConfig,
      h5PortalConfig,
      pcPortalConfig
    });

    successResponse(res, scenario, '更新成功');
  } catch (error: any) {
    errorResponse(res, error.message || '更新失败', 400);
  }
});

/**
 * 删除场景方案
 * DELETE /api/product/:id/scenarios/:scenarioId
 */
router.delete('/:id/scenarios/:scenarioId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const scenarioId = parseInt(req.params.scenarioId as string);

    await productService.deleteScenario(scenarioId, userId);
    successResponse(res, null, '删除成功');
  } catch (error: any) {
    errorResponse(res, error.message || '删除失败', 400);
  }
});

/**
 * 获取产品管理后台菜单树
 * GET /api/product/:id/admin-menus
 */
router.get('/:id/admin-menus', async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id as string);
    const menus = await adminMenuService.getMenuTree(productId);
    successResponse(res, menus, '获取成功');
  } catch (error: any) {
    errorResponse(res, error.message || '获取失败', 400);
  }
});

/**
 * 获取产品的扁平菜单列表（用于选择父菜单）
 * GET /api/product/:id/admin-menus/flat
 */
router.get('/:id/admin-menus/flat', async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id as string);
    const { excludeId } = req.query;
    const menus = await adminMenuService.getFlatMenuList(
      productId,
      excludeId ? parseInt(excludeId as string) : undefined
    );
    successResponse(res, menus, '获取成功');
  } catch (error: any) {
    errorResponse(res, error.message || '获取失败', 400);
  }
});

/**
 * 创建管理后台菜单
 * POST /api/product/:id/admin-menus
 */
router.post('/:id/admin-menus', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const productId = parseInt(req.params.id as string);
    const { parentId, name, icon, path, sortOrder, visibleRoles } = req.body;

    if (!name) {
      errorResponse(res, '菜单名称不能为空', 400);
      return;
    }

    const menu = await adminMenuService.createMenu(productId, userId, {
      parentId,
      name,
      icon,
      path,
      sortOrder,
      visibleRoles
    });

    successResponse(res, menu, '创建成功', 201);
  } catch (error: any) {
    errorResponse(res, error.message || '创建失败', 400);
  }
});

/**
 * 更新管理后台菜单
 * PUT /api/product/:id/admin-menus/:menuId
 */
router.put('/:id/admin-menus/:menuId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const menuId = parseInt(req.params.menuId as string);
    const { name, icon, path, sortOrder, visibleRoles } = req.body;

    const menu = await adminMenuService.updateMenu(menuId, userId, {
      name,
      icon,
      path,
      sortOrder,
      visibleRoles
    });

    successResponse(res, menu, '更新成功');
  } catch (error: any) {
    errorResponse(res, error.message || '更新失败', 400);
  }
});

/**
 * 删除管理后台菜单
 * DELETE /api/product/:id/admin-menus/:menuId
 */
router.delete('/:id/admin-menus/:menuId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const menuId = parseInt(req.params.menuId as string);

    await adminMenuService.deleteMenu(menuId, userId);
    successResponse(res, null, '删除成功');
  } catch (error: any) {
    errorResponse(res, error.message || '删除失败', 400);
  }
});

/**
 * 移动管理后台菜单（更改父级）
 * PUT /api/product/:id/admin-menus/:menuId/move
 */
router.put('/:id/admin-menus/:menuId/move', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const menuId = parseInt(req.params.menuId as string);
    const { targetParentId } = req.body;

    if (targetParentId === undefined) {
      errorResponse(res, '目标父菜单ID不能为空', 400);
      return;
    }

    const menu = await adminMenuService.moveMenu(menuId, userId, targetParentId);
    successResponse(res, menu, '移动成功');
  } catch (error: any) {
    errorResponse(res, error.message || '移动失败', 400);
  }
});

/**
 * 批量更新菜单排序
 * PUT /api/product/:id/admin-menus/sort
 */
router.put('/:id/admin-menus/sort', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const productId = parseInt(req.params.id as string);
    const { menuOrders } = req.body;

    if (!Array.isArray(menuOrders)) {
      errorResponse(res, 'menuOrders必须是数组', 400);
      return;
    }

    await adminMenuService.updateMenuSort(productId, userId, menuOrders);
    successResponse(res, null, '排序更新成功');
  } catch (error: any) {
    errorResponse(res, error.message || '排序更新失败', 400);
  }
});

export default router;
