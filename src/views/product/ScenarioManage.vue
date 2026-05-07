<template>
  <div class="scenario-manage">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button link @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2>{{ productName }} - 场景方案配置</h2>
      </div>
    </div>

    <!-- 场景方案卡片列表 -->
    <div class="scenario-cards">
      <el-card
        v-for="scenario in scenarios"
        :key="scenario.id"
        class="scenario-card"
        shadow="hover"
      >
        <!-- 右上角编辑删除按钮 -->
        <div class="card-top-actions">
          <el-button link type="primary" @click="handleEdit(scenario)">
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-button link type="danger" @click="handleDelete(scenario)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>

        <div class="card-header">
          <div class="scenario-title">
            <span class="scenario-name">{{ scenario.name }}</span>
            <div class="scenario-subtitle">
              <el-tag size="small" type="info">{{ scenario.code }}</el-tag>
            </div>
            <div class="scenario-time">
              <span class="create-time">{{ formatDate(scenario.createdAt) }}</span>
            </div>
            <div class="scenario-identity">
              <span class="identity-label">登录身份</span>
              <el-tag
                size="small"
                :type="hasLoginIdentityConfig(scenario) ? 'success' : 'info'"
              >
                {{ formatScenarioLoginIdentitySummary(scenario.loginIdentityConfig) }}
              </el-tag>
            </div>
          </div>
        </div>

        <el-divider class="card-divider" />

        <div class="scenario-actions-row">
          <el-button 
            class="action-btn action-login" 
            size="small"
            @click="handleLoginConfig(scenario)"
          >
            登录身份
          </el-button>
          <el-button 
            class="action-btn action-h5" 
            size="small"
            @click="handleH5Portal(scenario)"
          >
            移动端门户
          </el-button>
          <el-button 
            class="action-btn action-pc" 
            size="small"
            @click="handlePcPortal(scenario)"
          >
            PC端门户
          </el-button>
        </div>
      </el-card>

      <!-- 添加场景方案卡片 -->
      <el-card class="scenario-card add-card" shadow="hover" @click="showAddDialog = true">
        <div class="add-content">
          <el-icon class="add-icon"><Plus /></el-icon>
          <span class="add-text">添加场景方案</span>
        </div>
      </el-card>
    </div>

    <el-empty v-if="!loading && scenarios.length === 0" description="暂无场景方案" />

    <!-- 添加/编辑场景方案对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="isEdit ? '编辑场景方案' : '添加场景方案'"
      width="500px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="场景编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入场景编码" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="场景名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入场景名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 登录身份配置对话框 -->
    <el-dialog
      v-model="showLoginConfigDialog"
      title="登录身份配置"
      width="700px"
    >
      <el-form :model="loginConfigForm" label-width="120px" class="identity-config-form">
        <el-form-item label="允许身份">
          <el-checkbox-group v-model="loginConfigForm.identityTypes" class="identity-checkbox-group">
            <el-checkbox
              v-for="identity in scenarioApi.LOGIN_IDENTITY_OPTIONS"
              :key="identity.code"
              :value="identity.code"
              border
            >
              {{ identity.label }}
            </el-checkbox>
          </el-checkbox-group>
          <span class="form-tip">保存后，该场景只允许所选身份的账号登录。</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLoginConfigDialog = false">取消</el-button>
        <el-button type="primary" :loading="loginConfigLoading" @click="saveLoginConfig">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowLeft, Edit, Delete } from '@element-plus/icons-vue'
import * as scenarioApi from '@/api/scenario'
import * as productApi from '@/api/product'
import type { Scenario, ScenarioLoginIdentityConfig } from '@/api/scenario'

// 路由
const route = useRoute()
const router = useRouter()
const productId = computed(() => parseInt(route.params.id as string))

// 产品名称
const productName = ref('')

// 状态
const loading = ref(false)
const submitLoading = ref(false)
const scenarios = ref<Scenario[]>([])
const showAddDialog = ref(false)
const isEdit = ref(false)
const formRef = ref()

