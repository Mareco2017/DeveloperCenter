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
            class="action-btn action-capability"
            size="small"
            @click="handleCapabilityConfig(scenario)"
          >
            能力配置
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
      <el-card v-if="productLoaded" class="scenario-card add-card" shadow="hover" @click="openAddDialog">
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
      @closed="resetForm"
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

    <!-- 能力配置对话框 -->
    <el-dialog
      v-model="showCapabilityConfigDialog"
      title="能力配置"
      width="720px"
      @closed="resetCapabilityConfigForm"
    >
      <div v-loading="capabilityConfigLoading" class="capability-config-panel">
        <el-empty
          v-if="!capabilityConfigLoading && productCapabilities.length === 0"
          description="该产品暂未关联能力"
        >
          <el-button type="primary" @click="goToProductCapabilityManage">
            去关联能力
          </el-button>
        </el-empty>
        <el-checkbox-group
          v-else
          v-model="selectedCapabilityIds"
          class="capability-checkbox-group"
        >
          <el-checkbox
            v-for="capability in productCapabilities"
            :key="capability.capabilityId"
            :value="capability.capabilityId"
            border
          >
            <span class="capability-option">
              <span class="capability-name">{{ capability.capabilityName }}</span>
              <span class="capability-code">{{ capability.capabilityCode }}</span>
            </span>
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <template #footer>
        <el-button @click="showCapabilityConfigDialog = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="productCapabilities.length === 0"
          :loading="capabilitySaveLoading"
          @click="saveCapabilityConfig"
        >
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
import type { Scenario, ScenarioCapability, ScenarioLoginIdentityConfig } from '@/api/scenario'
import type { ProductCapability } from '@/api/product'

// 路由
const route = useRoute()
const router = useRouter()
/**
 * 当前路由中的产品ID。
 * 场景：场景方案页依赖产品ID请求详情、列表和创建接口；非法值统一返回 null，避免继续请求后端变成“产品不存在”。
 */
const productId = computed((): number | null => {
  const rawId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
  const value = Number.parseInt(String(rawId ?? ''), 10)
  return Number.isInteger(value) && value > 0 ? value : null
})

// 产品名称
const productName = ref('')

// 状态
const loading = ref(false)
const submitLoading = ref(false)
const scenarios = ref<Scenario[]>([])
const showAddDialog = ref(false)
const isEdit = ref(false)
const productLoaded = ref(false)
const formRef = ref()

// 登录身份配置
const showLoginConfigDialog = ref(false)
const loginConfigLoading = ref(false)
const currentScenario = ref<Scenario | null>(null)
const loginConfigForm = reactive<ScenarioLoginIdentityConfig>({
  version: 1,
  identityTypes: []
})

// 能力配置
const showCapabilityConfigDialog = ref(false)
const capabilityConfigLoading = ref(false)
const capabilitySaveLoading = ref(false)
const productCapabilities = ref<ProductCapability[]>([])
const scenarioCapabilities = ref<ScenarioCapability[]>([])
const selectedCapabilityIds = ref<number[]>([])

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

/**
 * 获取当前可用产品ID。
 * 场景：所有需要产品上下文的操作前调用；依赖 route.params.id，拦截非法入口并给出前端可读提示。
 */
const requireProductId = () => {
  if (!productId.value) {
    ElMessage.error('产品ID无效，请从产品列表重新进入')
    return null
  }

  return productId.value
}

/**
 * 获取当前可用于新增/编辑场景的产品上下文。
 * 场景：产品详情拉取成功后才能继续新增场景，避免产品被删除或路由失效时继续提交。
 */
const requireProductContext = () => {
  const currentProductId = requireProductId()
  if (!currentProductId) return null

  if (!productLoaded.value) {
    ElMessage.error('产品信息未加载成功，请从产品列表重新进入')
    return null
  }

  return currentProductId
}

