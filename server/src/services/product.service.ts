import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product';
import { ProductCapability } from '../entities/ProductCapability';
import { Terminal } from '../entities/Terminal';
import { TeamMember } from '../entities/TeamMember';
import { Capability } from '../entities/Capability';
import { ConfigPackage } from '../entities/ConfigPackage';
import { Scenario } from '../entities/Scenario';
import { ScenarioCapability } from '../entities/ScenarioCapability';

/**
 * 产品服务
 * 处理产品管理相关逻辑
 */

const productRepository = AppDataSource.getRepository(Product);
const productCapabilityRepository = AppDataSource.getRepository(ProductCapability);
const terminalRepository = AppDataSource.getRepository(Terminal);
const teamMemberRepository = AppDataSource.getRepository(TeamMember);
const capabilityRepository = AppDataSource.getRepository(Capability);
const configPackageRepository = AppDataSource.getRepository(ConfigPackage);
const scenarioRepository = AppDataSource.getRepository(Scenario);
const scenarioCapabilityRepository = AppDataSource.getRepository(ScenarioCapability);

/**
 * 判断是否为可用于查询实体的正整数ID。
 * 场景：路由参数经过 parseInt 后可能变成 NaN，服务层统一拦截，避免把无效ID误报为业务对象不存在。
 */
const isValidEntityId = (id: number): boolean => Number.isInteger(id) && id > 0;

/**
 * 创建产品
 * @param userId 用户ID
 * @param data 产品数据
 * @returns 产品信息
 */
export const createProduct = async (
  userId: number,
  data: {
    name: string;
    description?: string;
    iconUrl?: string;
  }
): Promise<Product> => {
  // 获取用户所属团队
  const membership = await teamMemberRepository.findOne({
    where: { userId, status: 1 },
    order: { role: 'ASC' }
  });

  // 创建产品
  const product = productRepository.create({
    ...data,
    teamId: membership?.teamId,
    status: 0 // 草稿状态
  });

  await productRepository.save(product);
  return product;
};

/**
 * 获取产品列表
 * @param userId 用户ID
 * @param options 查询选项
 * @returns 产品列表
 */
export const getProductList = async (
  userId: number,
  options: {
    keyword?: string;
    status?: number;
    onlyMine?: boolean;
  } = {}
): Promise<Product[]> => {
  const queryBuilder = productRepository.createQueryBuilder('product');

  // 关键词搜索
  if (options.keyword) {
    queryBuilder.where(
      '(product.name LIKE :keyword)',
      { keyword: `%${options.keyword}%` }
    );
  }

  // 状态筛选
  if (options.status !== undefined) {
    queryBuilder.andWhere('product.status = :status', { status: options.status });
  }

  // 只看我的
  if (options.onlyMine) {
    const memberships = await teamMemberRepository.find({
      where: { userId, status: 1 }
    });
    const teamIds = memberships.map(m => m.teamId);

    if (teamIds.length > 0) {
      queryBuilder.andWhere(
        '(product.teamId IN (:...teamIds) OR product.teamId IS NULL)',
        { teamIds }
      );
    } else {
      queryBuilder.andWhere('product.teamId IS NULL');
    }
  }

  queryBuilder.orderBy('product.createdAt', 'DESC');

  return queryBuilder.getMany();
};

/**
 * 获取产品详情
 * @param id 产品ID
 * @returns 产品详情
 */
export const getProductDetail = async (id: number): Promise<Product> => {
  const product = await productRepository.findOne({
    where: { id },
    relations: ['productCapabilities', 'productCapabilities.capability', 'terminals']
  });

  if (!product) {
    throw new Error('产品不存在');
  }

  return product;
};

/**
 * 更新产品
 * @param id 产品ID
 * @param userId 用户ID
 * @param data 更新数据
 * @returns 更新后的产品
 */
export const updateProduct = async (
  id: number,
  userId: number,
  data: Partial<{
    name: string;
    description: string;
    iconUrl: string;
    status: number;
  }>
): Promise<Product> => {
  const product = await productRepository.findOne({ where: { id } });

  if (!product) {
    throw new Error('产品不存在');
  }

  // 检查权限
  if (product.teamId !== null) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: product.teamId, userId, status: 1 }
    });

    if (!membership) {
      throw new Error('您没有权限修改此产品');
    }
  }

  // 更新字段
  Object.assign(product, data);
  await productRepository.save(product);

  return product;
};

/**
 * 删除产品
 * @param id 产品ID
 * @param userId 用户ID
 */
