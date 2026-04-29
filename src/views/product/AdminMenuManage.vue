<template>
  <div class="admin-menu-manage">
    <header class="page-header">
      <div class="header-left">
        <el-button link @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <div>
          <h2>{{ productName }} - 菜单配置</h2>
          <p>配置产品交付时默认携带的管理后台菜单。</p>
        </div>
        <el-tag v-if="hasPendingChanges" type="warning" effect="plain">有未保存的更改</el-tag>
      </div>

      <div class="header-actions">
        <el-button :disabled="!hasPendingChanges" @click="restoreSavedPreset">
          <el-icon><RefreshLeft /></el-icon>
          重置未保存变更
        </el-button>
        <el-button @click="goBack">取消</el-button>
        <el-button type="primary" :loading="isSaving" :disabled="!hasPendingChanges" @click="saveConfig">
          <el-icon><Check /></el-icon>
          保存
        </el-button>
      </div>
    </header>

    <section class="menu-workbench">
      <div
        class="pool-column"
        :style="{ width: `${availableMenuWidth}px` }"
      >
        <MenuPool
          :system-menus="systemMenus"
          :menu-tree="menuTree"
          @drag-start="handlePoolDragStart"
          @drag-end="handleDragEnd"
        />
      </div>

      <div
        class="resize-handle"
        role="separator"
        aria-label="调整菜单池宽度"
        @mousedown="handleResizeStart"
      >
        <span />
      </div>

      <div class="tree-column">
        <MenuTreeEditor
          :menu-tree="menuTree"
          :selected-menu-id="selectedMenuId"
          :system-menu-map="systemMenuMap"
          :drag-payload="dragPayload"
          :active-drop-target="activeDropTarget"
          :can-drop-at="canDropAt"
          @select="selectMenu"
          @add-group="addCustomGroup"
          @drop-to-tree="handleDropToTree"
          @delete-drop="handleDeleteDrop"
          @remove-menu="removeMenu"
          @tree-drag-start="handleTreeDragStart"
          @drag-end="handleDragEnd"
          @drop-target-change="activeDropTarget = $event"
        />
      </div>

      <div class="properties-column">
        <MenuPropertiesPanel
          :selected-node="selectedNode"
          :selected-system-menu="selectedSystemMenu"
          :menu-tree="menuTree"
          :system-menus="systemMenus"
          @update="updateMenuItem"
          @move="moveMenu"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Check, RefreshLeft } from '@element-plus/icons-vue'
import * as productApi from '@/api/product'
import MenuPool from './admin-menu/MenuPool.vue'
import MenuTreeEditor from './admin-menu/MenuTreeEditor.vue'
import MenuPropertiesPanel from './admin-menu/MenuPropertiesPanel.vue'
import { useFactoryMenuPreset } from './admin-menu/useFactoryMenuPreset'
import {
  canInsertNodeAt,
  createMenuNodeFromTemplate,
  getTreeMenuIds,
  type DragPayload,
  type InsertDestination
} from './admin-menu/menuTree'

const route = useRoute()
const router = useRouter()
const productId = Number.parseInt(route.params.id as string, 10)
const productName = ref(Number.isFinite(productId) ? `产品 #${productId}` : '产品')
const availableMenuWidth = ref(252)
const isResizingAvailableMenu = ref(false)
const resizeStartX = ref(0)
const resizeStartWidth = ref(252)
const dragPayload = ref<DragPayload | null>(null)
const activeDropTarget = ref<string | null>(null)

const {
  menuTree,
  selectedMenuId,
  selectedNode,
  selectedSystemMenu,
  systemMenus,
  isSaving,
  hasPendingChanges,
  systemMenuMap,
  selectMenu,
  addCustomGroup,
  addMenuFromTemplate,
  moveMenu,
  removeMenu,
  updateMenuItem,
  saveConfig,
  restoreSavedPreset,
  canMove
} = useFactoryMenuPreset(Number.isFinite(productId) ? productId : 0)

const addedMenuIds = computed(() => getTreeMenuIds(menuTree.value))

/**
 * 获取产品名称。
 * 场景：菜单配置是产品详情子页，接口失败时保留产品 ID 降级显示。
 */
const fetchProductInfo = async () => {
  if (!Number.isFinite(productId)) return

  try {
    const product = await productApi.getProductDetail(productId)
    productName.value = product.name
  } catch (error) {
    console.error('获取产品信息失败:', error)
  }
}

const goBack = () => {
  router.back()
}

/**
 * 菜单池拖拽开始。
 * 依赖：dragPayload.type=pool 会让投放后复制系统菜单模板。
 */
