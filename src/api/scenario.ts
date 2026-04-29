import request from '@/utils/request'

/**
 * 场景方案相关API
 */

export interface Scenario {
  id: number
  productId: number
  code: string
  name: string
  loginIdentityConfig?: string // JSON格式
  h5PortalConfig?: string // JSON格式
  pcPortalConfig?: string // JSON格式
  createdAt: string
}

export interface ScenarioCapability {
  id: number
  scenarioId: number
  capabilityId: number
  capabilityName?: string
  capabilityCode?: string
  status: number // 0-禁用 1-启用
  createdAt: string
}

export interface CreateScenarioData {
  code: string
  name: string
}

export interface UpdateScenarioData {
  name?: string
  loginIdentityConfig?: string
  h5PortalConfig?: string
  pcPortalConfig?: string
}

export interface AddScenarioCapabilityData {
  capabilityId: number
}

export interface UpdateScenarioCapabilityData {
  status: number
}

/**
 * 获取场景方案列表
 * @param productId 产品ID
 */
export const getScenarios = (productId: number) => {
  return request.get(`/product/${productId}/scenarios`) as Promise<Scenario[]>
}

/**
 * 创建场景方案
 * @param productId 产品ID
 * @param data 场景方案数据
 */
export const createScenario = (productId: number, data: CreateScenarioData) => {
  return request.post(`/product/${productId}/scenarios`, data) as Promise<Scenario>
}

/**
 * 更新场景方案
 * @param productId 产品ID
 * @param scenarioId 场景方案ID
 * @param data 更新数据
 */
export const updateScenario = (productId: number, scenarioId: number, data: UpdateScenarioData) => {
  return request.put(`/product/${productId}/scenarios/${scenarioId}`, data) as Promise<Scenario>
}

/**
 * 删除场景方案
 * @param productId 产品ID
 * @param scenarioId 场景方案ID
 */
export const deleteScenario = (productId: number, scenarioId: number) => {
  return request.delete(`/product/${productId}/scenarios/${scenarioId}`) as Promise<any>
}

/**
 * 获取场景能力配置列表
 * @param scenarioId 场景方案ID
 */
export const getScenarioCapabilities = (scenarioId: number) => {
  return request.get(`/scenarios/${scenarioId}/capabilities`) as Promise<ScenarioCapability[]>
}

/**
 * 添加能力到场景方案
 * @param scenarioId 场景方案ID
 * @param data 能力数据
 */
export const addScenarioCapability = (scenarioId: number, data: AddScenarioCapabilityData) => {
  return request.post(`/scenarios/${scenarioId}/capabilities`, data) as Promise<ScenarioCapability>
}

/**
 * 更新场景能力配置
 * @param scenarioId 场景方案ID
 * @param capabilityId 能力配置ID
 * @param data 更新数据
 */
export const updateScenarioCapability = (
  scenarioId: number,
  capabilityId: number,
  data: UpdateScenarioCapabilityData
) => {
  return request.put(`/scenarios/${scenarioId}/capabilities/${capabilityId}`, data) as Promise<ScenarioCapability>
}

/**
 * 移除场景能力配置
 * @param scenarioId 场景方案ID
 * @param capabilityId 能力配置ID
 */
export const removeScenarioCapability = (scenarioId: number, capabilityId: number) => {
  return request.delete(`/scenarios/${scenarioId}/capabilities/${capabilityId}`) as Promise<any>
}
