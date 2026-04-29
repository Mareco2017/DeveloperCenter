import request from '@/utils/request'

/**
 * 能力市场相关API
 */

export interface MarketCapability {
  id: number
  code: string
  name: string
  description?: string
  iconUrl?: string
  teamId?: number
  epassFuncId?: string
  status: number
  createdAt: string
}

export interface MarketListResult {
  list: MarketCapability[]
  total: number
}

/**
 * 获取能力市场列表
 * @param params 查询参数
 */
export const getMarketList = (params?: {
  keyword?: string
  page?: number
  pageSize?: number
}) => {
  return request.get('/market/capabilities', { params }) as Promise<MarketListResult>
}

/**
 * 获取能力市场详情
 * @param id 能力ID
 */
export const getMarketDetail = (id: number) => {
  return request.get(`/market/capabilities/${id}`) as Promise<MarketCapability>
}

/**
 * 获取能力的配置包列表
 * @param id 能力ID
 */
export const getMarketConfigPackages = (id: number) => {
  return request.get(`/market/capabilities/${id}/config-packages`) as Promise<any[]>
}
