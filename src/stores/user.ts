import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '@/api/auth'

/**
 * 用户状态管理
 */
export const useUserStore = defineStore('user', () => {
  // State
  const accessToken = ref<string>(localStorage.getItem('accessToken') || '')
  const refreshToken = ref<string>(localStorage.getItem('refreshToken') || '')
  const userInfo = ref<any>(null)

  // Getters
  const isLoggedIn = computed(() => !!accessToken.value)

  // Actions
  /**
   * 设置Token
   */
  const setTokens = (access: string, refresh: string) => {
    accessToken.value = access
    refreshToken.value = refresh
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
  }

  /**
   * 设置用户信息
   */
  const setUserInfo = (info: any) => {
    userInfo.value = info
  }

  /**
   * 登录
   */
  const login = async (username: string, password: string) => {
    const result = await authApi.login({ username, password })
    setTokens(result.accessToken, result.refreshToken)
    setUserInfo(result.user)
    return result
  }

  /**
   * 注册
   */
  const register = async (data: authApi.RegisterData) => {
    return authApi.register(data)
  }

  /**
   * 获取用户信息
   */
  const fetchUserInfo = async () => {
    const result = await authApi.getProfile()
    setUserInfo(result)
    return result
  }

  /**
   * 退出登录
   */
  const logout = () => {
    accessToken.value = ''
    refreshToken.value = ''
    userInfo.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  return {
    accessToken,
    refreshToken,
    userInfo,
    isLoggedIn,
    setTokens,
    setUserInfo,
    login,
    register,
    fetchUserInfo,
    logout
  }
})
