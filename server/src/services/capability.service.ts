import { AppDataSource } from '../config/database';
import { Capability } from '../entities/Capability';
import { ConfigPackage } from '../entities/ConfigPackage';
import { ConfigPackageItem } from '../entities/ConfigPackageItem';
import { TeamMember } from '../entities/TeamMember';

/**
 * 能力服务
 * 处理能力管理相关逻辑
 */

const capabilityRepository = AppDataSource.getRepository(Capability);
const configPackageRepository = AppDataSource.getRepository(ConfigPackage);
const configPackageItemRepository = AppDataSource.getRepository(ConfigPackageItem);
const teamMemberRepository = AppDataSource.getRepository(TeamMember);

/**
 * 创建能力
 * @param userId 用户ID
 * @param data 能力数据
 * @returns 能力信息
 */
export const createCapability = async (
  userId: number,
  data: {
    code: string;
    name: string;
    description?: string;
    iconUrl?: string;
    epassFuncId?: string;
  }
): Promise<Capability> => {
  // 检查code是否已存在
  const existing = await capabilityRepository.findOne({
    where: { code: data.code }
  });

  if (existing) {
    throw new Error('能力编码已存在');
  }

  // 获取用户所属团队
  const membership = await teamMemberRepository.findOne({
    where: { userId, status: 1 },
    order: { role: 'ASC' }
  });

  // 创建能力
  const capability = capabilityRepository.create({
    ...data,
    teamId: membership?.teamId, // 如果用户有团队，则关联到团队
    status: 0 // 草稿状态
  });

  await capabilityRepository.save(capability);
  return capability;
};

/**
 * 获取能力列表
 * @param userId 用户ID
 * @param options 查询选项
 * @returns 能力列表
 */
export const getCapabilityList = async (
  userId: number,
  options: {
    keyword?: string;
    status?: number;
    onlyMine?: boolean;
  } = {}
): Promise<Capability[]> => {
  const queryBuilder = capabilityRepository.createQueryBuilder('capability');

  // 关键词搜索
  if (options.keyword) {
    queryBuilder.where(
      '(capability.name LIKE :keyword OR capability.code LIKE :keyword)',
      { keyword: `%${options.keyword}%` }
    );
  }

  // 状态筛选
  if (options.status !== undefined) {
    queryBuilder.andWhere('capability.status = :status', { status: options.status });
  }

  // 只看我的
  if (options.onlyMine) {
    // 获取用户的团队ID列表
    const memberships = await teamMemberRepository.find({
      where: { userId, status: 1 }
    });
    const teamIds = memberships.map(m => m.teamId);

    if (teamIds.length > 0) {
      queryBuilder.andWhere(
        '(capability.teamId IN (:...teamIds) OR capability.teamId IS NULL)',
        { teamIds }
      );
    } else {
      queryBuilder.andWhere('capability.teamId IS NULL');
    }
  }

  queryBuilder.orderBy('capability.createdAt', 'DESC');

  return queryBuilder.getMany();
};

/**
 * 获取能力详情
 * @param id 能力ID
 * @returns 能力详情
 */
export const getCapabilityDetail = async (id: number): Promise<Capability> => {
  const capability = await capabilityRepository.findOne({
    where: { id },
    relations: ['configPackages']
  });

  if (!capability) {
    throw new Error('能力不存在');
  }

  return capability;
};

/**
 * 更新能力
 * @param id 能力ID
 * @param userId 用户ID
 * @param data 更新数据
 * @returns 更新后的能力
 */
export const updateCapability = async (
  id: number,
  userId: number,
  data: Partial<{
    name: string;
    description: string;
    iconUrl: string;
    epassFuncId: string;
    status: number;
  }>
): Promise<Capability> => {
  const capability = await capabilityRepository.findOne({ where: { id } });

  if (!capability) {
    throw new Error('能力不存在');
  }

  // 检查权限（非平台预设能力需要检查团队成员权限）
  if (capability.teamId !== null) {
    // 检查用户是否是团队成员
    const membership = await teamMemberRepository.findOne({
      where: { teamId: capability.teamId, userId, status: 1 }
    });

    if (!membership) {
      throw new Error('您没有权限修改此能力');
    }
  }

  // 更新字段
  Object.assign(capability, data);
  await capabilityRepository.save(capability);

  return capability;
};

/**
 * 删除能力
 * @param id 能力ID
 * @param userId 用户ID
 */
export const deleteCapability = async (id: number, userId: number): Promise<void> => {
  const capability = await capabilityRepository.findOne({ where: { id } });

  if (!capability) {
    throw new Error('能力不存在');
  }

  // 检查权限（非平台预设能力需要检查团队管理员权限）
  if (capability.teamId !== null) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: capability.teamId, userId, status: 1 }
    });

    if (!membership || membership.role !== 1) {
      throw new Error('只有团队管理员可以删除能力');
    }
  }

  await capabilityRepository.remove(capability);
};

/**
 * 发布能力
 * @param id 能力ID
 * @param userId 用户ID
 */
