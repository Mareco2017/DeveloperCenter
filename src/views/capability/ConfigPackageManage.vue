<template>
  <div class="config-package-manage">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button link @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2>{{ capabilityName }} - 配置包管理</h2>
      </div>
      <el-button type="primary" @click="handleAddConfigPackage">
        <el-icon><Plus /></el-icon>
        添加配置包
      </el-button>
    </div>

    <!-- 配置包列表 -->
    <el-card class="list-card">
      <el-table :data="configPackages" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="配置包名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="250" show-overflow-tooltip />
        <el-table-column label="参数数量" width="100">
          <template #default="{ row }">
            {{ row.items?.length || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewItems(row)">查看参数</el-button>
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty v-if="!loading && configPackages.length === 0" description="暂无配置包" />
    </el-card>

    <!-- 添加/编辑配置包对话框 -->
    <el-dialog
      v-model="showDialog"
      :title="isEdit ? '编辑配置包' : '添加配置包'"
      width="800px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="配置包名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入配置包名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="请输入配置包描述"
          />
        </el-form-item>

        <el-divider>配置参数</el-divider>

        <div
          v-for="(item, index) in form.items"
          :key="index"
          class="config-item"
        >
          <div class="config-item-row">
            <div class="config-field">
              <el-form-item
                class="config-form-item"
                :prop="`items.${index}.paramKey`"
                :rules="{ required: true, message: '请选择参数', trigger: 'change' }"
              >
                <el-select
                  v-model="item.paramKey"
                  placeholder="选择参数"
                  @change="(val: string) => handleParamChange(index, val)"
                >
                  <el-option
                    v-for="param in presetParams"
                    :key="param.paramKey"
                    :label="param.paramName"
                    :value="param.paramKey"
                  />
                </el-select>
              </el-form-item>
            </div>
            <div class="config-field">
              <el-form-item class="config-form-item">
                <el-input v-model="item.paramName" placeholder="参数名称" disabled />
              </el-form-item>
            </div>
            <div class="config-field">
              <el-form-item
                class="config-form-item"
                :prop="`items.${index}.paramType`"
                :rules="{ required: true, message: '请选择类型', trigger: 'change' }"
              >
                <el-select v-model="item.paramType" placeholder="类型" disabled>
                  <el-option label="字符" :value="1" />
                  <el-option label="布尔" :value="2" />
                  <el-option label="日期" :value="3" />
                </el-select>
              </el-form-item>
            </div>
            <div class="config-field">
              <el-form-item class="config-form-item">
                <el-input v-model="item.paramValue" placeholder="默认值" />
              </el-form-item>
            </div>
            <div class="config-field config-btn-field">
              <el-button type="danger" link @click="removeConfigItem(index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <el-button type="primary" link @click="addConfigItem">
          <el-icon><Plus /></el-icon>
          添加参数
        </el-button>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看配置参数对话框 -->
    <el-dialog
      v-model="showItemsDialog"
      title="配置参数详情"
      width="700px"
      destroy-on-close
    >
      <div v-if="currentPackage" class="package-info">
        <h4>{{ currentPackage.name }}</h4>
        <p v-if="currentPackage.description" class="description">
          {{ currentPackage.description }}
        </p>
      </div>
      <el-table :data="currentPackage?.items || []" style="width: 100%">
        <el-table-column prop="paramName" label="参数名称" min-width="150" />
        <el-table-column prop="paramKey" label="参数键" min-width="120" />
        <el-table-column prop="paramType" label="类型" width="100">
          <template #default="{ row }">
            {{ getParamTypeText(row.paramType) }}
          </template>
        </el-table-column>
        <el-table-column prop="paramValue" label="默认值" min-width="150" show-overflow-tooltip />
        <el-table-column prop="sortOrder" label="排序" width="80" />
      </el-table>
      <template #footer>
        <el-button @click="showItemsDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, ArrowLeft } from '@element-plus/icons-vue'
import * as capabilityApi from '@/api/capability'
import type { ConfigPackage, ConfigPackageItem } from '@/api/capability'

// 路由
const route = useRoute()
const router = useRouter()

// 能力ID
const capabilityId = ref<number>(0)
const capabilityName = ref<string>('')

// 状态
const loading = ref(false)
const submitting = ref(false)
const configPackages = ref<ConfigPackage[]>([])
const currentPackage = ref<ConfigPackage | null>(null)

// 对话框显示状态
const showDialog = ref(false)
const showItemsDialog = ref(false)
const isEdit = ref(false)

// 表单引用
const formRef = ref()

// 表单
const form = reactive({
  id: 0,
  name: '',
  description: '',
  items: [] as Partial<ConfigPackageItem>[]
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入配置包名称', trigger: 'blur' }
  ]
}

// 预设参数列表
const presetParams = [
  { paramKey: 'api_url', paramName: 'API地址', paramType: 1, paramValue: 'https://api.example.com' },
  { paramKey: 'timeout', paramName: '超时时间', paramType: 1, paramValue: '30' },
  { paramKey: 'max_retry', paramName: '最大重试次数', paramType: 1, paramValue: '3' },
  { paramKey: 'enable_cache', paramName: '启用缓存', paramType: 2, paramValue: 'true' },
  { paramKey: 'cache_ttl', paramName: '缓存有效期', paramType: 1, paramValue: '3600' },
  { paramKey: 'start_date', paramName: '开始日期', paramType: 3, paramValue: '' },
  { paramKey: 'end_date', paramName: '结束日期', paramType: 3, paramValue: '' },
  { paramKey: 'page_size', paramName: '每页数量', paramType: 1, paramValue: '20' },
  { paramKey: 'debug_mode', paramName: '调试模式', paramType: 2, paramValue: 'false' },
  { paramKey: 'language', paramName: '语言设置', paramType: 1, paramValue: 'zh-CN' }
]

// 参数类型文本
const paramTypeMap: Record<number, string> = {
  1: '字符',
  2: '布尔',
  3: '日期'
}

/**
 * 获取配置包列表
 */
const fetchConfigPackages = async () => {
  if (!capabilityId.value) return

  loading.value = true
  try {
    const res = await capabilityApi.getConfigPackages(capabilityId.value)
    configPackages.value = res
  } catch (error) {
    console.error('获取配置包列表失败:', error)
    ElMessage.error('获取配置包列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * 获取能力详情
 */
const fetchCapabilityDetail = async () => {
  if (!capabilityId.value) return

  try {
    const res = await capabilityApi.getCapabilityDetail(capabilityId.value)
    capabilityName.value = res.name
  } catch (error) {
    console.error('获取能力详情失败:', error)
  }
}

/**
 * 返回上一页
 */
const handleBack = () => {
  router.back()
}

/**
 * 添加配置包
 */
const handleAddConfigPackage = () => {
  isEdit.value = false
  form.id = 0
  form.name = ''
  form.description = ''
  form.items = []
  showDialog.value = true
}

/**
 * 添加配置参数项
 */
const addConfigItem = () => {
  form.items.push({
    paramKey: '',
    paramName: '',
    paramType: 1,
    paramValue: '',
    sortOrder: form.items.length
  })
}

/**
 * 移除配置参数项
 */
const removeConfigItem = (index: number) => {
  form.items.splice(index, 1)
}

/**
 * 处理参数选择变化
 * @param index 参数索引
 * @param paramKey 选中的参数键
 */
const handleParamChange = (index: number, paramKey: string) => {
  const selectedParam = presetParams.find(p => p.paramKey === paramKey)
  if (selectedParam && form.items[index]) {
    const item = form.items[index]!
    item.paramName = selectedParam.paramName
    item.paramType = selectedParam.paramType
    item.paramValue = selectedParam.paramValue
  }
}

/**
 * 提交配置包
 */
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    if (isEdit.value) {
      await capabilityApi.updateConfigPackage(
        capabilityId.value,
        form.id,
        {
          name: form.name,
          description: form.description,
          items: form.items as any
        }
      )
      ElMessage.success('更新成功')
    } else {
      await capabilityApi.createConfigPackage(capabilityId.value, {
        name: form.name,
        description: form.description,
        items: form.items as any
      })
      ElMessage.success('创建成功')
    }

    showDialog.value = false
    fetchConfigPackages()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

/**
 * 查看配置参数
 */
const handleViewItems = (row: ConfigPackage) => {
  currentPackage.value = row
  showItemsDialog.value = true
}

/**
 * 编辑配置包
 */
const handleEdit = (row: ConfigPackage) => {
  isEdit.value = true
  form.id = row.id
  form.name = row.name
  form.description = row.description || ''
  form.items = row.items?.map(item => ({ ...item })) || []
  showDialog.value = true
}

/**
 * 删除配置包
 */
const handleDelete = async (row: ConfigPackage) => {
  try {
    await ElMessageBox.confirm('确定要删除该配置包吗？', '提示', {
      type: 'warning'
    })

    await capabilityApi.deleteConfigPackage(capabilityId.value, row.id)
    ElMessage.success('删除成功')
    fetchConfigPackages()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

/**
 * 获取参数类型文本
 */
const getParamTypeText = (type: number): string => {
  return paramTypeMap[type] || '未知'
}

/**
 * 格式化日期
 */
const formatDate = (date: string): string => {
  return new Date(date).toLocaleString('zh-CN')
}

// 初始化
onMounted(() => {
  const id = route.params.id
  if (id) {
    capabilityId.value = Number(id)
    fetchCapabilityDetail()
    fetchConfigPackages()
  }
})
</script>

<style scoped lang="scss">
.config-package-manage {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 15px;

      h2 {
        margin: 0;
      }

      .el-button {
        padding: 0;
        font-size: 14px;
      }
    }
  }

  .list-card {
    .el-empty {
      padding: 60px 0;
    }
  }

  .config-item {
    background: #f5f7fa;
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 10px;
  }

  .config-item-row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
  }

  .config-field {
    flex: 1 1 0;
    min-width: 0;
  }

  .config-form-item {
    margin-bottom: 0 !important;
    margin-right: 0 !important;
    width: 100%;
  }

  .config-form-item :deep(.el-form-item__content) {
    width: 100% !important;
    margin-left: 0 !important;
  }

  .config-form-item :deep(.el-input),
  .config-form-item :deep(.el-select) {
    width: 100% !important;
  }

  .config-btn-field {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .package-info {
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #e4e7ed;

    h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
    }

    .description {
      margin: 0;
      color: #909399;
      font-size: 14px;
    }
  }
}
</style>
