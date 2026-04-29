<template>
  <div class="enterprise-settings">
    <h2>企业认证</h2>

    <el-card class="auth-card">
      <template #header>
        <div class="card-header">
          <span>认证信息</span>
          <el-tag :type="getStatusType(authInfo?.status)">
            {{ getStatusText(authInfo?.status) }}
          </el-tag>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="auth-form"
      >
        <el-form-item label="企业名称" prop="enterpriseName">
          <el-input
            v-model="form.enterpriseName"
            placeholder="请输入企业全称"
            :disabled="isReadonly"
          />
        </el-form-item>

        <el-form-item label="统一社会信用代码" prop="creditCode">
          <el-input
            v-model="form.creditCode"
            placeholder="请输入统一社会信用代码"
            :disabled="isReadonly"
          />
        </el-form-item>

        <el-form-item label="法人姓名" prop="legalPerson">
          <el-input
            v-model="form.legalPerson"
            placeholder="请输入法人姓名"
            :disabled="isReadonly"
          />
        </el-form-item>

        <el-form-item label="营业执照" prop="licenseUrl">
          <el-upload
            class="license-uploader"
            action="/api/upload/image"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :disabled="isReadonly"
          >
            <img
              v-if="form.licenseUrl"
              :src="form.licenseUrl"
              class="license-image"
              alt="营业执照"
            />
            <div v-else class="upload-placeholder">
              <el-icon><Plus /></el-icon>
              <div class="upload-text">点击上传营业执照</div>
            </div>
          </el-upload>
          <div class="upload-tip">支持 JPG、PNG 格式，文件大小不超过 2MB</div>
        </el-form-item>

        <el-form-item v-if="!isReadonly">
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ authInfo ? '更新认证' : '提交认证' }}
          </el-button>
          <el-button v-if="authInfo" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div v-if="isReadonly" class="readonly-notice">
        <el-alert
          title="认证信息审核中"
          description="您的企业认证信息正在审核中，审核通过前无法修改。"
          type="info"
          show-icon
          :closable="false"
        />
      </div>
    </el-card>

    <el-card class="info-card">
      <template #header>
        <span>认证说明</span>
      </template>
      <div class="info-content">
        <h4>为什么需要企业认证？</h4>
        <p>企业认证是平台为确保开发者身份真实性而设立的必要流程。通过认证后，您将获得以下权益：</p>
        <ul>
          <li>创建和管理产品</li>
          <li>发布能力到能力市场</li>
          <li>享受平台提供的商业服务</li>
        </ul>

        <h4>认证状态说明</h4>
        <ul>
          <li><el-tag type="info">未认证</el-tag> - 尚未提交认证信息</li>
          <li><el-tag type="warning">审核中</el-tag> - 认证信息已提交，正在审核</li>
          <li><el-tag type="success">已认证</el-tag> - 认证通过，可使用全部功能</li>
          <li><el-tag type="danger">认证失败</el-tag> - 认证未通过，请重新提交</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import * as userApi from '@/api/user'
import type { EnterpriseAuth } from '@/api/user'

// 状态
const loading = ref(false)
const submitting = ref(false)
const authInfo = ref<EnterpriseAuth | null>(null)

// 表单引用
const formRef = ref()

// 表单数据
const form = reactive({
  enterpriseName: '',
  creditCode: '',
  legalPerson: '',
  licenseUrl: ''
})

