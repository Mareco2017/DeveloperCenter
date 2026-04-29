import request from '@/utils/request'

/**
 * 认证相关API
 */

export interface RegisterData {
  username: string
  password: string
  phone?: string
  email?: string
}

export interface LoginData {
  username: string
  password: string
}

export interface LoginResult {
  user: {
    id: number
    username: string
    phone?: string
    email?: string
    realName?: string
    status: number
    createdAt: string
    updatedAt: string
  }
  accessToken: string
  refreshToken: string
}

/**
 * 用户注册
 * @param data 注册数据
 */
export const register = (data: RegisterData) => {
  return request.post('/auth/register', data) as Promise<any>
}

/**
 * 用户登录
 * @param data 登录数据
 */
export const login = (data: LoginData) => {
  return request.post('/auth/login', data) as Promise<LoginResult>
}

/**
 * 刷新Token
 * @param refreshToken 刷新Token
 */
export const refreshToken = (refreshToken: string) => {
  return request.post('/auth/refresh', { refreshToken }) as Promise<{ accessToken: string }>
}

/**
 * 获取当前用户信息
 */
export const getProfile = () => {
  return request.get('/auth/profile') as Promise<any>
}
