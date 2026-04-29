<template>
  <div
    v-if="isEnabled"
    class="drop-zone"
    :class="{ compact, active: isActive }"
    @dragover.prevent="handleDragOver"
    @drop.prevent="handleDrop"
  >
    {{ label }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { dropTargetKey, type DragPayload, type InsertDestination } from './menuTree'

const props = defineProps<{
  label: string
  destination: InsertDestination
  dragPayload: DragPayload | null
  activeDropTarget: string | null
  compact?: boolean
  canDropAt: (destination: InsertDestination) => boolean
}>()

const emit = defineEmits<{
  dropToTree: [destination: InsertDestination]
  dropTargetChange: [targetKey: string | null]
}>()

const key = computed(() => dropTargetKey(props.destination))
const isEnabled = computed(() => props.dragPayload !== null && props.canDropAt(props.destination))
const isActive = computed(() => props.activeDropTarget === key.value)

/**
 * 拖拽悬停处理。
 * 场景：只有合法投放区会设置当前高亮目标，并根据来源展示复制/移动语义。
 */
const handleDragOver = (event: DragEvent) => {
  event.dataTransfer!.dropEffect = props.dragPayload?.type === 'pool' ? 'copy' : 'move'
  emit('dropTargetChange', key.value)
}

/**
 * 投放处理。
 * 场景：中间菜单树所有 before/after/inside/root 投放点统一向页面容器提交目标位置。
 */
const handleDrop = () => {
  emit('dropToTree', props.destination)
  emit('dropTargetChange', null)
}
</script>

<style scoped lang="scss">
.drop-zone {
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #64748b;
  background: #f8fafc;
  font-size: 12px;
  line-height: 20px;
  text-align: center;
  padding: 7px 12px;
  transition: all 0.16s ease;

  &.compact {
    font-size: 11px;
    line-height: 18px;
    padding: 3px 8px;
  }

  &.active {
    color: #165dff;
    border-color: #165dff;
    background: #eff6ff;
  }
}
</style>