// 登录身份配置
const showLoginConfigDialog = ref(false)
const loginConfigLoading = ref(false)
const currentScenario = ref<Scenario | null>(null)
const loginConfigForm = reactive<ScenarioLoginIdentityConfig>({
  version: 1,
  identityTypes: []
})

// 表单
const form = reactive({
  id: 0,
  code: '',
  name: ''
})

const rules = {
  code: [{ required: true, message: '请输入场景编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入场景名称', trigger: 'blur' }]
}

// 获取场景方案列表
const fetchScenarios = async () => {
  loading.value = true
  try {
    const res = await scenarioApi.getScenarios(productId.value)
    scenarios.value = res
  } catch (error) {
    console.error('获取场景方案列表失败:', error)
    ElMessage.error('获取场景方案列表失败')
  } finally {
    loading.value = false
  }
}

// 获取产品详情
const fetchProductDetail = async () => {
  try {
    const res = await productApi.getProductDetail(productId.value)
    productName.value = res.name
  } catch (error) {
    console.error('获取产品详情失败:', error)
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

// 格式化登录身份摘要，场景卡片中用于快速判断配置状态。
const formatScenarioLoginIdentitySummary = (configText?: string) => {
  return scenarioApi.formatScenarioLoginIdentitySummary(configText)
}

// 判断场景是否已经配置有效身份，用于控制摘要标签状态。
const hasLoginIdentityConfig = (scenario: Scenario) => {
  return scenarioApi.parseScenarioLoginIdentityConfig(scenario.loginIdentityConfig).identityTypes.length > 0
}

// 编辑场景方案
const handleEdit = (row: Scenario) => {
  isEdit.value = true
  form.id = row.id
  form.code = row.code
  form.name = row.name
  showAddDialog.value = true
}

// 删除场景方案
const handleDelete = async (row: Scenario) => {
  try {
    await ElMessageBox.confirm('确定要删除该场景方案吗？', '提示', { type: 'warning' })
    await scenarioApi.deleteScenario(productId.value, row.id)
    ElMessage.success('删除成功')
    fetchScenarios()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 登录身份配置
const handleLoginConfig = (scenario: Scenario) => {
  currentScenario.value = scenario
  // 打开配置时统一解析，旧版登录方式/密码策略结构会被识别为未配置。
  const config = scenarioApi.parseScenarioLoginIdentityConfig(scenario.loginIdentityConfig)
  loginConfigForm.version = config.version
  loginConfigForm.identityTypes = [...config.identityTypes]
  showLoginConfigDialog.value = true
}

// 保存登录身份配置
const saveLoginConfig = async () => {
  if (!currentScenario.value) return
  if (loginConfigForm.identityTypes.length === 0) {
    ElMessage.warning('请至少选择一个登录身份')
    return
  }
  
  loginConfigLoading.value = true
  try {
    // 保存为 version=1 的身份白名单结构，覆盖旧版登录方式/密码策略配置。
    const config: ScenarioLoginIdentityConfig = {
      version: 1,
      identityTypes: [...loginConfigForm.identityTypes]
    }
    await scenarioApi.updateScenario(productId.value, currentScenario.value.id, {
      loginIdentityConfig: JSON.stringify(config)
    })
    ElMessage.success('保存成功')
    showLoginConfigDialog.value = false
    fetchScenarios()
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    loginConfigLoading.value = false
  }
}

// 移动端门户配置
const handleH5Portal = (scenario: Scenario) => {
  // 在新标签页打开移动端门户配置
  const url = `/portal-designer/h5?scenarioId=${scenario.id}&productId=${productId.value}`
  window.open(url, '_blank')
}

// PC端门户配置
const handlePcPortal = (scenario: Scenario) => {
  // 在新标签页打开PC端门户配置
  const url = `/portal-designer/pc?scenarioId=${scenario.id}&productId=${productId.value}`
  window.open(url, '_blank')
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitLoading.value = true

    if (isEdit.value) {
      await scenarioApi.updateScenario(productId.value, form.id, {
        name: form.name
      })
      ElMessage.success('更新成功')
    } else {
      await scenarioApi.createScenario(productId.value, {
        code: form.code,
        name: form.name
      })
      ElMessage.success('创建成功')
    }

    showAddDialog.value = false
    resetForm()
    fetchScenarios()
  } catch (error: any) {
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    submitLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  form.id = 0
  form.code = ''
  form.name = ''
  isEdit.value = false
  formRef.value?.resetFields()
}

// 监听对话框关闭
watch(showAddDialog, (val) => {
  if (!val) {
    resetForm()
  }
})

// 初始化
onMounted(() => {
  fetchProductDetail()
  fetchScenarios()
})
</script>

<style scoped lang="scss">
.scenario-manage {
  padding: 0;
  height: calc(100vh - 84px);
  display: flex;
  flex-direction: column;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-shrink: 0;

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

  .scenario-cards {
    flex: 1;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, 280px);
    grid-auto-rows: min-content;
    gap: 20px;
    padding-bottom: 20px;
    align-content: flex-start;

    .scenario-card {
      cursor: default;
      transition: all 0.3s;
      width: 280px;

      &:hover {
        transform: translateY(-2px);
      }

      :deep(.el-card__body) {
        padding: 16px;
        position: relative;
      }

      .card-top-actions {
        position: absolute;
        top: 12px;
        right: 12px;
        display: flex;
        gap: 4px;
        z-index: 1;

        .el-button {
          padding: 4px;
        }
      }

      .card-header {
        margin-bottom: 8px;
        padding-right: 60px;

        .scenario-title {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;

          .scenario-name {
            font-size: 16px;
            font-weight: 500;
            color: #303133;
          }

          .scenario-subtitle {
            display: flex;
            align-items: center;
            gap: 8px;

            .el-tag {
              flex-shrink: 0;
            }
          }

          .scenario-time {
            .create-time {
              font-size: 12px;
              color: #909399;
            }
          }

          .scenario-identity {
            display: flex;
            align-items: center;
            gap: 6px;
            max-width: 100%;

            .identity-label {
              flex-shrink: 0;
              font-size: 12px;
              color: #909399;
            }

            .el-tag {
              max-width: 170px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
        }
      }

      .card-divider {
        margin: 12px 0;
      }

      .scenario-actions-row {
        display: flex;
        flex-direction: row;
        gap: 8px;

        .action-btn {
          flex: 1;
          justify-content: center;
          padding: 8px;

          &.action-login {
            color: #409eff;
            border-color: #409eff;

            &:hover {
              background-color: #ecf5ff;
            }
          }

          &.action-h5 {
            color: #67c23a;
            border-color: #67c23a;

            &:hover {
              background-color: #f0f9eb;
            }
          }

          &.action-pc {
            color: #409eff;
            border-color: #409eff;

            &:hover {
              background-color: #ecf5ff;
            }
          }
        }
      }

      &.add-card {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 280px;
        min-height: 140px;
        border: 2px dashed #dcdfe6;
        background-color: #f5f7fa;
        cursor: pointer;

        &:hover {
          border-color: #409eff;
          background-color: #ecf5ff;
        }

        .add-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: #909399;

          .add-icon {
            font-size: 32px;
          }

          .add-text {
            font-size: 14px;
          }
        }
      }
    }
  }

  .el-empty {
    flex: 1;
  }

  .form-tip {
    margin-left: 8px;
    color: #909399;
    font-size: 12px;
  }

  .identity-config-form {
    .identity-checkbox-group {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      width: 100%;

      .el-checkbox {
        margin-right: 0;
      }
    }

    .form-tip {
      display: block;
      margin: 10px 0 0;
      line-height: 1.5;
    }
  }
}
</style>
