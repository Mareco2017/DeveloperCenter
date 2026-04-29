<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside width="200px" class="sidebar">
      <div class="logo">
        <span>EXE开发者中心</span>
      </div>
      <el-menu
        :default-active="$route.path"
        router
        class="sidebar-menu"
        background-color="#ffffff"
        text-color="#606266"
        active-text-color="#165DFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/capabilities">
          <el-icon><MagicStick /></el-icon>
          <span>能力管理</span>
        </el-menu-item>
        <el-menu-item index="/products">
          <el-icon><Box /></el-icon>
          <span>产品管理</span>
        </el-menu-item>
        <!-- 账号管理子菜单 -->
        <el-sub-menu index="/settings">
          <template #title>
            <el-icon><User /></el-icon>
            <span>账号管理</span>
          </template>
          <el-menu-item index="/settings/team">
            <span>团队管理</span>
          </el-menu-item>
          <el-menu-item index="/settings/enterprise">
            <span>企业认证</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              {{ userStore.userInfo?.username || '用户' }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { HomeFilled, MagicStick, Box, ArrowDown, User } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

/**
 * 处理下拉菜单命令
 */
const handleCommand = (command: string) => {
  switch (command) {
    case 'logout':
      userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
      break
  }
}
</script>

<style scoped lang="scss">
.layout-container {
  min-height: 100vh;
}

.sidebar {
  background-color: #ffffff;
  border-right: 1px solid #e4e7ed;

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #165DFF;
    font-size: 16px;
    font-weight: 600;
    border-bottom: 1px solid #e4e7ed;
  }

  .sidebar-menu {
    border-right: none;
  }
}

.header {
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  .header-right {
    .user-info {
      cursor: pointer;
      color: #606266;
      display: flex;
      align-items: center;
    }
  }
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