const handlePoolDragStart = (menuId: string) => {
  dragPayload.value = {
    type: 'pool',
    menuId
  }
}

/**
 * 树节点拖拽开始。
 * 依赖：dragPayload.type=tree 会让投放后移动已有节点。
 */
const handleTreeDragStart = (menuId: string) => {
  dragPayload.value = {
    type: 'tree',
    menuId
  }
}

const handleDragEnd = () => {
  dragPayload.value = null
  activeDropTarget.value = null
}

/**
 * 判断投放位置是否合法。
 * 场景：投放区展示、高亮和最终 drop 都使用同一套规则。
 */
const canDropAt = (destination: InsertDestination) => {
  if (!dragPayload.value) return false

  if (dragPayload.value.type === 'pool') {
    if (addedMenuIds.value.has(dragPayload.value.menuId)) return false

    try {
      const nextNode = createMenuNodeFromTemplate(systemMenus, dragPayload.value.menuId)
      return canInsertNodeAt(menuTree.value, nextNode, destination, systemMenuMap.value)
    } catch {
      return false
    }
  }

  return canMove(dragPayload.value.menuId, destination)
}

/**
 * 菜单树投放处理。
 * 场景：菜单池复制模板、树内移动节点两个路径在这里汇合。
 */
const handleDropToTree = (destination: InsertDestination) => {
  if (!dragPayload.value || !canDropAt(destination)) return

  if (dragPayload.value.type === 'pool') {
    addMenuFromTemplate(dragPayload.value.menuId, destination)
  } else {
    moveMenu(dragPayload.value.menuId, destination)
  }

  handleDragEnd()
}

const handleDeleteDrop = () => {
  if (dragPayload.value?.type === 'tree') {
    removeMenu(dragPayload.value.menuId)
  }
  handleDragEnd()
}

const clampAvailableMenuWidth = (width: number) => {
  return Math.min(420, Math.max(220, width))
}

/**
 * 左侧菜单池宽度拖拽开始。
 * 场景：参考项目允许调整菜单池宽度，宽度约束防止窄屏布局失控。
 */
const handleResizeStart = (event: MouseEvent) => {
  event.preventDefault()
  resizeStartX.value = event.clientX
  resizeStartWidth.value = availableMenuWidth.value
  isResizingAvailableMenu.value = true
  window.addEventListener('mousemove', handleResizeMove)
  window.addEventListener('mouseup', handleResizeEnd)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

const handleResizeMove = (event: MouseEvent) => {
  if (!isResizingAvailableMenu.value) return
  const delta = event.clientX - resizeStartX.value
  availableMenuWidth.value = clampAvailableMenuWidth(resizeStartWidth.value + delta)
}

const handleResizeEnd = () => {
  isResizingAvailableMenu.value = false
  window.removeEventListener('mousemove', handleResizeMove)
  window.removeEventListener('mouseup', handleResizeEnd)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

onMounted(() => {
  fetchProductInfo()
})

onBeforeUnmount(() => {
  handleResizeEnd()
})
</script>

<style scoped lang="scss">
.admin-menu-manage {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  min-height: 620px;
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;

  .header-left {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 12px;
  }

  h2 {
    overflow: hidden;
    margin: 0;
    color: #111827;
    font-size: 20px;
    font-weight: 600;
    line-height: 28px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  p {
    margin: 2px 0 0;
    color: #6b7280;
    font-size: 13px;
    line-height: 20px;
  }
}

.header-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

.menu-workbench {
  display: flex;
  flex: 1;
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.pool-column,
.tree-column,
.properties-column {
  display: flex;
  min-height: 0;
}

.pool-column {
  flex: 0 0 auto;
}

.tree-column,
.properties-column {
  min-width: 0;
  border-left: 1px solid #e5e7eb;
  overflow: hidden;
}

/* 中间树和右侧属性按比例吃满剩余空间，避免 1080 宽屏下子面板停在固定宽度。 */
.tree-column {
  flex: 3 1 0;
  min-width: 280px;
}

.properties-column {
  flex: 2 1 0;
  min-width: 260px;
}

.resize-handle {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  flex: 0 0 12px;
  background: #ffffff;
  cursor: col-resize;
  transition: background-color 0.16s ease;

  &:hover {
    background: #f8fafc;
  }

  span {
    width: 2px;
    height: 38px;
    border-radius: 999px;
    background: #cbd5e1;
  }
}

@media (max-width: 1180px) {
  .admin-menu-manage {
    overflow-x: auto;
  }
}
</style>
