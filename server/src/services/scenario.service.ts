import { AppDataSource } from '../config/database';
import { Scenario } from '../entities/Scenario';
import { ScenarioCapability } from '../entities/ScenarioCapability';
import { Capability } from '../entities/Capability';
import { TeamMember } from '../entities/TeamMember';

/**
 * 场景方案服务
 * 处理场景方案能力配置相关逻辑
 */

const scenarioRepository = AppDataSource.getRepository(Scenario);
const scenarioCapabilityRepository = AppDataSource.getRepository(ScenarioCapability);
const capabilityRepository = AppDataSource.getRepository(Capability);
const teamMemberRepository = AppDataSource.getRepository(TeamMember);

/**
 * 获取场景能力配置列表
 * @param scenarioId 场景方案ID
 * @returns 场景能力配置列表
 */
export const getScenarioCapabilities = async (scenarioId: number): Promise<any[]> => {
  // 检查场景方案是否存在
  const scenario = await scenarioRepository.findOne({ where: { id: scenarioId } });
  if (!scenario) {
    throw new Error('场景方案不存在');
  }

  const scenarioCapabilities = await scenarioCapabilityRepository.find({
    where: { scenarioId },
    relations: ['capability']
  });

  return scenarioCapabilities.map(sc => ({
    id: sc.id,
    scenarioId: sc.scenarioId,
    capabilityId: sc.capabilityId,
    capabilityName: sc.capability?.name,
    capabilityCode: sc.capability?.code,
    status: sc.status,
    createdAt: sc.createdAt
  }));
};

/**
 * 添加能力到场景方案
 * @param scenarioId 场景方案ID
 * @param userId 用户ID
 * @param data 能力数据
 * @returns 场景能力配置
 */
export const addScenarioCapability = async (
  scenarioId: number,
  userId: number,
  data: {
    capabilityId: number;
  }
): Promise<ScenarioCapability> => {
  // 检查场景方案是否存在
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

  // 检查能力是否存在
  const capability = await capabilityRepository.findOne({
    where: { id: data.capabilityId }
  });
  if (!capability) {
    throw new Error('能力不存在');
  }

  // 检查是否已添加
  const existing = await scenarioCapabilityRepository.findOne({
    where: { scenarioId, capabilityId: data.capabilityId }
  });
  if (existing) {
    throw new Error('该能力已添加到此场景方案');
  }

  // 创建场景能力配置
  const sc = scenarioCapabilityRepository.create({
    scenarioId,
    capabilityId: data.capabilityId,
    status: 1 // 默认启用
  });

  await scenarioCapabilityRepository.save(sc);
  return sc;
};

/**
 * 更新场景能力配置
 * @param scId 场景能力配置ID
 * @param userId 用户ID
 * @param data 更新数据
 * @returns 更新后的场景能力配置
 */
export const updateScenarioCapability = async (
  scId: number,
  userId: number,
  data: {
    status: number;
  }
): Promise<ScenarioCapability> => {
  const sc = await scenarioCapabilityRepository.findOne({
    where: { id: scId },
    relations: ['scenario', 'scenario.product']
  });

  if (!sc) {
    throw new Error('场景能力配置不存在');
  }

  // 检查权限
  if (sc.scenario?.product?.teamId !== null) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: sc.scenario!.product!.teamId!, userId, status: 1 }
    });
    if (!membership) {
      throw new Error('您没有权限操作此场景方案');
    }
  }

  sc.status = data.status;
  await scenarioCapabilityRepository.save(sc);
  return sc;
};

/**
 * 移除场景能力配置
 * @param scId 场景能力配置ID
 * @param userId 用户ID
 */
export const removeScenarioCapability = async (scId: number, userId: number): Promise<void> => {
  const sc = await scenarioCapabilityRepository.findOne({
    where: { id: scId },
    relations: ['scenario', 'scenario.product']
  });

  if (!sc) {
    throw new Error('场景能力配置不存在');
  }

  // 检查权限
  if (sc.scenario?.product?.teamId !== null) {
    const membership = await teamMemberRepository.findOne({
      where: { teamId: sc.scenario!.product!.teamId!, userId, status: 1 }
    });
    if (!membership || membership.role !== 1) {
      throw new Error('只有团队管理员可以移除场景能力配置');
    }
  }

  await scenarioCapabilityRepository.remove(sc);
};