export const deleteProduct = async (id: number, userId: number): Promise<void> => {
  const product = await productRepository.findOne({ where: { id } });

  if (!product) {
    throw new Error('产品不存在');
  }

  // 检查权限
  if (product.teamId !== null) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: product.teamId, userId, status: 1 }
    });

    if (!membership || membership.role !== 1) {
      throw new Error('只有团队管理员可以删除产品');
    }
  }

  await productRepository.remove(product);
};

/**
 * 发布产品
 * @param id 产品ID
 * @param userId 用户ID
 */
export const publishProduct = async (id: number, userId: number): Promise<void> => {
  const product = await productRepository.findOne({ where: { id } });

  if (!product) {
    throw new Error('产品不存在');
  }

  // 检查权限
  if (product.teamId !== null) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: product.teamId, userId, status: 1 }
    });

    if (!membership) {
      throw new Error('您没有权限操作此产品');
    }
  }

  product.status = 1; // 已发布
  await productRepository.save(product);
};

/**
 * 下架产品
 * @param id 产品ID
 * @param userId 用户ID
 */
export const unpublishProduct = async (id: number, userId: number): Promise<void> => {
  const product = await productRepository.findOne({ where: { id } });

  if (!product) {
    throw new Error('产品不存在');
  }

  // 检查权限
  if (product.teamId !== null) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: product.teamId, userId, status: 1 }
    });

    if (!membership) {
      throw new Error('您没有权限操作此产品');
    }
  }

  product.status = 2; // 已下架
  await productRepository.save(product);
};

/**
 * 获取产品绑定的能力列表
 * @param productId 产品ID
 * @returns 能力列表
 */
export const getProductCapabilities = async (productId: number): Promise<any[]> => {
  const productCapabilities = await productCapabilityRepository.find({
    where: { productId },
    relations: ['capability', 'configPackage']
  });

  return productCapabilities.map(pc => ({
    id: pc.id,
    capabilityId: pc.capabilityId,
    capabilityName: pc.capability?.name,
    capabilityCode: pc.capability?.code,
    configPackageId: pc.configPackageId,
    configPackageName: pc.configPackage?.name,
    sortOrder: pc.sortOrder,
    createdAt: pc.createdAt
  }));
};

/**
 * 获取产品可绑定能力列表。
 * 场景：产品管理页打开“绑定能力”弹窗时，只展示当前产品仍可新增绑定的已发布能力。
 * 依赖：产品所属团队决定团队能力可见范围；平台能力 teamId 为空，允许所有产品绑定。
 * @param productId 产品ID
 * @param userId 当前操作用户ID
 * @returns 可绑定能力列表
 */
export const getBindableCapabilities = async (productId: number, userId: number): Promise<Capability[]> => {
  const product = await productRepository.findOne({ where: { id: productId } });
  if (!product) {
    throw new Error('产品不存在');
  }

  const productTeamId = product.teamId ?? null;

  // 关键控制点：团队产品只能由当前团队成员查看可绑定能力，防止跨团队枚举能力。
  if (productTeamId !== null) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: productTeamId, userId, status: 1 }
    });
    if (!membership) {
      throw new Error('您没有权限操作此产品');
    }
  }

  const boundProductCapabilities = await productCapabilityRepository.find({
    where: { productId }
  });
  const boundCapabilityIds = boundProductCapabilities.map(item => item.capabilityId);

  const queryBuilder = capabilityRepository
    .createQueryBuilder('capability')
    .where('capability.status = :publishedStatus', { publishedStatus: 1 });

  if (productTeamId !== null) {
    // 团队产品可绑定“本团队已发布能力 + 平台已发布能力”。
    queryBuilder.andWhere('(capability.teamId = :teamId OR capability.teamId IS NULL)', { teamId: productTeamId });
  } else {
    // 平台产品没有团队上下文，只允许绑定平台能力，避免混入任意团队能力。
    queryBuilder.andWhere('capability.teamId IS NULL');
  }

  if (boundCapabilityIds.length > 0) {
    queryBuilder.andWhere('capability.id NOT IN (:...boundCapabilityIds)', { boundCapabilityIds });
  }

  return queryBuilder
    .orderBy('capability.createdAt', 'DESC')
    .addOrderBy('capability.id', 'DESC')
    .getMany();
};

/**
 * 绑定能力到产品
 * @param productId 产品ID
 * @param userId 用户ID
 * @param data 绑定数据
 * @returns 绑定信息
 */
