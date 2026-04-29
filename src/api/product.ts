import request from '@/utils/request'

/**
 * 产品相关API
 */

export interface Product {
  id: number
  name: string
  description?: string
  iconUrl?: string
  teamId?: number
  epassAppId?: string
  status: number // 0-草稿 1-已发布 2-已下架
  createdAt: string
}

export interface ProductCapability {
  id: number
  productId: number
  capabilityId: number
  capabilityName?: string
  capabilityCode?: string
  configPackageId?: number
  configPackageName?: string
  sortOrder: number
  createdAt: string
}

export interface Terminal {
  id: number
  productId: number
  name: string
  type: number // 1-APP 2-小程序 3-PC
  platform?: number // 1-iOS 2-Android 3-Windows 4-Mac 5-Linux 6-微信小程序 7-支付宝小程序 8-抖音小程序
  version?: string
  downloadUrl?: string
  forceUpdate: boolean
  updateDesc?: string
  status: number // 0-草稿 1-已发布 2-已下架
  loginConfig?: string // JSON格式
  brandConfig?: string // JSON格式
  scenarioId?: number // 关联的场景方案ID
  createdAt: string
  updatedAt: string
}

export interface CreateProductData {
  name: string
  description?: string
  iconUrl?: string
}

export interface BindCapabilityData {
  capabilityId: number
}

/**
 * 创建终端数据类型
 * 简化版：仅需要名称和类型
 */
export interface CreateTerminalData {
  name: string
  type: number // 1-移动端 2-小程序 3-PC端
}

export interface TerminalLoginConfig {
  // 登录方式
  loginMethods: {
    password: boolean // 账号密码登录
    sms: boolean // 短信验证码登录
    wechat: boolean // 微信登录
    sso: boolean // 单点登录
  }
  // 密码策略
  passwordPolicy?: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumber: boolean
    requireSpecialChar: boolean
  }
  // 验证码配置
  captchaConfig?: {
    enabled: boolean
    type: 'image' | 'slider' | 'none'
  }
  // 会话配置
  sessionConfig?: {
    timeout: number // 分钟
    singleDevice: boolean // 是否单设备登录
  }
}

/**
 * 创建产品
 * @param data 产品数据
 */
export const createProduct = (data: CreateProductData) => {
  return request.post('/product', data) as Promise<Product>
}

/**
 * 获取产品列表
 * @param params 查询参数
 */
export const getProductList = (params?: {
  keyword?: string
  status?: number
  onlyMine?: boolean
}) => {
  return request.get('/product', { params }) as Promise<Product[]>
}

/**
 * 获取产品详情
 * @param id 产品ID
 */
export const getProductDetail = (id: number) => {
  return request.get(`/product/${id}`) as Promise<Product>
}

/**
 * 更新产品
 * @param id 产品ID
 * @param data 更新数据
 */
export const updateProduct = (id: number, data: Partial<CreateProductData>) => {
  return request.put(`/product/${id}`, data) as Promise<Product>
}

/**
 * 删除产品
 * @param id 产品ID
 */
export const deleteProduct = (id: number) => {
  return request.delete(`/product/${id}`) as Promise<any>
}

/**
 * 发布产品
 * @param id 产品ID
 */
export const publishProduct = (id: number) => {
  return request.post(`/product/${id}/publish`) as Promise<any>
}

/**
 * 下架产品
 * @param id 产品ID
 */
export const unpublishProduct = (id: number) => {
  return request.post(`/product/${id}/unpublish`) as Promise<any>
}

/**
 * 获取产品绑定的能力列表
 * @param productId 产品ID
 */
export const getProductCapabilities = (productId: number) => {
  return request.get(`/product/${productId}/capabilities`) as Promise<ProductCapability[]>
}

/**
 * 绑定能力到产品
 * @param productId 产品ID
 * @param data 绑定数据
 */
export const bindCapability = (productId: number, data: BindCapabilityData) => {
  return request.post(`/product/${productId}/capabilities`, data) as Promise<any>
}

/**
 * 解绑能力
 * @param productId 产品ID
 * @param capabilityId 能力ID
 */
export const unbindCapability = (productId: number, capabilityId: number) => {
  return request.delete(`/product/${productId}/capabilities/${capabilityId}`) as Promise<any>
}

/**
 * 更新能力绑定配置
 * @param productId 产品ID
 * @param capabilityId 能力ID
 * @param data 更新数据
 */
export const updateCapabilityBinding = (
  productId: number,
  capabilityId: number,
  data: { configPackageId?: number; sortOrder?: number }
) => {
  return request.put(`/product/${productId}/capabilities/${capabilityId}`, data) as Promise<any>
}

/**
 * 获取终端版本列表
 * @param productId 产品ID
 */
export const getTerminals = (productId: number) => {
  return request.get(`/product/${productId}/terminals`) as Promise<Terminal[]>
}

/**
 * 创建终端版本
 * @param productId 产品ID
 * @param data 终端数据
 */
export const createTerminal = (productId: number, data: CreateTerminalData) => {
  return request.post(`/product/${productId}/terminals`, data) as Promise<Terminal>
}

/**
 * 更新终端版本
 * @param productId 产品ID
 * @param terminalId 终端ID
 * @param data 更新数据
 */
export const updateTerminal = (
  productId: number,
  terminalId: number,
  data: Partial<CreateTerminalData & { status: number; loginConfig: string; brandConfig: string; scenarioId: number }>
) => {
  return request.put(`/product/${productId}/terminals/${terminalId}`, data) as Promise<Terminal>
}

/**
 * 删除终端版本
 * @param productId 产品ID
 * @param terminalId 终端ID
 */
export const deleteTerminal = (productId: number, terminalId: number) => {
  return request.delete(`/product/${productId}/terminals/${terminalId}`) as Promise<any>
}

// 场景方案相关API（从scenario.ts导出）
export {
  getScenarios,
  createScenario,
  updateScenario,
  deleteScenario,
  getScenarioCapabilities,
  addScenarioCapability,
  updateScenarioCapability,
  removeScenarioCapability
} from './scenario'
