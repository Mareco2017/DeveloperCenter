<template>
  <div class="capability-list">
    <h2>能力管理</h2>

    <!-- 搜索和操作栏 -->
    <el-card class="search-card">
      <div class="search-header">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="关键词">
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索能力名称或编码"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 192px">
              <el-option label="草稿" :value="0" />
              <el-option label="已发布" :value="1" />
              <el-option label="已下架" :value="2" />
            </el-select>
          </el-form-item>
        </el-form>
        <div class="search-actions">
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" @click="openCreateDialog">
            <el-icon><Plus /></el-icon>
            创建能力
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 能力列表 -->
    <el-card class="list-card">
      <el-table :data="capabilityList" v-loading="loading" style="width: 100%">
        <el-table-column prop="code" label="能力编码" min-width="120" />
        <el-table-column prop="name" label="能力名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link @click="handleConfigPackages(row)">配置包</el-button>
            <el-button
              v-if="row.status === 0"
              type="success"
              link
              @click="handlePublish(row)"
            >
              发布
            </el-button>
            <el-button
              v-if="row.status === 1"
              type="warning"
              link
              @click="handleUnpublish(row)"
            >
              下架
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建/编辑能力对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="isEdit ? '编辑能力' : '创建能力'"
      width="600px"
      @closed="resetDialogForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="能力编码" prop="code">
          <el-input
            v-model="form.code"
            placeholder="请输入能力编码"
            :disabled="isEdit"
          />
        </el-form-item>
        <el-form-item label="能力名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入能力名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入能力描述"
          />
        </el-form-item>
        <el-form-item label="EPASS功能" prop="epassFuncId">
          <el-select v-model="form.epassFuncId" placeholder="请选择EPASS功能" clearable style="width: 100%">
            <el-option label="考试" value="exam" />
            <el-option label="作业" value="homework" />
            <el-option label="智能陪练" value="ai_training" />
            <el-option label="应知应会" value="knowledge" />
            <el-option label="项目地图" value="project_map" />
            <el-option label="报名" value="registration" />
            <el-option label="证书" value="certificate" />
            <el-option label="课程" value="course" />
            <el-option label="问卷" value="survey" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>


  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import * as capabilityApi from '@/api/capability'
import type { Capability } from '@/api/capability'

// 路由
const router = useRouter()

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: undefined as number | undefined,
  onlyMine: false
})

// 状态
const loading = ref(false)
const submitting = ref(false)
const capabilityList = ref<Capability[]>([])

// 对话框显示状态
const showCreateDialog = ref(false)
const isEdit = ref(false)

// 表单引用
const formRef = ref()

// 能力表单
const form = reactive({
  id: 0,
  code: '',
  name: '',
  description: '',
  epassFuncId: ''
})

// 表单验证规则
const rules = {
  code: [
    { required: true, message: '请输入能力编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '编码必须以字母开头，只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入能力名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

/**
 * 打开能力创建弹窗。
 * 场景：用户从能力列表新建能力时调用；依赖 resetDialogForm 避免复用上一次编辑状态。
 */
const openCreateDialog = () => {
  resetDialogForm()
  showCreateDialog.value = true
}

/**
 * 获取能力列表
 */
const fetchCapabilityList = async () => {
  loading.value = true
  try {
    const res = await capabilityApi.getCapabilityList({
      keyword: searchForm.keyword || undefined,
      status: searchForm.status,
      onlyMine: searchForm.onlyMine
    })
    capabilityList.value = res
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
  fetchCapabilityList()
}

/**
 * 重置搜索
 */
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = undefined
  searchForm.onlyMine = false
  fetchCapabilityList()
}

/**
 * 创建能力
 */
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    if (isEdit.value) {
      await capabilityApi.updateCapability(form.id, {
        name: form.name,
        description: form.description,
        epassFuncId: form.epassFuncId
      })
      ElMessage.success('更新成功')
    } else {
      await capabilityApi.createCapability({
        code: form.code,
        name: form.name,
        description: form.description,
        epassFuncId: form.epassFuncId
      })
      ElMessage.success('创建成功')
    }

    showCreateDialog.value = false
    fetchCapabilityList()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

/**
 * 编辑能力
 */
const handleEdit = (row: Capability) => {
  isEdit.value = true
  form.id = row.id
  form.code = row.code
  form.name = row.name
  form.description = row.description || ''
  form.epassFuncId = row.epassFuncId || ''
  showCreateDialog.value = true
}

/**
 * 重置能力弹窗表单。
 * 场景：Element Plus 弹窗完全关闭后再清理数据，避免二次进入或关闭动画中出现字段闪空。
 * 依赖：resetFields 清理校验状态，手动赋默认值覆盖 id、epassFuncId 等业务字段。
 */
const resetDialogForm = () => {
  isEdit.value = false
  form.id = 0
  form.code = ''
  form.name = ''
  form.description = ''
  form.epassFuncId = ''
  formRef.value?.resetFields()
}

/**
 * 删除能力
 */
const handleDelete = async (row: Capability) => {
  try {
    await ElMessageBox.confirm('确定要删除该能力吗？', '提示', {
      type: 'warning'
    })

    await capabilityApi.deleteCapability(row.id)
    ElMessage.success('删除成功')
    fetchCapabilityList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

/**
 * 发布能力
 */
const handlePublish = async (row: Capability) => {
  try {
    await ElMessageBox.confirm('确定要发布该能力吗？', '提示', {
      type: 'info'
    })

    await capabilityApi.publishCapability(row.id)
    ElMessage.success('发布成功')
    fetchCapabilityList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '发布失败')
    }
  }
}

/**
 * 下架能力
 */
const handleUnpublish = async (row: Capability) => {
  try {
    await ElMessageBox.confirm('确定要下架该能力吗？', '提示', {
      type: 'warning'
    })

    await capabilityApi.unpublishCapability(row.id)
    ElMessage.success('下架成功')
    fetchCapabilityList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '下架失败')
    }
  }
}

/**
 * 查看配置包
 */
const handleConfigPackages = (row: Capability) => {
  router.push(`/capabilities/${row.id}/config-packages`)
}

/**
 * 获取状态文本
 */
const getStatusText = (status: number): string => {
  const statusMap: Record<number, string> = {
    0: '草稿',
    1: '已发布',
    2: '已下架'
  }
  return statusMap[status] || '未知'
}

/**
 * 获取状态标签类型
 */
const getStatusType = (status: number): string => {
  const typeMap: Record<number, string> = {
    0: 'info',
    1: 'success',
    2: 'warning'
  }
  return typeMap[status] || 'info'
}

/**
 * 格式化日期
 */
const formatDate = (date: string): string => {
  return new Date(date).toLocaleString('zh-CN')
}

// 初始化
onMounted(() => {
  fetchCapabilityList()
})
</script>

<style scoped lang="scss">
.capability-list {
  h2 {
    margin-bottom: 20px;
  }

  .search-card {
    margin-bottom: 20px;

    .search-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 10px;
    }

    .search-form {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: flex-start;

      :deep(.el-form-item) {
        margin-bottom: 0;
        margin-top: 0;
      }
    }

    .search-actions {
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }
  }

}
</style>
