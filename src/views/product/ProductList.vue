<template>
  <div class="product-list">
    <h2>产品管理</h2>

    <!-- 搜索和操作栏 -->
    <el-card class="search-card">
      <div class="search-header">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="关键词">
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索产品名称"
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
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            创建产品
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 产品列表 -->
    <el-card class="list-card">
      <el-table :data="productList" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="产品名称" min-width="150" />
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
        <el-table-column label="操作" width="450" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link @click="handleGoToCapabilities(row)">能力管理</el-button>
            <el-button type="primary" link @click="handleGoToScenarios(row)">场景方案</el-button>
            <el-button type="primary" link @click="handleGoToTerminals(row)">终端管理</el-button>
            <el-button type="primary" link @click="handleGoToAdminMenus(row)">菜单配置</el-button>
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

    <!-- 创建/编辑产品对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="isEdit ? '编辑产品' : '创建产品'"
      width="600px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="产品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入产品描述"
          />
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
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import * as productApi from '@/api/product'
import type { Product } from '@/api/product'

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
const productList = ref<Product[]>([])

// 对话框显示状态
const showCreateDialog = ref(false)
const isEdit = ref(false)

// 表单引用
const formRef = ref()

// 产品表单
const form = reactive({
  id: 0,
  name: '',
  description: ''
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入产品名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

/**
 * 获取产品列表
 */
const fetchProductList = async () => {
  loading.value = true
  try {
    const res = await productApi.getProductList({
      keyword: searchForm.keyword || undefined,
      status: searchForm.status,
      onlyMine: searchForm.onlyMine
    })
    productList.value = res
  } catch (error) {
    console.error('获取产品列表失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 搜索
 */
const handleSearch = () => {
  fetchProductList()
}

/**
 * 重置搜索
 */
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = undefined
  searchForm.onlyMine = false
  fetchProductList()
}

/**
 * 提交产品表单
 */
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    if (isEdit.value) {
      await productApi.updateProduct(form.id, {
        name: form.name,
        description: form.description
      })
      ElMessage.success('更新成功')
    } else {
      await productApi.createProduct({
        name: form.name,
        description: form.description
      })
      ElMessage.success('创建成功')
    }

    showCreateDialog.value = false
    formRef.value.resetFields()
    fetchProductList()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

/**
 * 编辑产品
 */
const handleEdit = (row: Product) => {
  isEdit.value = true
  form.id = row.id
  form.name = row.name
  form.description = row.description || ''
  showCreateDialog.value = true
}

/**
 * 删除产品
 */
const handleDelete = async (row: Product) => {
  try {
    await ElMessageBox.confirm('确定要删除该产品吗？', '提示', {
      type: 'warning'
    })

    await productApi.deleteProduct(row.id)
    ElMessage.success('删除成功')
    fetchProductList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

/**
 * 发布产品
 */
const handlePublish = async (row: Product) => {
  try {
    await ElMessageBox.confirm('确定要发布该产品吗？', '提示', {
      type: 'info'
    })

    await productApi.publishProduct(row.id)
    ElMessage.success('发布成功')
    fetchProductList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '发布失败')
    }
  }
}

/**
 * 下架产品
 */
const handleUnpublish = async (row: Product) => {
  try {
    await ElMessageBox.confirm('确定要下架该产品吗？', '提示', {
      type: 'warning'
    })

    await productApi.unpublishProduct(row.id)
    ElMessage.success('下架成功')
    fetchProductList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '下架失败')
    }
  }
}

/**
 * 跳转到能力管理页面
 * @param row 产品数据
 */
const handleGoToCapabilities = (row: Product) => {
  router.push(`/products/${row.id}/capabilities`)
}



/**
 * 跳转到场景方案管理页面
 * @param row 产品数据
 */
const handleGoToScenarios = (row: Product) => {
  router.push(`/products/${row.id}/scenarios`)
}

/**
 * 跳转到终端管理页面
 * @param row 产品数据
 */
const handleGoToTerminals = (row: Product) => {
  router.push(`/products/${row.id}/terminals`)
}

/**
 * 跳转到管理后台菜单配置页面
 * @param row 产品数据
 */
const handleGoToAdminMenus = (row: Product) => {
  router.push(`/products/${row.id}/admin-menus`)
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

// 监听对话框关闭
watch(showCreateDialog, (val) => {
  if (!val) {
    isEdit.value = false
    formRef.value?.resetFields()
  }
})

// 初始化
onMounted(() => {
  fetchProductList()
})
</script>

<style scoped lang="scss">
.product-list {
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
