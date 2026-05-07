<template>
  <div class="terminal-manage">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button link @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2>{{ productName }} - 终端管理</h2>
      </div>
    </div>

    <!-- 左右布局 -->
    <div class="terminal-layout">
      <!-- 左侧：终端类型和版本列表 -->
      <div class="left-panel">
        <el-card class="terminal-types">
          <template #header>
            <div class="card-header">
              <span>终端列表</span>
            </div>
          </template>

          <!-- 终端列表 - 按类型分组展示 -->
          <div class="terminal-list">
            <!-- 移动端分组 -->
            <div class="terminal-group">
              <div class="group-title">
                <el-icon><Cellphone /></el-icon>
                <span>移动端</span>
              </div>
              <div class="group-items">
                <div
                  v-for="terminal in mobileTerminals"
                  :key="terminal.id"
                  :class="['terminal-item', { active: selectedTerminal?.id === terminal.id }]"
                  @click="selectTerminal(terminal)"
                >
                  <div class="terminal-info">
                    <div class="terminal-name">{{ terminal.name }}</div>
                  </div>
                  <div class="terminal-status">
                    <el-tag size="small" :type="getStatusType(terminal.status)">
                      {{ getStatusText(terminal.status) }}
                    </el-tag>
                  </div>
                </div>
                <el-empty v-if="mobileTerminals.length === 0" description="暂无移动端终端" :image-size="60" />
              </div>
            </div>

            <!-- 小程序分组 -->
            <div class="terminal-group">
              <div class="group-title">
                <el-icon><ChatDotRound /></el-icon>
                <span>小程序</span>
              </div>
              <div class="group-items">
                <div
                  v-for="terminal in miniappTerminals"
                  :key="terminal.id"
                  :class="['terminal-item', { active: selectedTerminal?.id === terminal.id }]"
                  @click="selectTerminal(terminal)"
                >
                  <div class="terminal-info">
                    <div class="terminal-name">{{ terminal.name }}</div>
                  </div>
                  <div class="terminal-status">
                    <el-tag size="small" :type="getStatusType(terminal.status)">
                      {{ getStatusText(terminal.status) }}
                    </el-tag>
                  </div>
                </div>
                <el-empty v-if="miniappTerminals.length === 0" description="暂无小程序终端" :image-size="60" />
              </div>
            </div>

            <!-- PC端分组 -->
            <div class="terminal-group">
              <div class="group-title">
                <el-icon><Monitor /></el-icon>
                <span>PC端</span>
              </div>
              <div class="group-items">
                <div
                  v-for="terminal in pcTerminals"
                  :key="terminal.id"
                  :class="['terminal-item', { active: selectedTerminal?.id === terminal.id }]"
                  @click="selectTerminal(terminal)"
                >
                  <div class="terminal-info">
                    <div class="terminal-name">{{ terminal.name }}</div>
                  </div>
                  <div class="terminal-status">
                    <el-tag size="small" :type="getStatusType(terminal.status)">
                      {{ getStatusText(terminal.status) }}
                    </el-tag>
                  </div>
                </div>
                <el-empty v-if="pcTerminals.length === 0" description="暂无PC端终端" :image-size="60" />
              </div>
            </div>
          </div>

          <!-- 添加终端按钮 - 放在左侧底部 -->
          <div class="add-terminal-footer">
            <el-button type="primary" @click="showAddTerminalDialog = true">
              <el-icon><Plus /></el-icon>
              添加终端
            </el-button>
          </div>
        </el-card>
      </div>

      <!-- 右侧：终端配置详情 -->
      <div class="right-panel">
        <el-card v-if="selectedTerminal" class="terminal-config">
          <template #header>
            <div class="card-header">
              <span>终端配置</span>
              <div class="header-actions">
                <el-button
                  v-if="selectedTerminal.status === 0"
                  type="success"
                  size="small"
                  @click="handlePublish"
                >
                  发布
                </el-button>
                <el-button
                  v-if="selectedTerminal.status === 1"
                  type="warning"
                  size="small"
                  @click="handleUnpublish"
                >
                  下架
                </el-button>
                <el-button type="danger" size="small" @click="handleDelete">删除</el-button>
              </div>
            </div>
          </template>

          <el-tabs v-model="activeConfigTab">
            <!-- 基本信息 -->
            <el-tab-pane label="基本信息" name="basic">
              <el-form :model="configForm" label-width="120px" class="config-form">
                <el-form-item label="终端名称">
                  <el-input v-model="configForm.name" placeholder="请输入终端名称" />
                </el-form-item>

                <el-form-item label="终端类型">
                  <el-input :model-value="getTerminalTypeText(configForm.type)" disabled style="width: 100%" />
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" @click="saveBasicConfig">保存基本信息</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <!-- 场景配置 -->
            <el-tab-pane label="场景配置" name="scenario">
              <el-form label-width="120px" class="config-form">
                <el-form-item label="选择场景方案">
                  <el-select
                    v-model="configForm.scenarioId"
                    placeholder="请选择场景方案"
                    clearable
                    style="width: 100%"
                  >
                    <el-option
                      v-for="scenario in scenarios"
                      :key="scenario.id"
                      :label="scenario.name"
                      :value="scenario.id"
                    />
                  </el-select>
                  <span class="form-tip">选择后该终端将使用场景方案的配置</span>
                </el-form-item>

                <el-form-item v-if="selectedScenario">
                  <el-card class="scenario-preview">
                    <template #header>
                      <span>场景方案预览：{{ selectedScenario.name }}</span>
                    </template>
                    <div class="scenario-info">
                      <p><strong>场景编码：</strong>{{ selectedScenario.code }}</p>
                      <p>
                        <strong>登录身份：</strong>
                        <el-tag
                          :type="hasScenarioLoginIdentityConfig(selectedScenario) ? 'success' : 'info'"
                          size="small"
                        >
                          {{ formatScenarioLoginIdentitySummary(selectedScenario.loginIdentityConfig) }}
                        </el-tag>
                      </p>
                      <p>
                        <strong>H5门户：</strong>
                        <el-tag v-if="selectedScenario.h5PortalConfig" type="success" size="small">已配置</el-tag>
                        <el-tag v-else type="info" size="small">未配置</el-tag>
                      </p>
                      <p>
                        <strong>PC门户：</strong>
                        <el-tag v-if="selectedScenario.pcPortalConfig" type="success" size="small">已配置</el-tag>
                        <el-tag v-else type="info" size="small">未配置</el-tag>
                      </p>
                    </div>
                  </el-card>
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" @click="saveScenarioConfig">保存场景配置</el-button>
                  <el-button link @click="goToScenarioManage">
                    <el-icon><Link /></el-icon>
                    管理场景方案
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <!-- 登录配置 -->
            <el-tab-pane label="登录配置" name="login">
              <el-alert
                v-if="configForm.scenarioId"
                title="当前终端已绑定场景方案，登录配置将优先使用场景方案的配置"
                type="info"
                :closable="false"
                style="margin-bottom: 20px"
              />
              <el-form :model="loginConfigForm" label-width="150px" class="config-form">
                <el-divider content-position="left">登录方式</el-divider>

                <el-form-item label="账号密码登录">
                  <el-switch v-model="loginConfigForm.loginMethods.password" />
                </el-form-item>

                <el-form-item label="短信验证码登录">
                  <el-switch v-model="loginConfigForm.loginMethods.sms" />
                </el-form-item>

                <el-form-item label="微信登录">
                  <el-switch v-model="loginConfigForm.loginMethods.wechat" />
                </el-form-item>

                <el-form-item label="单点登录(SSO)">
                  <el-switch v-model="loginConfigForm.loginMethods.sso" />
                </el-form-item>

                <el-divider content-position="left">密码策略</el-divider>

                <el-form-item label="最小长度">
                  <el-input-number v-model="loginConfigForm.passwordPolicy.minLength" :min="6" :max="20" />
                </el-form-item>

                <el-form-item label="必须包含大写字母">
                  <el-switch v-model="loginConfigForm.passwordPolicy.requireUppercase" />
                </el-form-item>

                <el-form-item label="必须包含小写字母">
                  <el-switch v-model="loginConfigForm.passwordPolicy.requireLowercase" />
                </el-form-item>

                <el-form-item label="必须包含数字">
                  <el-switch v-model="loginConfigForm.passwordPolicy.requireNumber" />
                </el-form-item>

                <el-form-item label="必须包含特殊字符">
                  <el-switch v-model="loginConfigForm.passwordPolicy.requireSpecialChar" />
                </el-form-item>

                <el-divider content-position="left">验证码配置</el-divider>

                <el-form-item label="启用验证码">
                  <el-switch v-model="loginConfigForm.captchaConfig.enabled" />
                </el-form-item>

                <el-form-item label="验证码类型" v-if="loginConfigForm.captchaConfig.enabled">
                  <el-radio-group v-model="loginConfigForm.captchaConfig.type">
                    <el-radio-button label="image">图形验证码</el-radio-button>
                    <el-radio-button label="slider">滑块验证</el-radio-button>
                  </el-radio-group>
                </el-form-item>

                <el-divider content-position="left">会话配置</el-divider>

                <el-form-item label="会话超时时间(分钟)">
                  <el-input-number v-model="loginConfigForm.sessionConfig.timeout" :min="5" :max="1440" />
                </el-form-item>

                <el-form-item label="单设备登录">
                  <el-switch v-model="loginConfigForm.sessionConfig.singleDevice" />
                  <span class="form-tip">开启后同一账号只能在一个设备登录</span>
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" @click="saveLoginConfig">保存登录配置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </el-card>

        <el-card v-else class="terminal-config empty">
          <el-empty description="请从左侧选择一个终端进行配置" />
        </el-card>
      </div>
    </div>

    <!-- 添加终端对话框 -->
    <el-dialog
      v-model="showAddTerminalDialog"
      title="添加终端"
      width="500px"
    >
      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="100px">
        <!-- 终端类型选择 - 仅支持移动端、小程序、PC端 -->
        <el-form-item label="终端类型" prop="type">
          <el-radio-group v-model="addForm.type">
            <el-radio-button :label="1">移动端</el-radio-button>
            <el-radio-button :label="2">小程序</el-radio-button>
            <el-radio-button :label="3">PC端</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 终端名称 -->
        <el-form-item label="终端名称" prop="name">
          <el-input v-model="addForm.name" placeholder="请输入终端名称" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddTerminalDialog = false">取消</el-button>
        <el-button type="primary" :loading="addLoading" @click="handleAddTerminal">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowLeft, Link, Cellphone, ChatDotRound, Monitor } from '@element-plus/icons-vue'
