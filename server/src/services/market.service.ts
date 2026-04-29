import { AppDataSource } from '../config/database';
import { Capability } from '../entities/Capability';
import { ConfigPackage } from '../entities/ConfigPackage';

/**
 * 能力市场服务
 * 处理能力市场相关逻辑
 */

const capabilityRepository = AppDataSource.getRepository(Capability);
const configPackageRepository = AppDataSource.getRepository(ConfigPackage);

/**
 * 获取能力市场列表
 * 只返回已发布的能力
 * @param options 查询选项
 * @returns 能力列表
 */
export const getMarketCapabilities = async (
  options: {
    keyword?: string;
    category?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<{ list: Capability[]; total: number }> => {
  const { keyword, page = 1, pageSize = 20 } = options;

  const queryBuilder = capabilityRepository.createQueryBuilder('capability');

  // 只查询已发布的能力
  queryBuilder.where('capability.status = :status', { status: 1 });

  // 关键词搜索
  if (keyword) {
    queryBuilder.andWhere(
      '(capability.name LIKE :keyword OR capability.code LIKE :keyword OR capability.description LIKE :keyword)',
      { keyword: `%${keyword}%` }
    );
  }

  // 获取总数
  const total = await queryBuilder.getCount();

  // 分页
  queryBuilder
    .orderBy('capability.createdAt', 'DESC')
    .skip((page - 1) * pageSize)
    .take(pageSize);

  const list = await queryBuilder.getMany();

  return { list, total };
};

/**
 * 获取能力市场详情
 * @param id 能力ID
 * @returns 能力详情
 */
export const getMarketCapabilityDetail = async (id: number): Promise<Capability> => {
  const capability = await capabilityRepository.findOne({
    where: { id, status: 1 }, // 只返回已发布的
    relations: ['configPackages', 'configPackages.items']
  });

  if (!capability) {
    throw new Error('能力不存在或未发布');
  }

  return capability;
};

/**
 * 获取能力的配置包列表
 * @param capabilityId 能力ID
 * @returns 配置包列表
 */
export const getCapabilityConfigPackages = async (capabilityId: number): Promise<ConfigPackage[]> => {
  // 先检查能力是否已发布
  const capability = await capabilityRepository.findOne({
    where: { id: capabilityId, status: 1 }
  });

  if (!capability) {
    throw new Error('能力不存在或未发布');
  }

  return configPackageRepository.find({
    where: { capabilityId },
    relations: ['items'],
    order: { createdAt: 'DESC' }
  });
};
