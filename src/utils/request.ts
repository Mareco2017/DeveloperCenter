import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

/**
 * 创建axios实例
 */
const request: AxiosInstance = axios.create({
  // 开发环境默认后端端口为 3001；优先读取 .env 中的 VITE_API_BASE_URL，缺省时使用同一端口兜底。
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * 请求拦截器
 */
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从pinia store获取token
    const userStore = useUserStore()
    const token = userStore.accessToken
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器
 */
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, message, data } = response.data
    
    // 请求成功
    if (code === 200 || code === 201) {
      return data
    }
    
    // 请求失败
    ElMessage.error(message || '请求失败')
    return Promise.reject(new Error(message || '请求失败'))
  },
  (error) => {
    // 处理HTTP错误
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          // 清除登录状态并跳转到登录页
          const userStore = useUserStore()
          userStore.logout()
          window.location.href = '/login'
          break
        case 403:
          ElMessage.error('没有权限执行此操作')
          break
        case 404:
          // 404错误不显示消息，由调用方处理
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(data?.message || '请求失败')
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }

    return Promise.reject(error)
  }
)

export default request