import * as productApi from '@/api/product'
import * as scenarioApi from '@/api/scenario'
import type { Terminal } from '@/api/product'
import type { Scenario } from '@/api/scenario'

// 路由
const route = useRoute()
const router = useRouter()
const productId = computed(() => parseInt(route.params.id as string))

// 产品名称
const productName = ref('')

// 状态
const loading = ref(false)
const addLoading = ref(false)
const terminals = ref<Terminal[]>([])
const selectedTerminal = ref<Terminal | null>(null)
const scenarios = ref<Scenario[]>([])

// 标签页
const activeConfigTab = ref('basic')

// 添加终端对话框
const showAddTerminalDialog = ref(false)
const addFormRef = ref()
const addForm = reactive({
  type: 1 as 1 | 2 | 3, // 1-移动端 2-小程序 3-PC端
  name: ''
})

const addRules = {
  type: [{ required: true, message: '请选择终端类型', trigger: 'change' }],
  name: [{ required: true, message: '请输入终端名称', trigger: 'blur' }]
}

// 配置表单
const configForm = reactive({
  id: 0,
  name: '',
  type: 1 as 1 | 2 | 3,
  scenarioId: undefined as number | undefined
})

// 选中的场景方案
const selectedScenario = computed(() => {
  return scenarios.value.find(s => s.id === configForm.scenarioId)
})