// 表单验证规则
const rules = {
  enterpriseName: [
    { required: true, message: '请输入企业名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  creditCode: [
    { required: true, message: '请输入统一社会信用代码', trigger: 'blur' },
    { pattern: /^[A-Z0-9]{18}$/, message: '请输入18位统一社会信用代码', trigger: 'blur' }
  ],
  legalPerson: [
    { required: true, message: '请输入法人姓名', trigger: 'blur' }
  ]
}

// 是否只读（审核中或已认证时只读）
const isReadonly = computed(() => {
  if (!authInfo.value) return false
  return authInfo.value.status === 1 || authInfo.value.status === 2
})

/**
 * 获取认证状态文本
 */
const getStatusText = (status: number | undefined): string => {
  const statusMap: Record<number, string> = {
    0: '未认证',
    1: '审核中',
    2: '已认证',
    3: '认证失败'
  }
  return statusMap[status ?? 0] || '未认证'
}

/**
 * 获取认证状态标签类型
 */
const getStatusType = (status: number | undefined): string => {
  const typeMap: Record<number, string> = {
    0: 'info',
    1: 'warning',
    2: 'success',
    3: 'danger'
  }
  return typeMap[status ?? 0] || 'info'
}

/**
 * 获取认证信息
 */
const fetchAuthInfo = async () => {
  loading.value = true
  try {
    const res = await userApi.getEnterpriseAuth()
    authInfo.value = res
    // 填充表单
    if (res) {
      form.enterpriseName = res.enterpriseName
      form.creditCode = res.creditCode || ''
      form.legalPerson = res.legalPerson || ''
      form.licenseUrl = res.licenseUrl || ''
    }
  } catch (error: any) {
    // 404表示未认证，不报错
    if (error.response?.status !== 404) {
      console.error('获取认证信息失败:', error)
    }
  } finally {
    loading.value = false
  }
}

/**
 * 提交表单
 */
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    if (authInfo.value) {
      // 更新
      await userApi.updateEnterpriseAuth(form)
      ElMessage.success('更新成功')
    } else {
      // 提交
      await userApi.submitEnterpriseAuth(form)
      ElMessage.success('提交成功，请等待审核')
    }

    fetchAuthInfo()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

/**
 * 重置表单
 */
const handleReset = () => {
  if (authInfo.value) {
    form.enterpriseName = authInfo.value.enterpriseName
    form.creditCode = authInfo.value.creditCode || ''
    form.legalPerson = authInfo.value.legalPerson || ''
    form.licenseUrl = authInfo.value.licenseUrl || ''
  }
}

/**
 * 上传成功
 */
const handleUploadSuccess = (response: any) => {
  form.licenseUrl = response.url
  ElMessage.success('上传成功')
}

/**
 * 上传失败
 */
const handleUploadError = () => {
  ElMessage.error('上传失败')
}

// 初始化
onMounted(() => {
  fetchAuthInfo()
})
</script>

<style scoped lang="scss">
.enterprise-settings {
  h2 {
    margin-bottom: 20px;
  }

  .auth-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .auth-form {
      max-width: 600px;
    }

    .license-uploader {
      :deep(.el-upload) {
        border: 1px dashed var(--el-border-color);
        border-radius: 6px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition: var(--el-transition-duration-fast);

        &:hover {
          border-color: var(--el-color-primary);
        }
      }

      .license-image {
        width: 300px;
        height: 200px;
        object-fit: cover;
        display: block;
      }

      .upload-placeholder {
        width: 300px;
        height: 200px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--el-text-color-secondary);

        .el-icon {
          font-size: 28px;
          margin-bottom: 8px;
        }

        .upload-text {
          font-size: 14px;
        }
      }
    }

    .upload-tip {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 8px;
    }

    .readonly-notice {
      margin-top: 20px;
    }
  }

  .info-card {
    .info-content {
      h4 {
        margin: 20px 0 10px;
        color: var(--el-text-color-primary);

        &:first-child {
          margin-top: 0;
        }
      }

      p {
        color: var(--el-text-color-regular);
        line-height: 1.6;
        margin-bottom: 10px;
      }

      ul {
        margin: 10px 0;
        padding-left: 20px;
        color: var(--el-text-color-regular);

        li {
          margin-bottom: 8px;
          line-height: 1.6;

          .el-tag {
            margin-right: 8px;
          }
        }
      }
    }
  }
}
</style>
