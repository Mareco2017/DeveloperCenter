<template>
  <div class="home-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="welcome-card">
          <h2>欢迎使用 EXE开发者中心</h2>
          <p>企业开发者平台，助力您的产品快速上线</p>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="stat-row">
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-icon blue">
            <el-icon><Box /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">0</div>
            <div class="stat-label">我的产品</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-icon green">
            <el-icon><MagicStick /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">0</div>
            <div class="stat-label">能力数量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-icon orange">
            <el-icon><Cellphone /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">0</div>
            <div class="stat-label">终端版本</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="action-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>快速入口</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" @click="$router.push('/products')">
              <el-icon><Plus /></el-icon>
              创建产品
            </el-button>
            <el-button @click="$router.push('/capabilities')">
              <el-icon><MagicStick /></el-icon>
              添加能力
            </el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>系统公告</span>
          </template>
          <div class="announcement">
            <p>欢迎使用EXE开发者中心！</p>
            <p>您可以在这里创建产品、管理能力和配置终端。</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { Box, MagicStick, Cellphone, Plus } from '@element-plus/icons-vue'
</script>

<style scoped lang="scss">
.home-container {
  .welcome-card {
    margin-bottom: 20px;
    background: linear-gradient(135deg, #165DFF 0%, #4080FF 100%);
    color: #fff;

    h2 {
      margin: 0 0 10px 0;
      font-size: 24px;
    }

    p {
      margin: 0;
      opacity: 0.9;
    }
  }

  .stat-row {
    margin-bottom: 20px;

    .stat-card {
      display: flex;
      align-items: center;
      border-radius: 8px;
      overflow: hidden;

      &:hover {
        transform: translateY(-2px);
      }

      :deep(.el-card__body) {
        display: flex;
        align-items: center;
        width: 100%;
        border-radius: 8px;
      }

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;

        &.blue {
          background-color: #ecf5ff;
          color: #165DFF;
        }

        &.green {
          background-color: #f0f9eb;
          color: #67c23a;
        }

        &.orange {
          background-color: #fdf6ec;
          color: #e6a23c;
        }

        .el-icon {
          font-size: 28px;
        }
      }

      .stat-info {
        .stat-value {
          font-size: 28px;
          font-weight: 600;
          color: #303133;
          line-height: 1;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }

  .action-row {
    .quick-actions {
      display: flex;
      gap: 16px;
    }

    .announcement {
      p {
        margin: 0 0 16px 0;
        color: #606266;
        line-height: 1.6;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}
</style>