// 格式化场景登录身份摘要，用于终端绑定场景时预览生效身份范围。
const formatScenarioLoginIdentitySummary = (configText?: string) => {
  return scenarioApi.formatScenarioLoginIdentitySummary(configText)
}

// 判断场景是否存在有效身份白名单，用于区分已配置和未配置状态。
const hasScenarioLoginIdentityConfig = (scenario: Scenario) => {
  return scenarioApi.parseScenarioLoginIdentityConfig(scenario.loginIdentityConfig).identityTypes.length > 0
}

// 登录配置表单
const loginConfigForm = reactive({
  loginMethods: {
    password: true,
    sms: false,
    wechat: false,
    sso: false
  },
  passwordPolicy: {
    minLength: 8,
    requireUppercase: false,
    requireLowercase: false,
    requireNumber: true,
    requireSpecialChar: false
  },
  captchaConfig: {
    enabled: true,
    type: 'image' as 'image' | 'slider'
  },
  sessionConfig: {
    timeout: 30,
    singleDevice: false
  }
})

// 终端类型映射
const terminalTypeMap: Record<number, string> = {
  1: '移动端',
  2: '小程序',
  3: 'PC端'
}

// 获取终端类型文本
const getTerminalTypeText = (type?: number): string => {
  if (!type) return '-'
  return terminalTypeMap[type] || '未知'
}

