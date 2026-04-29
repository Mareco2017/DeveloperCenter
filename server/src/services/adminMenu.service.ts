import { AppDataSource } from '../config/database';
import { AdminMenu } from '../entities/AdminMenu';
import { Product } from '../entities/Product';
import { TeamMember } from '../entities/TeamMember';

/**
 * 管理后台菜单服务
 * 处理产品管理后台菜单配置相关逻辑
 */

const adminMenuRepository = AppDataSource.getRepository(AdminMenu);
const productRepository = AppDataSource.getRepository(Product);
const teamMemberRepository = AppDataSource.getRepository(TeamMember);

/**
 * 获取产品的菜单树
 * @param productId 产品ID
 * @returns 菜单树结构
 */
export const getMenuTree = async (productId: number): Promise<AdminMenu[]> => {
  // 检查产品是否存在
  const product = await productRepository.findOne({ where: { id: productId } });
  if (!product) {
    throw new Error('产品不存在');
  }

  // 获取所有菜单
  const menus = await adminMenuRepository.find({
    where: { productId },
    order: { sortOrder: 'ASC' }
  });

  // 构建树形结构
  return buildMenuTree(menus);
};

/**
 * 构建菜单树
 * @param menus 菜单列表
 * @param parentId 父菜单ID
 * @returns 树形菜单列表
 */
const buildMenuTree = (menus: AdminMenu[], parentId: number = 0): AdminMenu[] => {
  const result: AdminMenu[] = [];

  for (const menu of menus) {
    if (menu.parentId === parentId) {
      // 递归获取子菜单
      const children = buildMenuTree(menus, menu.id);
      if (children.length > 0) {
        (menu as any).children = children;
      }
      result.push(menu);
    }
  }

  return result;
};

/**
 * 获取菜单详情
 * @param menuId 菜单ID
 * @returns 菜单详情
 */
export const getMenuDetail = async (menuId: number): Promise<AdminMenu> => {
  const menu = await adminMenuRepository.findOne({
    where: { id: menuId },
    relations: ['product']
  });

  if (!menu) {
    throw new Error('菜单不存在');
  }

  return menu;
};

/**
 * 创建菜单
 * @param productId 产品ID
 * @param userId 用户ID
 * @param data 菜单数据
 * @returns 创建的菜单
 */
export const createMenu = async (
  productId: number,
  userId: number,
  data: {
    parentId?: number;
    name: string;
    icon?: string;
    path?: string;
    sortOrder?: number;
    visibleRoles?: string;
  }
): Promise<AdminMenu> => {
  // 检查产品是否存在
  const product = await productRepository.findOne({ where: { id: productId } });
  if (!product) {
    throw new Error('产品不存在');
  }

  // 检查权限
  await checkProductPermission(productId, userId);

  // 检查父菜单是否存在且属于同一产品
  if (data.parentId && data.parentId > 0) {
    const parentMenu = await adminMenuRepository.findOne({
      where: { id: data.parentId, productId }
    });
    if (!parentMenu) {
      throw new Error('父菜单不存在或不属于当前产品');
    }

    // 检查层级深度（最多4级）
    const level = await getMenuLevel(data.parentId);
    if (level >= 4) {
      throw new Error('菜单层级不能超过4级');
    }
  }

  // 创建菜单
  const menu = adminMenuRepository.create({
    productId,
    parentId: data.parentId || 0,
    name: data.name,
    icon: data.icon,
    path: data.path,
    sortOrder: data.sortOrder || 0,
    visibleRoles: data.visibleRoles
  });

  await adminMenuRepository.save(menu);
  return menu;
};

/**
 * 更新菜单
 * @param menuId 菜单ID
 * @param userId 用户ID
 * @param data 更新数据
 * @returns 更新后的菜单
 */
export const updateMenu = async (
  menuId: number,
  userId: number,
  data: {
    name?: string;
    icon?: string;
    path?: string;
    sortOrder?: number;
    visibleRoles?: string;
  }
): Promise<AdminMenu> => {
  const menu = await adminMenuRepository.findOne({
    where: { id: menuId },
    relations: ['product']
  });

  if (!menu) {
    throw new Error('菜单不存在');
  }

  // 检查权限
  await checkProductPermission(menu.productId, userId);

  // 更新字段
  if (data.name !== undefined) menu.name = data.name;
  if (data.icon !== undefined) menu.icon = data.icon;
  if (data.path !== undefined) menu.path = data.path;
  if (data.sortOrder !== undefined) menu.sortOrder = data.sortOrder;
  if (data.visibleRoles !== undefined) menu.visibleRoles = data.visibleRoles;

  await adminMenuRepository.save(menu);
  return menu;
};

/**
 * 删除菜单
 * @param menuId 菜单ID
 * @param userId 用户ID
 */