export const bindCapability = async (
  productId: number,
  userId: number,
  data: {
    capabilityId: number;
  }
): Promise<ProductCapability> => {
  // 检查产品是否存在
  const product = await productRepository.findOne({ where: { id: productId } });
  if (!product) {
    throw new Error('产品不存在');
  }

  // 检查权限
  if (product.teamId !== null) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: product.teamId, userId, status: 1 }
    });
    if (!membership) {
      throw new Error('您没有权限操作此产品');
    }
  }

  // 检查能力是否存在
  const capability = await capabilityRepository.findOne({
    where: { id: data.capabilityId }
  });
  if (!capability) {
    throw new Error('能力不存在');
  }

  // 关键控制点：绑定入口必须与弹窗候选集保持同一契约，禁止绕过前端绑定草稿、下架或跨团队能力。
  if (capability.status !== 1) {
    throw new Error('只能绑定已发布能力');
  }
  const productTeamId = product.teamId ?? null;
  const capabilityTeamId = capability.teamId ?? null;
  if (productTeamId === null) {
    if (capabilityTeamId !== null) {
      throw new Error('该能力不可绑定到此产品');
    }
  } else if (capabilityTeamId !== null && capabilityTeamId !== productTeamId) {
    throw new Error('该能力不可绑定到此产品');
  }

  // 检查是否已绑定
  const existing = await productCapabilityRepository.findOne({
    where: { productId, capabilityId: data.capabilityId }
  });
  if (existing) {
    throw new Error('该能力已绑定到此产品');
  }

  // 创建绑定
  const productCapability = productCapabilityRepository.create({
    productId,
    capabilityId: data.capabilityId
  });

  await productCapabilityRepository.save(productCapability);
  return productCapability;
};

/**
 * 解绑能力
 * @param productId 产品ID
 * @param userId 用户ID
 * @param capabilityId 能力ID
 */
export const unbindCapability = async (
  productId: number,
  userId: number,
  capabilityId: number
): Promise<void> => {
  const product = await productRepository.findOne({ where: { id: productId } });
  if (!product) {
    throw new Error('产品不存在');
  }

  // 检查权限
  if (product.teamId !== null) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: product.teamId, userId, status: 1 }
    });
    if (!membership) {
      throw new Error('您没有权限操作此产品');
    }
  }

  const productCapability = await productCapabilityRepository.findOne({
    where: { productId, capabilityId }
  });

  if (!productCapability) {
    throw new Error('绑定关系不存在');
  }

  await productCapabilityRepository.remove(productCapability);
};

/**
 * 更新能力绑定配置
 * @param productId 产品ID
 * @param userId 用户ID
 * @param capabilityId 能力ID
 * @param data 更新数据
 */
export const updateCapabilityBinding = async (
  productId: number,
  userId: number,
  capabilityId: number,
  data: {
    configPackageId?: number;
    sortOrder?: number;
  }
): Promise<void> => {
  const product = await productRepository.findOne({ where: { id: productId } });
  if (!product) {
    throw new Error('产品不存在');
  }

  // 检查权限
  if (product.teamId !== null) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: product.teamId, userId, status: 1 }
    });
    if (!membership) {
      throw new Error('您没有权限操作此产品');
    }
  }

  const productCapability = await productCapabilityRepository.findOne({
    where: { productId, capabilityId }
  });

  if (!productCapability) {
    throw new Error('绑定关系不存在');
  }

  if (data.configPackageId !== undefined) {
    productCapability.configPackageId = data.configPackageId;
  }
  if (data.sortOrder !== undefined) {
    productCapability.sortOrder = data.sortOrder;
  }

  await productCapabilityRepository.save(productCapability);
};

/**
 * 获取终端版本列表
 * @param productId 产品ID
 * @returns 终端版本列表
 */
export const getTerminals = async (productId: number): Promise<Terminal[]> => {
  return terminalRepository.find({
    where: { productId },
    order: { createdAt: 'DESC' }
  });
};

/**
 * 创建终端
 * @param productId 产品ID
 * @param userId 用户ID
 * @param data 终端数据
 * @returns 终端信息
 */
export const createTerminal = async (
  productId: number,
  userId: number,
  data: {
    name: string;
    type: number; // 1-移动端 2-小程序 3-PC端
  }
): Promise<Terminal> => {
  const product = await productRepository.findOne({ where: { id: productId } });
  if (!product) {
    throw new Error('产品不存在');
  }

  // 检查权限
  if (product.teamId !== null) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: product.teamId, userId, status: 1 }
    });
    if (!membership) {
      throw new Error('您没有权限操作此产品');
    }
  }

  const terminal = terminalRepository.create({
    productId,
    type: data.type,
    name: data.name,
    forceUpdate: false,
    status: 0 // 草稿状态
  });

  await terminalRepository.save(terminal);
  return terminal;
};

/**
 * 更新终端版本
 * @param terminalId 终端ID
 * @param userId 用户ID
 * @param data 更新数据
 * @returns 更新后的终端
 */
