<template>
  <div class="capability-manage">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button link @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2>{{ productName }} - 能力管理</h2>
      </div>
      <el-button type="primary" @click="showBindDialog = true">
        <el-icon><Plus /></el-icon>
        绑定能力
      </el-button>
    </div>

    <!-- 能力列表 -->
    <el-card class="capability-list-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>已绑定能力</span>
          <el-tag type="info">共 {{ productCapabilities.length }} 个</el-tag>
        </div>
      </template>

      <!-- 空状态 -->
      <el-empty v-if="productCapabilities.length === 0" description="暂无绑定能力，请点击上方按钮绑定能力" />

      <!-- 能力卡片列表 -->
      <div v-else class="capability-grid">
        <el-card
          v-for="item in productCapabilities"
          :key="item.id"
          class="capability-card"
          shadow="hover"
        >
          <div class="capability-card-content">
            <div class="capability-info">
              <div class="capability-header">
                <h4 class="capability-name">{{ item.capabilityName }}</h4>
                <el-tag size="small" type="info">{{ item.capabilityCode }}</el-tag>
              </div>
              <div class="capability-meta">
                <span class="meta-item">
                  <el-icon><Clock /></el-icon>
                  绑定时间：{{ formatDate(item.createdAt) }}
                </span>
              </div>
            </div>
            <div class="capability-actions">
              <el-button
                type="danger"
                link
                size="small"
                @click="handleUnbind(item)"
              >
                解绑
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </el-card>

    <!-- 绑定能力对话框 -->
    <el-dialog
      v-model="showBindDialog"
      title="绑定能力"
      width="500px"
    >
      <el-form ref="bindFormRef" :model="bindForm" :rules="bindRules" label-width="100px">
        <el-form-item label="选择能力" prop="capabilityId">
          <el-select
            v-model="bindForm.capabilityId"
            placeholder="请选择要绑定的能力"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="item in availableCapabilities"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBindDialog = false">取消</el-button>
        <el-button type="primary" :loading="bindLoading" @click="handleSubmitBind">
          绑定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowLeft, Clock } from '@element-plus/icons-vue'
import * as productApi from '@/api/product'
import * as capabilityApi from '@/api/capability'
import type { ProductCapability } from '@/api/product'
import type { Capability } from '@/api/capability'

// 路由
const route = useRoute()
const router = useRouter()
const productId = computed(() => parseInt(route.params.id as string))

// 产品名称
const productName = ref('')

// 状态
const loading = ref(false)
const bindLoading = ref(false)
const productCapabilities = ref<ProductCapability[]>([])
const availableCapabilities = ref<Capability[]>([])

// 绑定对话框
const showBindDialog = ref(false)
const bindFormRef = ref()
const bindForm = reactive({
  capabilityId: undefined as number | undefined
})

const bindRules = {
  capabilityId: [
    { required: true, message: '请选择能力', trigger: 'change' }
  ]
}

/**
 * 获取产品详情
 */
const fetchProductDetail = async () => {
  try {
    const res = await productApi.getProductDetail(productId.value)
    productName.value = res.name
  } catch (error) {
    console.error('获取产品详情失败:', error)
  }
}

/**
 * 获取产品绑定的能力列表
 */
const fetchProductCapabilities = async () => {
  loading.value = true
  try {
    const res = await productApi.getProductCapabilities(productId.value)
    productCapabilities.value = res
  } catch (error) {
    console.error('获取能力绑定列表失败:', error)
    ElMessage.error('获取能力列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * 获取可用能力列表
 */
const fetchAvailableCapabilities = async () => {
  try {
    const res = await capabilityApi.getCapabilityList({ status: 1 })
    // 过滤掉已绑定的能力
    const boundCapabilityIds = productCapabilities.value.map(item => item.capabilityId)
    availableCapabilities.value = res.filter(item => !boundCapabilityIds.includes(item.id))
  } catch (error) {
    console.error('获取能力列表失败:', error)
  }
}

/**
 * 返回上一页
 */
const goBack = () => {
  router.back()
}

/**
 * 提交绑定
 */
const handleSubmitBind = async () => {
  if (!bindFormRef.value) return

  try {
    await bindFormRef.value.validate()
    bindLoading.value = true

    await productApi.bindCapability(productId.value, {
      capabilityId: bindForm.capabilityId!
    })

    ElMessage.success('绑定成功')
    showBindDialog.value = false
    bindFormRef.value.resetFields()
    fetchProductCapabilities()
  } catch (error: any) {
    ElMessage.error(error.message || '绑定失败')
  } finally {
    bindLoading.value = false
  }
}

/**
 * 解绑能力
 */
const handleUnbind = async (row: ProductCapability) => {
  try {
    await ElMessageBox.confirm('确定要解绑该能力吗？', '提示', {
      type: 'warning'
    })

    await productApi.unbindCapability(productId.value, row.capabilityId)
    ElMessage.success('解绑成功')
    fetchProductCapabilities()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '解绑失败')
    }
  }
}

/**
 * 格式化日期
 */
const formatDate = (date: string): string => {
  return new Date(date).toLocaleString('zh-CN')
}

// 监听对话框打开，刷新可用能力列表
watch(showBindDialog, (val) => {
  if (val) {
    fetchAvailableCapabilities()
  } else {
    bindFormRef.value?.resetFields()
  }
})

// 初始化
onMounted(() => {
  fetchProductDetail()
  fetchProductCapabilities()
})
</script>

<style scoped lang="scss">
.capability-manage {
  padding: 20px;
  min-height: calc(100vh - 84px);
  background-color: #f5f7fa;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 500;
      }
    }
  }

  .capability-list-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .capability-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 16px;

      .capability-card {
        transition: all 0.3s;

        &:hover {
          transform: translateY(-2px);
        }

        .capability-card-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;

          .capability-info {
            flex: 1;
            min-width: 0;

            .capability-header {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 12px;

              .capability-name {
                margin: 0;
                font-size: 16px;
                font-weight: 500;
                color: #303133;
              }
            }

            .capability-meta {
              display: flex;
              flex-wrap: wrap;
              gap: 12px;

              .meta-item {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 13px;
                color: #909399;

                .el-icon {
                  font-size: 14px;
                }
              }
            }
          }

          .capability-actions {
            flex-shrink: 0;
            margin-left: 12px;
          }
        }
      }
    }
  }
}

// 响应式设计
@media screen and (max-width: 768px) {
  .capability-manage {
    padding: 12px;

    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;

      .header-left {
        h2 {
          font-size: 18px;
        }
      }
    }

    .capability-list-card {
      .capability-grid {
        grid-template-columns: 1fr;

        .capability-card {
          .capability-card-content {
            flex-direction: column;
            gap: 12px;

            .capability-actions {
              margin-left: 0;
              align-self: flex-end;
            }
          }
        }
      }
    }
  }
}

@media screen and (max-width: 480px) {
  .capability-manage {
    .capability-list-card {
      .capability-grid {
        .capability-card {
          .capability-card-content {
            .capability-info {
              .capability-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
              }
            }
          }
        }
      }
    }
  }
}
</style>
