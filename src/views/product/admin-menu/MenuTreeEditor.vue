<template>
  <section class="menu-tree-editor">
    <header class="panel-header">
      <div>
        <h3>产品预设菜单</h3>
        <p>通过拖拽调整出厂菜单的层级和顺序。</p>
      </div>
      <div class="header-actions">
        <el-button size="small" @click="expandAllCounter++">全部展开</el-button>
        <el-button size="small" @click="collapseAllCounter++">全部收起</el-button>
        <el-button size="small" type="primary" @click="emit('addGroup')">
          <el-icon><FolderAdd /></el-icon>
          新建菜单
        </el-button>
      </div>
    </header>

    <div class="tree-body">
      <div class="tree-scroll">
        <div
          v-if="dragPayload"
          class="root-drop"
          :class="{ active: activeDropTarget === rootStartKey }"
        >
          <DropZone
            label="放在这里，成为第一个一级菜单"
            :destination="{ position: 'root-start' }"
            :drag-payload="dragPayload"
            :active-drop-target="activeDropTarget"
            :can-drop-at="canDropAt"
            @drop-to-tree="emit('dropToTree', $event)"
            @drop-target-change="emit('dropTargetChange', $event)"
          />
        </div>

        <template v-if="sortedTree.length > 0">
          <MenuTreeNodeRow
            v-for="node in sortedTree"
            :key="node.menuId"
            :node="node"
            :level="1"
            :selected-menu-id="selectedMenuId"
            :system-menu-map="systemMenuMap"
            :drag-payload="dragPayload"
            :active-drop-target="activeDropTarget"
            :expand-all-counter="expandAllCounter"
            :collapse-all-counter="collapseAllCounter"
            :can-drop-at="canDropAt"
            @select="emit('select', $event)"
            @drop-to-tree="emit('dropToTree', $event)"
            @remove-menu="emit('removeMenu', $event)"
            @tree-drag-start="emit('treeDragStart', $event)"
            @drag-end="emit('dragEnd')"
            @drop-target-change="emit('dropTargetChange', $event)"
          />
        </template>

        <div
          v-else
          class="empty-tree"
          :class="{ active: activeDropTarget === rootEndKey }"
          @dragover.prevent="handleEmptyDragOver"
          @drop.prevent="handleEmptyDrop"
        >
          <el-icon><Grid /></el-icon>
          <p>先将菜单池中的菜单拖入此处，或新建菜单整理产品预设菜单。</p>
        </div>

        <div
          v-if="dragPayload"
          class="root-drop bottom"
          :class="{ active: activeDropTarget === rootEndKey }"
        >
          <DropZone
            label="追加到一级菜单底部"
            :destination="{ position: 'root-end' }"
            :drag-payload="dragPayload"
            :active-drop-target="activeDropTarget"
            :can-drop-at="canDropAt"
            @drop-to-tree="emit('dropToTree', $event)"
            @drop-target-change="emit('dropTargetChange', $event)"
          />
        </div>
      </div>

      <div
        v-if="dragPayload?.type === 'tree'"
        class="delete-drop"
        :class="{ active: activeDropTarget === 'trash' }"
        @dragover.prevent="handleTrashDragOver"
        @drop.prevent="handleTrashDrop"
      >
        <el-icon><Delete /></el-icon>
        拖到这里删除菜单
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Delete, FolderAdd, Grid } from '@element-plus/icons-vue'
import DropZone from './DropZone.vue'
import MenuTreeNodeRow from './MenuTreeNodeRow.vue'
import {
  dropTargetKey,
  sortMenuNodes,
  type DragPayload,
  type FactoryMenuTree,
  type FactorySystemMenu,
  type InsertDestination
} from './menuTree'

const props = defineProps<{
  menuTree: FactoryMenuTree
  selectedMenuId: string | null
  systemMenuMap: Map<string, FactorySystemMenu>
  dragPayload: DragPayload | null
  activeDropTarget: string | null
  canDropAt: (destination: InsertDestination) => boolean
}>()

const emit = defineEmits<{
  select: [menuId: string]
  addGroup: []
  dropToTree: [destination: InsertDestination]
  deleteDrop: []
  removeMenu: [menuId: string]
  treeDragStart: [menuId: string]
  dragEnd: []
  dropTargetChange: [targetKey: string | null]
}>()

const expandAllCounter = ref(0)
const collapseAllCounter = ref(0)
const sortedTree = computed(() => sortMenuNodes(props.menuTree.children))
const rootStartKey = computed(() => dropTargetKey({ position: 'root-start' }))
const rootEndKey = computed(() => dropTargetKey({ position: 'root-end' }))

/**
 * 空树拖入处理。
 * 场景：首次配置产品出厂菜单时，整块空状态就是根级投放区。
 */
const handleEmptyDragOver = (event: DragEvent) => {
  if (!props.dragPayload || !props.canDropAt({ position: 'root-end' })) return
  event.dataTransfer!.dropEffect = props.dragPayload.type === 'pool' ? 'copy' : 'move'
  emit('dropTargetChange', rootEndKey.value)
}

const handleEmptyDrop = () => {
  if (!props.dragPayload || !props.canDropAt({ position: 'root-end' })) return
  emit('dropToTree', { position: 'root-end' })
  emit('dropTargetChange', null)
}

/**
 * 删除投放区悬停。
 * 场景：只允许树内已有节点拖入删除区，菜单池模板不会触发删除。
 */
const handleTrashDragOver = () => {
  emit('dropTargetChange', 'trash')
}

const handleTrashDrop = () => {
  emit('deleteDrop')
  emit('dropTargetChange', null)
}
</script>

<style scoped lang="scss">
.menu-tree-editor {
  display: flex;
  width: 100%;
  flex: 1 1 0;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: #ffffff;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-height: 64px;
  border-bottom: 1px solid #e5e7eb;
  padding: 14px 16px 12px;

  h3 {
    margin: 0;
    color: #111827;
    font-size: 16px;
    font-weight: 600;
    line-height: 22px;
  }

  p {
    margin: 3px 0 0;
    color: #6b7280;
    font-size: 12px;
    line-height: 18px;
  }
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.tree-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.tree-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px 14px 16px;
}

.root-drop {
  padding: 4px 0;
  opacity: 0;
  transition: opacity 0.16s ease;

  &.active,
  &:hover {
    opacity: 1;
  }

  &.bottom {
    margin-top: 8px;
  }
}

.empty-tree {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12px;
  min-height: 220px;
  margin: 10px 0;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  text-align: center;

  &.active {
    border-color: #165dff;
    background: #eff6ff;
    color: #165dff;
  }

  .el-icon {
    color: #94a3b8;
    font-size: 28px;
  }

  p {
    width: min(280px, 90%);
    margin: 0;
    font-size: 13px;
    line-height: 22px;
  }
}

.delete-drop {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-top: 1px solid #fee2e2;
  background: #fff7f7;
  color: #dc2626;
  font-size: 13px;
  padding: 12px;
  transition: all 0.16s ease;

  &.active {
    background: #fee2e2;
  }
}
</style>
