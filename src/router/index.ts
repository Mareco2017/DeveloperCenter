import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

/**
 * 路由配置
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 登录相关（无需认证）
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login/Login.vue'),
      meta: { public: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/login/Register.vue'),
      meta: { public: true }
    },

    // 主布局（需要认证）
    {
      path: '/',
      component: () => import('@/components/Layout/Layout.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: '/dashboard',
          name: 'dashboard',
          component: () => import('@/views/dashboard/Home.vue'),
          meta: { title: '首页' }
        },
        // 能力管理
        {
          path: '/capabilities',
          name: 'capabilities',
          component: () => import('@/views/capability/CapabilityList.vue'),
          meta: { title: '能力管理' }
        },
        {
          path: '/capabilities/:id/config-packages',
          name: 'capability-config-packages',
          component: () => import('@/views/capability/ConfigPackageManage.vue'),
          meta: { title: '配置包管理' }
        },
        // 产品管理
        {
          path: '/products',
          name: 'products',
          component: () => import('@/views/product/ProductList.vue'),
          meta: { title: '产品管理' }
        },
        {
          path: '/products/:id/scenarios',
          name: 'product-scenarios',
          component: () => import('@/views/product/ScenarioManage.vue'),
          meta: { title: '场景方案配置' }
        },
        {
          path: '/products/:id/terminals',
          name: 'product-terminals',
          component: () => import('@/views/product/TerminalManage.vue'),
          meta: { title: '终端管理' }
        },
        {
          path: '/products/:id/admin-menus',
          name: 'product-admin-menus',
          component: () => import('@/views/product/AdminMenuManage.vue'),
          meta: { title: '管理后台菜单配置' }
        },
        {
          path: '/products/:id/capabilities',
          name: 'product-capabilities',
          component: () => import('@/views/product/CapabilityManage.vue'),
          meta: { title: '能力管理' }
        },
        // 设置
        {
          path: '/settings/team',
          name: 'team-settings',
          component: () => import('@/views/settings/Team.vue'),
          meta: { title: '团队管理' }
        },
        {
          path: '/settings/enterprise',
          name: 'enterprise-settings',
          component: () => import('@/views/settings/Enterprise.vue'),
          meta: { title: '企业认证' }
        }
      ]
    }
  ]
})

/**
 * 路由守卫
 */
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  // 如果路由标记为公开，直接放行
  if (to.meta.public) {
    next()
    return
  }

  // 检查是否已登录
  if (!userStore.isLoggedIn) {
    next('/login')
    return
  }

  next()
})

export default router