export const updateTerminal = async (
  terminalId: number,
  userId: number,
  data: Partial<{
    name: string;
    version: string;
    downloadUrl: string;
    forceUpdate: boolean;
    updateDesc: string;
    status: number;
  }>
): Promise<Terminal> => {
  const terminal = await terminalRepository.findOne({
    where: { id: terminalId },
    relations: ['product']
  });

  if (!terminal) {
    throw new Error('终端版本不存在');
  }

  // 检查权限
  if (terminal.product?.teamId !== null) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: terminal.product!.teamId!, userId, status: 1 }
    });
    if (!membership) {
      throw new Error('您没有权限操作此终端');
    }
  }

  Object.assign(terminal, data);
  await terminalRepository.save(terminal);
  return terminal;
};

/**
 * 删除终端版本
 * @param terminalId 终端ID
 * @param userId 用户ID
 */
export const deleteTerminal = async (terminalId: number, userId: number): Promise<void> => {
  const terminal = await terminalRepository.findOne({
    where: { id: terminalId },
    relations: ['product']
  });

  if (!terminal) {
    throw new Error('终端版本不存在');
  }

  // 检查权限
  if (terminal.product?.teamId !== null) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: terminal.product!.teamId!, userId, status: 1 }
    });
    if (!membership || membership.role !== 1) {
      throw new Error('只有团队管理员可以删除终端版本');
    }
  }

  await terminalRepository.remove(terminal);
};

/**
 * 获取场景方案列表
 * @param productId 产品ID
 * @returns 场景方案列表
 */
export const getScenarios = async (productId: number): Promise<Scenario[]> => {
  // 关键控制点：列表入口也要校验产品存在，避免页面先展示空列表，新增时才报“产品不存在”。
  if (!isValidEntityId(productId)) {
    throw new Error('产品ID无效');
  }

  const product = await productRepository.findOne({ where: { id: productId } });
  if (!product) {
    throw new Error('产品不存在');
  }

  return scenarioRepository.find({
    where: { productId },
    order: { createdAt: 'DESC' }
  });
};

/**
 * 创建场景方案
 * @param productId 产品ID
 * @param userId 用户ID
 * @param data 场景方案数据
 * @returns 场景方案信息
 */
export const createScenario = async (
  productId: number,
  userId: number,
  data: {
    code: string;
    name: string;
  }
): Promise<Scenario> => {
  if (!isValidEntityId(productId)) {
    throw new Error('产品ID无效');
  }

  const product = await productRepository.findOne({ where: { id: productId } });
  if (!product) {
    throw new Error('产品不存在');
  }

  // 检查权限
  if (product.teamId !== null) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: product.teamId, userId, status: 1 }
    });
    if (!membership) {
      throw new Error('您没有权限操作此产品');
    }
  }

  // 检查场景编码是否已存在
  const existing = await scenarioRepository.findOne({
    where: { productId, code: data.code }
  });
  if (existing) {
    throw new Error('场景编码已存在');
  }

  const scenario = scenarioRepository.create({
    productId,
    ...data
  });

  await scenarioRepository.save(scenario);
  return scenario;
};

/**
 * 更新场景方案
 * @param scenarioId 场景方案ID
 * @param userId 用户ID
 * @param data 更新数据
 * @returns 更新后的场景方案
 */
export const updateScenario = async (
  scenarioId: number,
  userId: number,
  data: Partial<{
    name: string;
    loginIdentityConfig: string;
    h5PortalConfig: string;
    pcPortalConfig: string;
  }>
): Promise<Scenario> => {
  const scenario = await scenarioRepository.findOne({
    where: { id: scenarioId },
    relations: ['product']
  });

  if (!scenario) {
    throw new Error('场景方案不存在');
  }

  // 检查权限
  if (scenario.product?.teamId !== null) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: scenario.product!.teamId!, userId, status: 1 }
    });
    if (!membership) {
      throw new Error('您没有权限操作此场景方案');
    }
  }

  Object.assign(scenario, data);
  await scenarioRepository.save(scenario);
  return scenario;
};

/**
 * 删除场景方案
 * @param scenarioId 场景方案ID
 * @param userId 用户ID
 */
export const deleteScenario = async (scenarioId: number, userId: number): Promise<void> => {
  const scenario = await scenarioRepository.findOne({
    where: { id: scenarioId },
    relations: ['product']
  });

  if (!scenario) {
    throw new Error('场景方案不存在');
  }

  // 检查权限
  if (scenario.product?.teamId !== null) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: scenario.product!.teamId!, userId, status: 1 }
    });
    if (!membership || membership.role !== 1) {
      throw new Error('只有团队管理员可以删除场景方案');
    }
  }

  await scenarioRepository.remove(scenario);
};
