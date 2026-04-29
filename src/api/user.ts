import request from '@/utils/request'

/**
 * 用户相关API
 */

export interface EnterpriseAuth {
  id: number
  userId: number
  enterpriseName: string
  creditCode?: string
  licenseUrl?: string
  legalPerson?: string
  status: number // 0-未认证 1-审核中 2-已认证 3-认证失败
  createdAt: string
}

export interface EnterpriseAuthData {
  enterpriseName: string
  creditCode?: string
  licenseUrl?: string
  legalPerson?: string
}

/**
 * 提交企业认证
 * @param data 认证数据
 */
export const submitEnterpriseAuth = (data: EnterpriseAuthData) => {
  return request.post('/user/enterprise-auth', data) as Promise<EnterpriseAuth>
}

/**
 * 获取企业认证信息
 */
export const getEnterpriseAuth = () => {
  return request.get('/user/enterprise-auth') as Promise<EnterpriseAuth>
}

/**
 * 更新企业认证信息
 * @param data 认证数据
 */
export const updateEnterpriseAuth = (data: Partial<EnterpriseAuthData>) => {
  return request.put('/user/enterprise-auth', data) as Promise<EnterpriseAuth>
}