/**
 * 打开添加场景方案弹窗。
 * 场景：用户点击添加卡片时调用；依赖产品ID校验，避免在无效路由下继续提交创建请求。
 */
const openAddDialog = () => {
  if (!requireProductContext()) return
  resetForm()
  showAddDialog.value = true
}

// 获取场景方案列表
const fetchScenarios = async () => {
  const currentProductId = requireProductId()
  if (!currentProductId) return

  loading.value = true
  try {
    const res = await scenarioApi.getScenarios(currentProductId)
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
  const currentProductId = requireProductId()
  if (!currentProductId) return

  try {
    const res = await productApi.getProductDetail(currentProductId)
    productName.value = res.name
    productLoaded.value = true
  } catch (error) {
    productLoaded.value = false
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
  const currentProductId = requireProductContext()
  if (!currentProductId) return

  try {
    await ElMessageBox.confirm('确定要删除该场景方案吗？', '提示', { type: 'warning' })
    await scenarioApi.deleteScenario(currentProductId, row.id)
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
  const currentProductId = requireProductContext()
  if (!currentProductId) return

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
    await scenarioApi.updateScenario(currentProductId, currentScenario.value.id, {
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

/**
 * 打开能力配置弹窗。
 * 场景：用户在场景卡片点击“能力配置”时调用；依赖产品能力关联作为候选范围。
 */
const handleCapabilityConfig = async (scenario: Scenario) => {
  const currentProductId = requireProductContext()
  if (!currentProductId) return

  currentScenario.value = scenario
  showCapabilityConfigDialog.value = true
  await loadCapabilityConfig(currentProductId, scenario.id)
}

/**
 * 加载能力配置候选与当前场景已启用能力。
 * 关键控制点：候选来自产品已关联能力，当前值来自场景能力配置，两者分开读取后在前端合并勾选状态。
 */
const loadCapabilityConfig = async (currentProductId: number, scenarioId: number) => {
  capabilityConfigLoading.value = true
  try {
    const [productCapabilityList, scenarioCapabilityList] = await Promise.all([
      productApi.getProductCapabilities(currentProductId),
      scenarioApi.getScenarioCapabilities(scenarioId)
    ])
    productCapabilities.value = productCapabilityList
    scenarioCapabilities.value = scenarioCapabilityList
    selectedCapabilityIds.value = scenarioCapabilityList
      .filter(capability => capability.status === 1)
      .map(capability => capability.capabilityId)
  } catch (error: any) {
    console.error('获取能力配置失败:', error)
    ElMessage.error(error.message || '获取能力配置失败')
  } finally {
    capabilityConfigLoading.value = false
  }
}

/**
 * 保存场景能力配置。
 * 场景：用户通过多选列表决定当前场景启用哪些能力；依赖后端再次校验能力是否属于当前产品。
 */
const saveCapabilityConfig = async () => {
  if (!currentScenario.value) return
  const currentProductId = requireProductContext()
  if (!currentProductId) return

  capabilitySaveLoading.value = true
  try {
    const selectedIds = new Set(selectedCapabilityIds.value)
    const existingByCapabilityId = new Map(
      scenarioCapabilities.value.map(capability => [capability.capabilityId, capability])
    )

    /**
     * 关键控制点：差量同步避免重复添加。
     * 已存在但未勾选的场景能力会被移除；历史禁用记录重新勾选时恢复为启用。
     */
    for (const existing of scenarioCapabilities.value) {
      if (!selectedIds.has(existing.capabilityId)) {
        await scenarioApi.removeScenarioCapability(currentScenario.value.id, existing.id)
      } else if (existing.status !== 1) {
        await scenarioApi.updateScenarioCapability(currentScenario.value.id, existing.id, { status: 1 })
      }
    }

    for (const capabilityId of selectedIds) {
      if (!existingByCapabilityId.has(capabilityId)) {
        await scenarioApi.addScenarioCapability(currentScenario.value.id, { capabilityId })
      }
    }

    ElMessage.success('保存成功')
    showCapabilityConfigDialog.value = false
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    capabilitySaveLoading.value = false
  }
}

/**
 * 重置能力配置弹窗状态。
 * 场景：弹窗关闭动画结束后清理临时选择，避免下次打开时闪现上一个场景的配置。
 */
const resetCapabilityConfigForm = () => {
  productCapabilities.value = []
  scenarioCapabilities.value = []
  selectedCapabilityIds.value = []
}

/**
 * 跳转到产品能力管理。
 * 场景：当前产品尚未关联任何能力时，给运营人员一个明确的上游配置入口。
 */
const goToProductCapabilityManage = () => {
  const currentProductId = requireProductContext()
  if (!currentProductId) return

  showCapabilityConfigDialog.value = false
  router.push(`/products/${currentProductId}/capabilities`)
}

// 移动端门户配置
const handleH5Portal = (scenario: Scenario) => {
  const currentProductId = requireProductContext()
  if (!currentProductId) return

  // 在新标签页打开移动端门户配置
  const url = `/portal-designer/h5?scenarioId=${scenario.id}&productId=${currentProductId}`
  window.open(url, '_blank')
}

// PC端门户配置
const handlePcPortal = (scenario: Scenario) => {
  const currentProductId = requireProductContext()
  if (!currentProductId) return

  // 在新标签页打开PC端门户配置
  const url = `/portal-designer/pc?scenarioId=${scenario.id}&productId=${currentProductId}`
  window.open(url, '_blank')
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  const currentProductId = requireProductContext()
  if (!currentProductId) return

  try {
    await formRef.value.validate()
    submitLoading.value = true

    if (isEdit.value) {
      await scenarioApi.updateScenario(currentProductId, form.id, {
        name: form.name
      })
      ElMessage.success('更新成功')
    } else {
      await scenarioApi.createScenario(currentProductId, {
        code: form.code,
        name: form.name
      })
      ElMessage.success('创建成功')
    }

    showAddDialog.value = false
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

/**
 * 加载当前产品的场景页数据。
 * 场景：首次进入和路由参数变化时调用；依赖 productId 校验，保证页面不会沿用旧产品的列表状态。
 */
const loadPageData = async () => {
  if (!productId.value) {
    productName.value = ''
    scenarios.value = []
    productLoaded.value = false
    ElMessage.error('产品ID无效，请从产品列表重新进入')
    return
  }

  productLoaded.value = false
  // 关键控制点：先确认产品存在，再拉场景列表，避免不存在的产品页重复弹“产品不存在”。
  await fetchProductDetail()
  if (productLoaded.value) {
    await fetchScenarios()
  }
}

// 初始化
onMounted(() => {
  loadPageData()
})

// 路由复用时重新加载当前产品数据，避免二次进入仍沿用旧产品上下文。
watch(() => route.params.id, () => {
  loadPageData()
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
        flex-wrap: wrap;
        gap: 8px;

        .action-btn {
          flex: 1 1 calc(50% - 4px);
          justify-content: center;
          padding: 8px;

          &.action-login {
            color: #409eff;
            border-color: #409eff;

            &:hover {
              background-color: #ecf5ff;
            }
          }

          &.action-capability {
            color: #e6a23c;
            border-color: #e6a23c;

            &:hover {
              background-color: #fdf6ec;
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

  .capability-config-panel {
    min-height: 180px;

    .capability-checkbox-group {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      width: 100%;

      .el-checkbox {
        align-items: flex-start;
        height: auto;
        min-height: 56px;
        margin-right: 0;
        padding: 10px 12px;
      }
    }

    .capability-option {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;

      .capability-name {
        font-size: 14px;
        line-height: 1.4;
        color: #303133;
      }

      .capability-code {
        max-width: 260px;
        overflow: hidden;
        font-size: 12px;
        line-height: 1.3;
        color: #909399;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
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