export const publishCapability = async (id: number, userId: number): Promise<void> => {
  const capability = await capabilityRepository.findOne({ where: { id } });

  if (!capability) {
    throw new Error('能力不存在');
  }

  // 检查权限（非平台预设能力需要检查团队成员权限）
  if (capability.teamId !== null) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: capability.teamId, userId, status: 1 }
    });

    if (!membership) {
      throw new Error('您没有权限操作此能力');
    }
  }

  capability.status = 1; // 已发布
  await capabilityRepository.save(capability);
};

/**
 * 下架能力
 * @param id 能力ID
 * @param userId 用户ID
 */
export const unpublishCapability = async (id: number, userId: number): Promise<void> => {
  const capability = await capabilityRepository.findOne({ where: { id } });

  if (!capability) {
    throw new Error('能力不存在');
  }

  // 检查权限（非平台预设能力需要检查团队成员权限）
  if (capability.teamId !== null) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: capability.teamId, userId, status: 1 }
    });

    if (!membership) {
      throw new Error('您没有权限操作此能力');
    }
  }

  capability.status = 2; // 已下架
  await capabilityRepository.save(capability);
};

/**
 * 获取配置包列表
 * @param capabilityId 能力ID
 * @returns 配置包列表
 */
export const getConfigPackages = async (capabilityId: number): Promise<ConfigPackage[]> => {
  return configPackageRepository.find({
    where: { capabilityId },
    relations: ['items'],
    order: { createdAt: 'DESC' }
  });
};

/**
 * 创建配置包
 * @param capabilityId 能力ID
 * @param userId 用户ID
 * @param data 配置包数据
 * @returns 配置包信息
 */
export const createConfigPackage = async (
  capabilityId: number,
  userId: number,
  data: {
    name: string;
    description?: string;
    items: Array<{
      paramKey: string;
      paramName?: string;
      paramType: number;
      paramValue?: string;
      sortOrder?: number;
    }>;
  }
): Promise<ConfigPackage> => {
  // 检查能力是否存在
  const capability = await capabilityRepository.findOne({ where: { id: capabilityId } });
  if (!capability) {
    throw new Error('能力不存在');
  }

  // 检查权限
  if (capability.teamId !== null) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: capability.teamId, userId, status: 1 }
    });
    if (!membership) {
      throw new Error('您没有权限操作此能力');
    }
  }

  // 创建配置包
  const configPackage = configPackageRepository.create({
    capabilityId,
    name: data.name,
    description: data.description
  });

  await configPackageRepository.save(configPackage);

  // 创建配置项
  if (data.items && data.items.length > 0) {
    const items = data.items.map((item, index) =>
      configPackageItemRepository.create({
        packageId: configPackage.id,
        ...item,
        sortOrder: item.sortOrder ?? index
      })
    );
    await configPackageItemRepository.save(items);
  }

  return configPackage;
};

/**
 * 更新配置包
 * @param packageId 配置包ID
 * @param userId 用户ID
 * @param data 更新数据
 */
export const updateConfigPackage = async (
  packageId: number,
  userId: number,
  data: {
    name?: string;
    description?: string;
    items?: Array<{
      id?: number;
      paramKey: string;
      paramName?: string;
      paramType: number;
      paramValue?: string;
      sortOrder?: number;
    }>;
  }
): Promise<ConfigPackage> => {
  const configPackage = await configPackageRepository.findOne({
    where: { id: packageId },
    relations: ['capability']
  });

  if (!configPackage) {
    throw new Error('配置包不存在');
  }

  // 检查权限
  if (configPackage.capability?.teamId !== null) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: configPackage.capability!.teamId!, userId, status: 1 }
    });
    if (!membership) {
      throw new Error('您没有权限操作此配置包');
    }
  }

  // 更新基本信息
  if (data.name) configPackage.name = data.name;
  if (data.description !== undefined) configPackage.description = data.description;
  await configPackageRepository.save(configPackage);

  // 更新配置项
  if (data.items) {
    // 删除旧配置项
    await configPackageItemRepository.delete({ packageId });

    // 创建新配置项
    const items = data.items.map((item, index) =>
      configPackageItemRepository.create({
        packageId,
        paramKey: item.paramKey,
        paramName: item.paramName,
        paramType: item.paramType,
        paramValue: item.paramValue,
        sortOrder: item.sortOrder ?? index
      })
    );
    await configPackageItemRepository.save(items);
  }

  return configPackage;
};

/**
 * 删除配置包
 * @param packageId 配置包ID
 * @param userId 用户ID
 */
export const deleteConfigPackage = async (packageId: number, userId: number): Promise<void> => {
  const configPackage = await configPackageRepository.findOne({
    where: { id: packageId },
    relations: ['capability']
  });

  if (!configPackage) {
    throw new Error('配置包不存在');
  }

  // 检查权限
  if (configPackage.capability?.teamId !== null) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: configPackage.capability!.teamId!, userId, status: 1 }
    });
    if (!membership) {
      throw new Error('您没有权限删除此配置包');
    }
  }

  await configPackageRepository.remove(configPackage);
};
