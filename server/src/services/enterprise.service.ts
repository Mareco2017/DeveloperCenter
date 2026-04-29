import { AppDataSource } from '../config/database';
import { EnterpriseAuth } from '../entities/EnterpriseAuth';

/**
 * 企业认证服务
 * 处理企业认证相关逻辑
 */

const enterpriseAuthRepository = AppDataSource.getRepository(EnterpriseAuth);

/**
 * 提交企业认证
 * @param userId 用户ID
 * @param data 认证数据
 * @returns 认证信息
 */
export const submitEnterpriseAuth = async (
  userId: number,
  data: {
    enterpriseName: string;
    creditCode?: string;
    licenseUrl?: string;
    legalPerson?: string;
  }
): Promise<EnterpriseAuth> => {
  // 检查是否已提交认证
  const existingAuth = await enterpriseAuthRepository.findOne({
    where: { userId }
  });

  if (existingAuth) {
    // 更新已有认证
    existingAuth.enterpriseName = data.enterpriseName;
    if (data.creditCode) existingAuth.creditCode = data.creditCode;
    if (data.licenseUrl) existingAuth.licenseUrl = data.licenseUrl;
    if (data.legalPerson) existingAuth.legalPerson = data.legalPerson;
    existingAuth.status = 1; // 审核中

    await enterpriseAuthRepository.save(existingAuth);
    return existingAuth;
  }

  // 创建新认证
  const auth = enterpriseAuthRepository.create({
    userId,
    enterpriseName: data.enterpriseName,
    creditCode: data.creditCode,
    licenseUrl: data.licenseUrl,
    legalPerson: data.legalPerson,
    status: 1 // 审核中
  });

  await enterpriseAuthRepository.save(auth);
  return auth;
};

/**
 * 获取企业认证信息
 * @param userId 用户ID
 * @returns 认证信息
 */
export const getEnterpriseAuth = async (userId: number): Promise<EnterpriseAuth | null> => {
  return enterpriseAuthRepository.findOne({
    where: { userId }
  });
};

/**
 * 更新企业认证
 * @param userId 用户ID
 * @param data 更新数据
 * @returns 认证信息
 */
export const updateEnterpriseAuth = async (
  userId: number,
  data: {
    enterpriseName?: string;
    creditCode?: string;
    licenseUrl?: string;
    legalPerson?: string;
  }
): Promise<EnterpriseAuth> => {
  const auth = await enterpriseAuthRepository.findOne({
    where: { userId }
  });

  if (!auth) {
    throw new Error('未找到企业认证信息');
  }

  // 更新字段
  if (data.enterpriseName) auth.enterpriseName = data.enterpriseName;
  if (data.creditCode !== undefined) auth.creditCode = data.creditCode;
  if (data.licenseUrl !== undefined) auth.licenseUrl = data.licenseUrl;
  if (data.legalPerson !== undefined) auth.legalPerson = data.legalPerson;

  await enterpriseAuthRepository.save(auth);
  return auth;
};