// 获取状态文本
const getStatusText = (status: number): string => {
  const statusMap: Record<number, string> = {
    0: '草稿',
    1: '已发布',
    2: '已下架'
  }
  return statusMap[status] || '未知'
}

// 获取状态标签类型
const getStatusType = (status: number): string => {
  const typeMap: Record<number, string> = {
    0: 'info',
    1: 'success',
    2: 'warning'
  }
  return typeMap[status] || 'info'
}

// 按类型分组的终端列表
const mobileTerminals = computed(() => {
  return terminals.value.filter(t => t.type === 1)
})

const miniappTerminals = computed(() => {
  return terminals.value.filter(t => t.type === 2)
})

const pcTerminals = computed(() => {
  return terminals.value.filter(t => t.type === 3)
})

// 获取终端列表
const fetchTerminals = async () => {
  loading.value = true
  try {
    const res = await productApi.getTerminals(productId.value)
    terminals.value = res
  } catch (error) {
    console.error('获取终端列表失败:', error)
    ElMessage.error('获取终端列表失败')
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

// 获取场景方案列表
const fetchScenarios = async () => {
  try {
    const res = await scenarioApi.getScenarios(productId.value)
    scenarios.value = res
  } catch (error) {
    console.error('获取场景方案列表失败:', error)
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 选择终端
const selectTerminal = (terminal: Terminal) => {
  selectedTerminal.value = terminal
  // 填充配置表单
  configForm.id = terminal.id
  configForm.name = terminal.name
  configForm.type = terminal.type as 1 | 2 | 3
  configForm.scenarioId = terminal.scenarioId

  // 解析登录配置
  if (terminal.loginConfig) {
    try {
      const config = JSON.parse(terminal.loginConfig)
      Object.assign(loginConfigForm, config)
    } catch {
      // 使用默认值
    }
  }
}

// 添加终端
const handleAddTerminal = async () => {
  if (!addFormRef.value) return

  try {
    await addFormRef.value.validate()
    addLoading.value = true

    await productApi.createTerminal(productId.value, {
      name: addForm.name,
      type: addForm.type
    })

    ElMessage.success('创建成功')
    showAddTerminalDialog.value = false
    addFormRef.value.resetFields()
    addForm.type = 1
    fetchTerminals()
  } catch (error: any) {
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    addLoading.value = false
  }
}

// 保存基本配置
const saveBasicConfig = async () => {
  if (!selectedTerminal.value) return

  try {
    await productApi.updateTerminal(productId.value, selectedTerminal.value.id, {
      name: configForm.name
    })
    ElMessage.success('保存成功')
    fetchTerminals()
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败')
  }
}

// 保存登录配置
const saveLoginConfig = async () => {
  if (!selectedTerminal.value) return

  try {
    await productApi.updateTerminal(productId.value, selectedTerminal.value.id, {
      loginConfig: JSON.stringify(loginConfigForm)
    })
    ElMessage.success('保存成功')
    fetchTerminals()
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败')
  }
}

// 发布终端
const handlePublish = async () => {
  if (!selectedTerminal.value) return

  try {
    await ElMessageBox.confirm('确定要发布该终端吗？', '提示', { type: 'info' })
    await productApi.updateTerminal(productId.value, selectedTerminal.value.id, { status: 1 })
    ElMessage.success('发布成功')
    fetchTerminals()
    selectedTerminal.value.status = 1
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '发布失败')
    }
  }
}

// 下架终端
const handleUnpublish = async () => {
  if (!selectedTerminal.value) return

  try {
    await ElMessageBox.confirm('确定要下架该终端吗？', '提示', { type: 'warning' })
    await productApi.updateTerminal(productId.value, selectedTerminal.value.id, { status: 2 })
    ElMessage.success('下架成功')
    fetchTerminals()
    selectedTerminal.value.status = 2
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '下架失败')
    }
  }
}