export const deleteMenu = async (menuId: number, userId: number): Promise<void> => {
  const menu = await adminMenuRepository.findOne({
    where: { id: menuId },
    relations: ['product']
  });

  if (!menu) {
    throw new Error('菜单不存在');
  }

  // 检查权限
  await checkProductPermission(menu.productId, userId);

  // 检查是否有子菜单
  const childrenCount = await adminMenuRepository.count({
    where: { parentId: menuId }
  });

  if (childrenCount > 0) {
    throw new Error('请先删除子菜单');
  }

  await adminMenuRepository.remove(menu);
};

/**
 * 移动菜单（更改父级）
 * @param menuId 菜单ID
 * @param userId 用户ID
 * @param targetParentId 目标父菜单ID
 * @returns 更新后的菜单
 */
export const moveMenu = async (
  menuId: number,
  userId: number,
  targetParentId: number
): Promise<AdminMenu> => {
  const menu = await adminMenuRepository.findOne({
    where: { id: menuId },
    relations: ['product']
  });

  if (!menu) {
    throw new Error('菜单不存在');
  }

  // 检查权限
  await checkProductPermission(menu.productId, userId);

  // 不能移动到自己
  if (menuId === targetParentId) {
    throw new Error('不能将菜单移动到自己下面');
  }

  // 检查目标父菜单是否存在且属于同一产品
  if (targetParentId > 0) {
    const parentMenu = await adminMenuRepository.findOne({
      where: { id: targetParentId, productId: menu.productId }
    });
    if (!parentMenu) {
      throw new Error('目标父菜单不存在或不属于当前产品');
    }

    // 检查是否将父菜单移动到自己的子菜单下（形成循环）
    const isDescendant = await checkIsDescendant(menuId, targetParentId);
    if (isDescendant) {
      throw new Error('不能将菜单移动到自己的子菜单下');
    }

    // 检查层级深度
    const level = await getMenuLevel(targetParentId);
    if (level >= 4) {
      throw new Error('目标位置层级不能超过4级');
    }
  }

  menu.parentId = targetParentId;
  await adminMenuRepository.save(menu);
  return menu;
};

/**
 * 批量更新菜单排序
 * @param productId 产品ID
 * @param userId 用户ID
 * @param menuOrders 菜单排序数据
 */
export const updateMenuSort = async (
  productId: number,
  userId: number,
  menuOrders: Array<{ id: number; sortOrder: number; parentId?: number }>
): Promise<void> => {
  // 检查产品是否存在
  const product = await productRepository.findOne({ where: { id: productId } });
  if (!product) {
    throw new Error('产品不存在');
  }

  // 检查权限
  await checkProductPermission(productId, userId);

  // 批量更新
  for (const item of menuOrders) {
    await adminMenuRepository.update(
      { id: item.id, productId },
      { sortOrder: item.sortOrder, parentId: item.parentId || 0 }
    );
  }
};

/**
 * 获取菜单层级
 * @param menuId 菜单ID
 * @returns 层级（1-4）
 */
const getMenuLevel = async (menuId: number): Promise<number> => {
  let level = 1;
  let currentId = menuId;

  while (currentId > 0) {
    const menu = await adminMenuRepository.findOne({
      where: { id: currentId }
    });
    if (!menu || menu.parentId === 0) {
      break;
    }
    currentId = menu.parentId;
    level++;
  }

  return level;
};

/**
 * 检查是否为后代菜单
 * @param ancestorId 祖先菜单ID
 * @param descendantId 后代菜单ID
 * @returns 是否为后代
 */
const checkIsDescendant = async (ancestorId: number, descendantId: number): Promise<boolean> => {
  let currentId = descendantId;

  while (currentId > 0) {
    const menu = await adminMenuRepository.findOne({
      where: { id: currentId }
    });
    if (!menu) {
      break;
    }
    if (menu.parentId === ancestorId) {
      return true;
    }
    currentId = menu.parentId;
  }

  return false;
};

/**
 * 检查产品操作权限
 * @param productId 产品ID
 * @param userId 用户ID
 */
const checkProductPermission = async (productId: number, userId: number): Promise<void> => {
  const product = await productRepository.findOne({ where: { id: productId } });
  if (!product) {
    throw new Error('产品不存在');
  }

  // 如果产品有团队，检查用户是否是团队成员
  if (product.teamId) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: product.teamId, userId, status: 1 }
    });
    if (!membership) {
      throw new Error('您没有权限操作此产品');
    }
  }
};

/**
 * 获取产品的扁平菜单列表（用于选择父菜单）
 * @param productId 产品ID
 * @param excludeId 排除的菜单ID（用于移动时排除自己）
 * @returns 扁平菜单列表
 */
export const getFlatMenuList = async (
  productId: number,
  excludeId?: number
): Promise<AdminMenu[]> => {
  const queryBuilder = adminMenuRepository.createQueryBuilder('menu')
    .where('menu.productId = :productId', { productId })
    .orderBy('menu.sortOrder', 'ASC');

  if (excludeId) {
    queryBuilder.andWhere('menu.id != :excludeId', { excludeId });
  }

  return queryBuilder.getMany();
};
