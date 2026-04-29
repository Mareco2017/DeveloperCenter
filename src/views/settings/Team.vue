<template>
  <div class="team-settings">
    <h2>团队管理</h2>

    <!-- 团队列表 -->
    <el-card class="team-list-card">
      <template #header>
        <div class="card-header">
          <span>我的团队</span>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            创建团队
          </el-button>
        </div>
      </template>

      <el-table :data="teamList" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="团队名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewMembers(row)">
              成员管理
            </el-button>
            <el-button type="primary" link @click="handleEdit(row)">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建团队对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建团队" width="500px">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="80px">
        <el-form-item label="团队名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入团队名称" />
        </el-form-item>
        <el-form-item label="团队描述" prop="description">
          <el-input v-model="createForm.description" type="textarea" :rows="3" placeholder="请输入团队描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreate">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑团队对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑团队" width="500px">
      <el-form ref="editFormRef" :model="editForm" :rules="createRules" label-width="80px">
        <el-form-item label="团队名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入团队名称" />
        </el-form-item>
        <el-form-item label="团队描述" prop="description">
          <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="请输入团队描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleUpdate">确定</el-button>
      </template>
    </el-dialog>

    <!-- 成员管理对话框 -->
    <el-dialog v-model="showMemberDialog" title="成员管理" width="700px">
      <div class="member-header">
        <h3>{{ currentTeam?.name }} - 成员列表</h3>
        <el-button type="primary" @click="showInviteDialog = true">
          <el-icon><Plus /></el-icon>
          邀请成员
        </el-button>
      </div>

      <el-table :data="memberList" v-loading="memberLoading" style="width: 100%">
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="realName" label="真实姓名" min-width="120" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)">
              {{ getRoleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="joinedAt" label="加入时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.joinedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleChangeRole(row)">
              修改角色
            </el-button>
            <el-button type="danger" link @click="handleRemoveMember(row)">
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 邀请成员对话框 -->
    <el-dialog v-model="showInviteDialog" title="邀请成员" width="400px">
      <el-form ref="inviteFormRef" :model="inviteForm" :rules="inviteRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="inviteForm.username" placeholder="请输入要邀请的用户名" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="inviteForm.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="管理员" :value="1" />
            <el-option label="开发者" :value="2" />
            <el-option label="运营" :value="3" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showInviteDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleInvite">确定</el-button>
      </template>
    </el-dialog>

    <!-- 修改角色对话框 -->
    <el-dialog v-model="showRoleDialog" title="修改角色" width="400px">
      <el-form ref="roleFormRef" :model="roleForm" label-width="80px">
        <el-form-item label="角色" prop="role">
          <el-select v-model="roleForm.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="管理员" :value="1" />
            <el-option label="开发者" :value="2" />
            <el-option label="运营" :value="3" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRoleDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmitRole">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import * as teamApi from '@/api/team'
import type { Team, TeamMember } from '@/api/team'

// 状态
const loading = ref(false)
const memberLoading = ref(false)
const submitting = ref(false)
const teamList = ref<Team[]>([])
const memberList = ref<TeamMember[]>([])
const currentTeam = ref<Team | null>(null)
const currentMember = ref<TeamMember | null>(null)

// 对话框显示状态
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showMemberDialog = ref(false)
const showInviteDialog = ref(false)
const showRoleDialog = ref(false)

// 表单引用
const createFormRef = ref()
const editFormRef = ref()
const inviteFormRef = ref()
const roleFormRef = ref()

// 创建表单
const createForm = reactive({
  name: '',
  description: ''
})

// 编辑表单
const editForm = reactive({
  id: 0,
  name: '',
  description: ''
})

// 邀请表单
const inviteForm = reactive({
  username: '',
  role: 2
})

// 角色表单
const roleForm = reactive({
  role: 1
})

// 表单验证规则
const createRules = {
  name: [
    { required: true, message: '请输入团队名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

const inviteRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

/**
 * 获取团队列表
 */
const fetchTeamList = async () => {
  loading.value = true
  try {
    const res = await teamApi.getTeamList()
    teamList.value = res
  } catch (error) {
    console.error('获取团队列表失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 创建团队
 */
const handleCreate = async () => {
  if (!createFormRef.value) return

  try {
    await createFormRef.value.validate()
    submitting.value = true

    await teamApi.createTeam(createForm)
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    createFormRef.value.resetFields()
    fetchTeamList()
  } catch (error: any) {
    ElMessage.error(error.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

/**
 * 编辑团队
 */
const handleEdit = (row: Team) => {
  editForm.id = row.id
  editForm.name = row.name
  editForm.description = row.description || ''
  showEditDialog.value = true
}

/**
 * 更新团队
 */
const handleUpdate = async () => {
  if (!editFormRef.value) return

  try {
    await editFormRef.value.validate()
    submitting.value = true

    await teamApi.updateTeam(editForm.id, {
      name: editForm.name,
      description: editForm.description
    })
    ElMessage.success('更新成功')
    showEditDialog.value = false
    fetchTeamList()
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败')
  } finally {
    submitting.value = false
  }
}

/**
 * 查看成员
 */
const handleViewMembers = async (row: Team) => {
  currentTeam.value = row
  showMemberDialog.value = true
  fetchMemberList(row.id)
}

/**
 * 获取成员列表
 */
const fetchMemberList = async (teamId: number) => {
  memberLoading.value = true
  try {
    const res = await teamApi.getTeamMembers(teamId)
    memberList.value = res
  } catch (error) {
    console.error('获取成员列表失败:', error)
  } finally {
    memberLoading.value = false
  }
}

/**
 * 邀请成员
 */
const handleInvite = async () => {
  if (!inviteFormRef.value || !currentTeam.value) return

  try {
    await inviteFormRef.value.validate()
    submitting.value = true

    await teamApi.inviteMember(currentTeam.value.id, {
      username: inviteForm.username,
      role: inviteForm.role
    })
    ElMessage.success('邀请成功')
    showInviteDialog.value = false
    inviteFormRef.value.resetFields()
    fetchMemberList(currentTeam.value.id)
  } catch (error: any) {
    ElMessage.error(error.message || '邀请失败')
  } finally {
    submitting.value = false
  }
}

/**
 * 移除成员
 */
const handleRemoveMember = async (row: TeamMember) => {
  if (!currentTeam.value) return

  try {
    await ElMessageBox.confirm('确定要移除该成员吗？', '提示', {
      type: 'warning'
    })

    await teamApi.removeMember(currentTeam.value.id, row.userId)
    ElMessage.success('移除成功')
    fetchMemberList(currentTeam.value.id)
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '移除失败')
    }
  }
}

/**
 * 修改角色
 */
const handleChangeRole = async (row: TeamMember) => {
  if (!currentTeam.value) return
  currentMember.value = row
  roleForm.role = row.role
  showRoleDialog.value = true
}

/**
 * 提交角色修改
 */
const handleSubmitRole = async () => {
  if (!currentTeam.value || !currentMember.value) return

  try {
    submitting.value = true
    await teamApi.updateMemberRole(currentTeam.value.id, currentMember.value.userId, roleForm.role)
    ElMessage.success('修改成功')
    showRoleDialog.value = false
    fetchMemberList(currentTeam.value.id)
  } catch (error: any) {
    ElMessage.error(error.message || '修改失败')
  } finally {
    submitting.value = false
  }
}

/**
 * 获取角色文本
 */
const getRoleText = (role: number): string => {
  const roleMap: Record<number, string> = {
    1: '管理员',
    2: '开发者',
    3: '运营'
  }
  return roleMap[role] || '未知'
}

/**
 * 获取角色标签类型
 */
const getRoleType = (role: number): string => {
  const typeMap: Record<number, string> = {
    1: 'danger',
    2: 'primary',
    3: 'info'
  }
  return typeMap[role] || 'info'
}

/**
 * 格式化日期
 */
const formatDate = (date: string | undefined): string => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

// 初始化
onMounted(() => {
  fetchTeamList()
})
</script>

<style scoped lang="scss">
.team-settings {
  h2 {
    margin-bottom: 20px;
  }

  .team-list-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .member-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 {
      margin: 0;
    }
  }
}
</style>
