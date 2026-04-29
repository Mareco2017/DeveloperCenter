<template>
  <div class="tree-node">
    <div
      v-if="dragPayload"
      class="drop-wrapper"
      :class="{ active: activeDropTarget === beforeKey }"
    >
      <DropZone
        :label="`放在「${title}」上方`"
        :destination="{ targetId: node.menuId, position: 'before' }"
        :drag-payload="dragPayload"
        :active-drop-target="activeDropTarget"
        :can-drop-at="canDropAt"
        compact
        @drop-to-tree="emit('dropToTree', $event)"
        @drop-target-change="emit('dropTargetChange', $event)"
      />
    </div>

    <div
      class="node-row"
      :class="{ selected: selectedMenuId === node.menuId, hidden: !node.isVisible, root: level === 1 }"
      @click.stop="emit('select', node.menuId)"
    >
      <div class="node-main" :style="{ paddingLeft: `${(level - 1) * 14}px` }">
        <el-button
          text
          class="expand-button"
          :class="{ invisible: !isGroup }"
          @click.stop="toggleExpand"
        >
          <el-icon>
            <ArrowRight :class="{ expanded: isExpanded }" />
          </el-icon>
        </el-button>

        <el-icon class="node-icon">
          <component :is="resolveMenuIcon(currentIcon)" />
        </el-icon>

        <span class="node-title">{{ title }}</span>
        <el-tag v-if="!node.isVisible" size="small" type="info" effect="plain">隐藏</el-tag>
        <el-tag v-if="isGroup && node.children.length === 0" size="small" type="warning" effect="plain">
          空
        </el-tag>
      </div>

      <div class="node-actions">
        <el-tooltip content="删除菜单" placement="top">
          <el-button
            text
            class="node-action danger"
            @click.stop="emit('removeMenu', node.menuId)"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="拖拽调整位置" placement="top">
          <span
            class="drag-handle"
            draggable="true"
            @dragstart="handleDragStart"
            @dragend="emit('dragEnd')"
          >
            <el-icon><Rank /></el-icon>
          </span>
        </el-tooltip>
      </div>
    </div>

    <div v-if="isGroup && isExpanded" class="children-block">
      <MenuTreeNodeRow
        v-for="child in sortedChildren"
        :key="child.menuId"
        :node="child"
        :level="level + 1"
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

      <div
        v-if="dragPayload"
        class="drop-wrapper inside"
        :class="{ active: activeDropTarget === insideKey }"
      >
        <DropZone
          :label="`放在「${title}」内部`"
          :destination="{ targetId: node.menuId, position: 'inside' }"
          :drag-payload="dragPayload"
          :active-drop-target="activeDropTarget"
          :can-drop-at="canDropAt"
          compact
          @drop-to-tree="emit('dropToTree', $event)"
          @drop-target-change="emit('dropTargetChange', $event)"
        />
      </div>
    </div>

    <div
      v-if="dragPayload"
      class="drop-wrapper"
      :class="{ active: activeDropTarget === afterKey }"
    >
      <DropZone
        :label="`放在「${title}」下方`"
        :destination="{ targetId: node.menuId, position: 'after' }"
        :drag-payload="dragPayload"
        :active-drop-target="activeDropTarget"
        :can-drop-at="canDropAt"
        compact
        @drop-to-tree="emit('dropToTree', $event)"
        @drop-target-change="emit('dropTargetChange', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowRight, Delete, Rank } from '@element-plus/icons-vue'
import DropZone from './DropZone.vue'
import {
  dropTargetKey,
  resolveNodeName,
  sortMenuNodes,
  type DragPayload,
  type FactoryMenuNode,
  type FactorySystemMenu,
  type InsertDestination
} from './menuTree'
import { resolveMenuIcon } from './iconMap'

defineOptions({
  name: 'MenuTreeNodeRow'
})

const props = defineProps<{
  node: FactoryMenuNode
  level: number
  selectedMenuId: string | null
  systemMenuMap: Map<string, FactorySystemMenu>
  dragPayload: DragPayload | null
  activeDropTarget: string | null
  expandAllCounter: number
  collapseAllCounter: number
  canDropAt: (destination: InsertDestination) => boolean
}>()

const emit = defineEmits<{
  select: [menuId: string]
  dropToTree: [destination: InsertDestination]
  removeMenu: [menuId: string]
  treeDragStart: [menuId: string]
  dragEnd: []
  dropTargetChange: [targetKey: string | null]
}>()

const isExpanded = ref(false)
const systemMenu = computed(() => props.systemMenuMap.get(props.node.menuId))
const title = computed(() => resolveNodeName(props.node, systemMenu.value))
const currentIcon = computed(() => props.node.customIcon ?? systemMenu.value?.menuIcon ?? 'Folder')
const menuType = computed(() => props.node.menuType ?? systemMenu.value?.menuType ?? 'function')
const isGroup = computed(() => menuType.value === 'group' || props.node.children.length > 0)
const sortedChildren = computed(() => sortMenuNodes(props.node.children))
const beforeKey = computed(() => dropTargetKey({ targetId: props.node.menuId, position: 'before' }))
const insideKey = computed(() => dropTargetKey({ targetId: props.node.menuId, position: 'inside' }))
const afterKey = computed(() => dropTargetKey({ targetId: props.node.menuId, position: 'after' }))

watch(
  () => props.expandAllCounter,
  () => {
    isExpanded.value = true
  }
)

watch(
  () => props.collapseAllCounter,
  () => {
    isExpanded.value = false
  }
)

/**
 * 展开/收起目录。
 * 场景：目录节点承担层级容器职责，函数菜单没有展开能力。
 */
const toggleExpand = () => {
  if (isGroup.value) {
    isExpanded.value = !isExpanded.value
  }
}

/**
 * 树内拖拽开始。
 * 依赖：页面容器根据 DragPayload 区分复制菜单池模板还是移动已有节点。
 */
const handleDragStart = (event: DragEvent) => {
  event.dataTransfer!.effectAllowed = 'move'
  event.dataTransfer!.setData('text/plain', props.node.menuId)
  emit('treeDragStart', props.node.menuId)
}
</script>

<style scoped lang="scss">
.tree-node {
  position: relative;
}

.drop-wrapper {
  height: 6px;
  opacity: 0;
  transition: all 0.16s ease;

  &.active {
    height: auto;
    opacity: 1;
    padding: 4px 0;
  }

  &.inside {
    margin-left: 28px;
  }
}

.node-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 38px;
  gap: 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: #ffffff;
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.16s ease;

  &:hover {
    background: #f8fafc;

    .node-actions {
      opacity: 1;
    }
  }

  &.selected {
    border-color: #bfdbfe;
    background: #eff6ff;
  }

  &.hidden {
    opacity: 0.58;
  }

  &.root {
    margin-top: 2px;
  }
}

.node-main {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
  gap: 7px;
}

.expand-button {
  width: 22px;
  height: 22px;
  padding: 0;

  &.invisible {
    visibility: hidden;
  }

  :deep(.el-icon) {
    margin: 0;
  }

  .expanded {
    transform: rotate(90deg);
  }
}

.node-icon {
  color: #475569;
  font-size: 16px;
  flex: 0 0 auto;
}

.node-title {
  min-width: 0;
  overflow: hidden;
  color: #1f2937;
  font-size: 14px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-actions {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.16s ease;
}

.node-action {
  width: 28px;
  height: 28px;
  padding: 0;

  &.danger {
    color: #ef4444;
  }
}

.drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: #94a3b8;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.children-block {
  margin-left: 18px;
  border-left: 1px solid #e2e8f0;
  padding-left: 8px;
}
</style>