// 删除终端
const handleDelete = async () => {
  if (!selectedTerminal.value) return

  try {
    await ElMessageBox.confirm('确定要删除该终端吗？', '提示', { type: 'warning' })
    await productApi.deleteTerminal(productId.value, selectedTerminal.value.id)
    ElMessage.success('删除成功')
    selectedTerminal.value = null
    fetchTerminals()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 保存场景配置
const saveScenarioConfig = async () => {
  if (!selectedTerminal.value) return

  try {
    await productApi.updateTerminal(productId.value, selectedTerminal.value.id, {
      scenarioId: configForm.scenarioId
    })
    ElMessage.success('保存成功')
    fetchTerminals()
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败')
  }
}

// 跳转到场景方案管理
const goToScenarioManage = () => {
  router.push(`/products/${productId.value}/scenarios`)
}

// 监听对话框关闭
watch(showAddTerminalDialog, (val) => {
  if (!val) {
    addFormRef.value?.resetFields()
    addForm.type = 1
  }
})

// 初始化
onMounted(() => {
  fetchProductDetail()
  fetchTerminals()
  fetchScenarios()
})
</script>

<style scoped lang="scss">
.terminal-manage {
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

  .terminal-layout {
    display: flex;
    gap: 20px;
    flex: 1;
    min-height: 0;

    .left-panel {
      width: 320px;
      flex-shrink: 0;

      .terminal-types {
        height: 100%;
        display: flex;
        flex-direction: column;

        :deep(.el-card__body) {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 0;
          overflow: hidden;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .terminal-list {
          flex: 1;
          overflow-y: auto;
          padding: 16px;

          .terminal-group {
            margin-bottom: 20px;

            &:last-child {
              margin-bottom: 0;
            }

            .group-title {
              display: flex;
              align-items: center;
              gap: 8px;
              font-weight: 500;
              font-size: 14px;
              color: #303133;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 1px solid #ebeef5;

              .el-icon {
                font-size: 16px;
                color: #409eff;
              }
            }

            .group-items {
              .terminal-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 12px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s;
                margin-bottom: 6px;

                &:hover {
                  background-color: #f5f7fa;
                }

                &.active {
                  background-color: #ecf5ff;
                  border: 1px solid #409eff;
                }

                .terminal-info {
                  flex: 1;

                  .terminal-name {
                    font-weight: 500;
                    font-size: 14px;
                  }
                }

                .terminal-status {
                  flex-shrink: 0;
                }
              }

              .el-empty {
                padding: 20px 0;
              }
            }
          }
        }

        .add-terminal-footer {
          padding: 16px;
          border-top: 1px solid #ebeef5;
          text-align: center;

          .el-button {
            width: 100%;
          }
        }
      }
    }

    .right-panel {
      flex: 1;
      min-width: 0;

      .terminal-config {
        height: 100%;

        &.empty {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        :deep(.el-card__body) {
          height: calc(100% - 55px);
          overflow-y: auto;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .header-actions {
            display: flex;
            gap: 8px;
          }
        }

        .config-form {
          max-width: 600px;
          padding: 20px 0;
        }
      }
    }
  }

  .form-tip {
    margin-left: 8px;
    color: #909399;
    font-size: 12px;
  }
}
</style>
