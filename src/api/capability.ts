import request from '@/utils/request'

/**
 * 能力相关API
 */

export interface Capability {
  id: number
  code: string
  name: string
  description?: string
  iconUrl?: string
  teamId?: number
  epassFuncId?: string
  status: number // 0-草稿 1-已发布 2-已下架
  createdAt: string
}

export interface ConfigPackage {
  id: number
  capabilityId: number
  name: string
  description?: string
  items: ConfigPackageItem[]
  createdAt: string
}

export interface ConfigPackageItem {
  id: number
  packageId: number
  paramKey: string
  paramName?: string
  paramType: number // 1-字符 2-布尔 3-日期
  paramValue?: string
  sortOrder: number
}

export interface CreateCapabilityData {
  code: string
  name: string
  description?: string
  iconUrl?: string
  epassFuncId?: string
}

export interface CreateConfigPackageData {
  name: string
  description?: string
  items: {
    paramKey: string
    paramName?: string
    paramType: number
    paramValue?: string
    sortOrder?: number
  }[]
}

/**
 * 创建能力
 * @param data 能力数据
 */
export const createCapability = (data: CreateCapabilityData) => {
  return request.post('/capability', data) as Promise<Capability>
}

/**
 * 获取能力列表
 * @param params 查询参数
 */
export const getCapabilityList = (params?: {
  keyword?: string
  status?: number
  onlyMine?: boolean
}) => {
  return request.get('/capability', { params }) as Promise<Capability[]>
}

/**
 * 获取能力详情
 * @param id 能力ID
 */
export const getCapabilityDetail = (id: number) => {
  return request.get(`/capability/${id}`) as Promise<Capability>
}

/**
 * 更新能力
 * @param id 能力ID
 * @param data 更新数据
 */
export const updateCapability = (id: number, data: Partial<CreateCapabilityData>) => {
  return request.put(`/capability/${id}`, data) as Promise<Capability>
}

/**
 * 删除能力
 * @param id 能力ID
 */
export const deleteCapability = (id: number) => {
  return request.delete(`/capability/${id}`) as Promise<any>
}

/**
 * 发布能力
 * @param id 能力ID
 */
export const publishCapability = (id: number) => {
  return request.post(`/capability/${id}/publish`) as Promise<any>
}

/**
 * 下架能力
 * @param id 能力ID
 */
export const unpublishCapability = (id: number) => {
  return request.post(`/capability/${id}/unpublish`) as Promise<any>
}

/**
 * 获取配置包列表
 * @param capabilityId 能力ID
 */
export const getConfigPackages = (capabilityId: number) => {
  return request.get(`/capability/${capabilityId}/config-packages`) as Promise<ConfigPackage[]>
}

/**
 * 创建配置包
 * @param capabilityId 能力ID
 * @param data 配置包数据
 */
export const createConfigPackage = (capabilityId: number, data: CreateConfigPackageData) => {
  return request.post(`/capability/${capabilityId}/config-packages`, data) as Promise<ConfigPackage>
}

/**
 * 更新配置包
 * @param capabilityId 能力ID
 * @param packageId 配置包ID
 * @param data 更新数据
 */
export const updateConfigPackage = (
  capabilityId: number,
  packageId: number,
  data: Partial<CreateConfigPackageData>
) => {
  return request.put(`/capability/${capabilityId}/config-packages/${packageId}`, data) as Promise<ConfigPackage>
}

/**
 * 删除配置包
 * @param capabilityId 能力ID
 * @param packageId 配置包ID
 */
export const deleteConfigPackage = (capabilityId: number, packageId: number) => {
  return request.delete(`/capability/${capabilityId}/config-packages/${packageId}`) as Promise<any>
}
