<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1 class="title">EXE开发者中心</h1>
        <p class="subtitle">企业开发者平台</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @keyup.enter="handleSubmit"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名/手机号/邮箱"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="submit-btn"
            :loading="loading"
            @click="handleSubmit"
          >
            登录
          </el-button>
        </el-form-item>

        <div class="form-footer">
          <router-link to="/register" class="link">注册账号</router-link>
          <router-link to="/forgot-password" class="link">忘记密码？</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 表单引用
const formRef = ref()

// 加载状态
const loading = ref(false)

// 表单数据
const form = reactive({
  username: '',
  password: ''
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ]
}

/**
 * 提交表单
 */
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    await userStore.login(form.username, form.password)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (error: any) {
    ElMessage.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #165DFF 0%, #4080FF 100%);
}

.login-box {
  width: 420px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 30px;

  .title {
    font-size: 28px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }

  .subtitle {
    font-size: 14px;
    color: #666;
  }
}

.login-form {
  .submit-btn {
    width: 100%;
  }
}

.form-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;

  .link {
    color: #409eff;
    text-decoration: none;
    font-size: 14px;

    &:hover {
      color: #66b1ff;
    }
  }
}
</style>
