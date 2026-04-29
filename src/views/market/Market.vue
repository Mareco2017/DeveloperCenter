<template>
  <div class="capability-market">
    <h2>能力市场</h2>

    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索能力名称或编码"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button @click="handleSearch">
            <el-icon><Search /></el-icon>
          </el-button>
        </template>
      </el-input>
    </el-card>

    <!-- 能力列表 -->
    <div v-loading="loading" class="capability-grid">
      <el-empty v-if="!loading && capabilityList.length === 0" description="暂无能力" />
      
      <el-row :gutter="20">
        <el-col
          v-for="item in capabilityList"
          :key="item.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <el-card class="capability-card" shadow="hover" @click="handleViewDetail(item)">
            <div class="card-header">
              <el-avatar
                :size="48"
                :src="item.iconUrl"
                :icon="MagicStick"
                class="capability-icon"
              />
              <div class="capability-info">
                <h3 class="capability-name">{{ item.name }}</h3>
                <p class="capability-code">{{ item.code }}</p>
              </div>
            </div>
            <p class="capability-desc">{{ item.description || '暂无描述' }}</p>
            <div class="card-footer">
              <el-tag type="success" size="small">已发布</el-tag>
              <span class="create-time">{{ formatDate(item.createdAt) }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[12, 24, 36, 48]"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 能力详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="能力详情"
      width="700px"
    >
      <div v-if="currentCapability" class="detail-content">
        <div class="detail-header">
          <el-avatar
            :size="64"
            :src="currentCapability.iconUrl"
            :icon="MagicStick"
          />
          <div class="detail-info">
            <h2>{{ currentCapability.name }}</h2>
            <p class="detail-code">{{ currentCapability.code }}</p>
            <el-tag type="success">已发布</el-tag>
          </div>
        </div>

        <el-divider />

        <div class="detail-section">
          <h4>能力描述</h4>
          <p>{{ currentCapability.description || '暂无描述' }}</p>
        </div>

        <div class="detail-section">
          <h4>配置包</h4>
          <el-table :data="configPackages" v-loading="configLoading" style="width: 100%">
            <el-table-column prop="name" label="配置包名称" min-width="150" />
            <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
            <el-table-column prop="items.length" label="参数数量" width="100">
              <template #default="{ row }">
                {{ row.items?.length || 0 }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, MagicStick } from '@element-plus/icons-vue'
import * as marketApi from '@/api/market'
import type { MarketCapability } from '@/api/market'

// 搜索关键词
const searchKeyword = ref('')

// 状态
const loading = ref(false)
const configLoading = ref(false)
const capabilityList = ref<MarketCapability[]>([])
const currentCapability = ref<MarketCapability | null>(null)
const configPackages = ref<any[]>([])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 12,
  total: 0
})

// 对话框显示状态
const showDetailDialog = ref(false)

/**
 * 获取能力列表
 */
const fetchCapabilityList = async () => {
  loading.value = true
  try {
    const res = await marketApi.getMarketList({
      keyword: searchKeyword.value || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    capabilityList.value = res.list
    pagination.total = res.total
  } catch (error) {
    console.error('获取能力列表失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 搜索
 */
const handleSearch = () => {
  pagination.page = 1
  fetchCapabilityList()
}

/**
 * 页码改变
 */
const handlePageChange = (page: number) => {
  pagination.page = page
  fetchCapabilityList()
}

/**
 * 每页条数改变
 */
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchCapabilityList()
}

/**
 * 查看详情
 */
const handleViewDetail = async (item: MarketCapability) => {
  currentCapability.value = item
  showDetailDialog.value = true
  fetchConfigPackages(item.id)
}

/**
 * 获取配置包列表
 */
const fetchConfigPackages = async (capabilityId: number) => {
  configLoading.value = true
  try {
    const res = await marketApi.getMarketConfigPackages(capabilityId)
    configPackages.value = res
  } catch (error) {
    console.error('获取配置包列表失败:', error)
  } finally {
    configLoading.value = false
  }
}

/**
 * 格式化日期
 */
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('zh-CN')
}

// 初始化
onMounted(() => {
  fetchCapabilityList()
})
</script>

<style scoped lang="scss">
.capability-market {
  h2 {
    margin-bottom: 20px;
  }

  .search-card {
    margin-bottom: 20px;
    max-width: 500px;
  }

  .capability-grid {
    min-height: 400px;

    .capability-card {
        margin-bottom: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        border-radius: 8px;
        overflow: hidden;

        &:hover {
          transform: translateY(-4px);
        }

      .card-header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;

        .capability-icon {
          margin-right: 16px;
          background: linear-gradient(135deg, #165DFF 0%, #4080FF 100%);
        }

        .capability-info {
          flex: 1;
          min-width: 0;

          .capability-name {
            margin: 0 0 8px;
            font-size: 16px;
            font-weight: 600;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .capability-code {
            margin: 0;
            font-size: 12px;
            color: #909399;
          }
        }
      }

      .capability-desc {
        margin: 0 0 20px;
        font-size: 14px;
        color: #606266;
        line-height: 1.6;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        min-height: 42px;
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .create-time {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  .detail-content {
    .detail-header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;

      .el-avatar {
          margin-right: 16px;
          background: linear-gradient(135deg, #165DFF 0%, #4080FF 100%);
        }

      .detail-info {
        h2 {
          margin: 0 0 8px;
          font-size: 20px;
        }

        .detail-code {
          margin: 0 0 8px;
          font-size: 14px;
          color: #909399;
        }
      }
    }

    .detail-section {
      margin-bottom: 20px;

      h4 {
        margin: 0 0 20px;
        font-size: 16px;
        color: #303133;
      }

      p {
        margin: 0;
        color: #606266;
        line-height: 1.6;
      }
    }
  }
}
</style>
