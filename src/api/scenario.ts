import request from '@/utils/request'

/**
 * 场景方案相关API
 */

/**
 * 场景登录身份编码
 * 用于配置“哪些业务身份的账号允许进入当前场景”。
 */
export type LoginIdentityTypeCode =
  | 'recruiter'
  | 'candidate'
  | 'student'
  | 'level1_admin'
  | 'level2_admin'
  | 'super_admin'
  | 'teacher'
  | 'parent'

export interface LoginIdentityOption {
  code: LoginIdentityTypeCode
  label: string
}

export interface ScenarioLoginIdentityConfig {
  version: 1
  identityTypes: LoginIdentityTypeCode[]
}

/**
 * 平台统一登录身份字典
 * 当前由配置端统一维护，后续如需产品自定义身份再扩展为服务端字典。
 */
export const LOGIN_IDENTITY_OPTIONS: LoginIdentityOption[] = [
  { code: 'recruiter', label: '招聘者' },
  { code: 'candidate', label: '应聘者' },
  { code: 'student', label: '学员' },
  { code: 'level1_admin', label: '一级管理员' },
  { code: 'level2_admin', label: '二级管理员' },
  { code: 'super_admin', label: '超级管理员' },
  { code: 'teacher', label: '老师' },
  { code: 'parent', label: '家长' }
]

const LOGIN_IDENTITY_LABEL_MAP = LOGIN_IDENTITY_OPTIONS.reduce(
  (map, option) => {
    map[option.code] = option.label
    return map
  },
  {} as Record<LoginIdentityTypeCode, string>
)

const LOGIN_IDENTITY_CODE_SET = new Set<LoginIdentityTypeCode>(
  LOGIN_IDENTITY_OPTIONS.map(option => option.code)
)

const emptyLoginIdentityConfig = (): ScenarioLoginIdentityConfig => ({
  version: 1,
  identityTypes: []
})

/**
 * 判断是否为旧版登录方式/密码策略配置
 * 旧结构只在配置端识别并按未配置处理，避免误展示为身份白名单。
 */
export const isLegacyLoginIdentityConfig = (config: unknown): boolean => {
  if (!config || typeof config !== 'object') return false
  const value = config as Record<string, unknown>
  return Boolean(
    value.loginMethods ||
      value.passwordPolicy ||
      value.captchaConfig ||
      value.sessionConfig
  )
}

/**
 * 解析场景登录身份配置
 * 只接受 version=1 且身份编码在统一字典内的数据，其余格式按未配置返回。
 */
export const parseScenarioLoginIdentityConfig = (
  configText?: string
): ScenarioLoginIdentityConfig => {
  if (!configText) return emptyLoginIdentityConfig()

  try {
    const config = JSON.parse(configText) as unknown
    if (isLegacyLoginIdentityConfig(config)) {
      return emptyLoginIdentityConfig()
    }

    if (!config || typeof config !== 'object') {
      return emptyLoginIdentityConfig()
    }

    const value = config as Partial<ScenarioLoginIdentityConfig>
    if (value.version !== 1 || !Array.isArray(value.identityTypes)) {
      return emptyLoginIdentityConfig()
    }

    const identityTypes = Array.from(new Set(value.identityTypes)).filter(
      (identity): identity is LoginIdentityTypeCode =>
        LOGIN_IDENTITY_CODE_SET.has(identity as LoginIdentityTypeCode)
    )

    return {
      version: 1,
      identityTypes
    }
  } catch {
    return emptyLoginIdentityConfig()
  }
}

/**
 * 格式化场景登录身份摘要
 * 用于场景卡片和终端场景预览，保持两个入口展示一致。
 */
export const formatScenarioLoginIdentitySummary = (configText?: string): string => {
  const config = parseScenarioLoginIdentityConfig(configText)
  if (config.identityTypes.length === 0) return '未配置'
  return config.identityTypes.map(identity => LOGIN_IDENTITY_LABEL_MAP[identity]).join('、')
}

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
