<template>
  <section class="menu-properties">
    <header class="panel-header">
      <div>
        <h3>菜单属性</h3>
        <p>修改节点名称、路由方式等参数。</p>
      </div>
    </header>

    <div v-if="!selectedNode" class="empty-properties">
      <el-icon><InfoFilled /></el-icon>
      <h4>还没有选中菜单</h4>
      <p>先从中间树结构中点击一个菜单项，再自定义名称、图标和路径等。</p>
    </div>

    <div v-else class="properties-scroll">
      <div class="node-summary">
        <div class="summary-icon">
          <el-icon>
            <component :is="resolveMenuIcon(currentIcon)" />
          </el-icon>
        </div>
        <div class="summary-text">
          <h4>{{ displayName }}</h4>
          <p>{{ selectedNode.menuId }}</p>
        </div>
        <el-tag :type="selectedNode.isVisible ? 'success' : 'info'" effect="plain">
          {{ selectedNode.isVisible ? '显示' : '隐藏' }}
        </el-tag>
      </div>

      <div class="form-section">
        <div class="section-title">基本信息</div>
        <el-form label-position="top">
          <el-form-item label="菜单名称">
            <div class="name-row">
              <el-input
                :model-value="displayName"
                placeholder="请输入菜单名称"
                @input="updateName('zh-CN', String($event))"
              />
              <el-popover
                v-model:visible="langPopoverVisible"
                placement="bottom-end"
                width="320"
                trigger="click"
              >
                <template #reference>
                  <el-button>
                    <el-icon><Connection /></el-icon>
                    多语言
                  </el-button>
                </template>
                <div class="popover-block">
                  <h5>多语言名称</h5>
                  <p>配置其他语言环境下的菜单显示名称。</p>
                  <div
                    v-for="lang in languages"
                    :key="lang.code"
                    class="language-row"
                  >
                    <label>{{ lang.label }}</label>
                    <el-input
                      :model-value="selectedNode.customName?.[lang.code] || ''"
                      :placeholder="selectedSystemMenu?.menuNameI18n?.[lang.code] || '未配置'"
                      @input="updateName(lang.code, String($event))"
                    />
                  </div>
                </div>
              </el-popover>
            </div>
          </el-form-item>

          <el-form-item label="菜单图标">
            <el-popover
              v-model:visible="iconPopoverVisible"
              placement="bottom-start"
              width="284"
              trigger="click"
            >
              <template #reference>
                <el-button class="icon-trigger">
                  <span>
                    <el-icon>
                      <component :is="resolveMenuIcon(currentIcon)" />
                    </el-icon>
                    {{ currentIcon }}
                  </span>
                  <el-icon><ArrowDown /></el-icon>
                </el-button>
              </template>
              <div class="icon-grid">
                <el-tooltip
                  v-for="iconName in menuIconOptions"
                  :key="iconName"
                  :content="iconName"
                  placement="top"
                >
                  <button
                    type="button"
                    class="icon-option"
                    :class="{ active: currentIcon === iconName }"
                    @click="updateIcon(iconName)"
                  >
                    <el-icon>
                      <component :is="resolveMenuIcon(iconName)" />
                    </el-icon>
                  </button>
                </el-tooltip>
              </div>
            </el-popover>
          </el-form-item>

          <el-form-item label="菜单显示">
            <el-switch
              :model-value="selectedNode.isVisible"
              active-text="显示"
              inactive-text="隐藏"
              @change="emit('update', selectedNode.menuId, { isVisible: Boolean($event) })"
            />
          </el-form-item>
        </el-form>
      </div>

      <div class="form-section">
        <div class="section-title">行为与路由</div>
        <el-form label-position="top">
          <el-form-item label="菜单类型">
            <el-radio-group :model-value="menuType" @change="handleMenuTypeChange">
              <el-radio-button value="function">功能</el-radio-button>
              <el-radio-button value="group">目录</el-radio-button>
              <el-radio-button value="link">链接</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="menuType === 'function'" label="关联系统功能">
            <el-select
              :model-value="selectedNode.menuId"
              filterable
              style="width: 100%"
              @change="handleSystemMenuChange"
            >
              <el-option
                v-for="menu in systemMenuOptions"
                :key="menu.menuId"
                :label="menu.fullName"
                :value="menu.menuId"
              />
            </el-select>
          </el-form-item>

          <el-form-item v-if="menuType !== 'group'" label="链接地址">
            <el-input
              :model-value="currentPath"
              :placeholder="selectedSystemMenu?.menuPath || '请输入链接地址'"
              @input="updatePath(String($event))"
            />
          </el-form-item>

          <el-form-item v-if="menuType !== 'group'" label="打开方式">
            <el-radio-group
              :model-value="selectedNode.openMode || 'self'"
              @change="emit('update', selectedNode.menuId, { openMode: $event as 'self' | 'blank' })"
            >
              <el-radio value="self">当前窗口</el-radio>
              <el-radio value="blank">新标签页</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>

      <div class="form-section">
        <div class="section-title">层级与排序</div>
        <el-form label-position="top">
          <el-form-item label="上级菜单">
            <el-select
              :model-value="parentSelectValue"
              style="width: 100%"
              @change="handleParentChange"
            >
              <el-option label="顶级菜单" value="root" />
              <el-option
                v-for="option in parentOptions"
                :key="option.node.menuId"
                :label="`${'　'.repeat(Math.max(option.level - 1, 0))}${option.name}`"
                :value="option.node.menuId"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="排序">
            <el-input-number
              :model-value="selectedNode.sortOrder"
              :min="1"
              :max="999"
              controls-position="right"
              @change="emit('update', selectedNode.menuId, { sortOrder: Number($event || 1) })"
            />
          </el-form-item>
        </el-form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowDown, Connection, InfoFilled } from '@element-plus/icons-vue'
import {
  findNodeInTree,
  flattenTree,
  getTreeMenuIds,
  isDescendantNode,
  resolveNodeName,
  type FactoryI18nText,
  type FactoryMenuNode,
  type FactoryMenuTree,
  type FactorySystemMenu,
  type InsertDestination
} from './menuTree'
import { menuIconOptions, resolveMenuIcon } from './iconMap'

const props = defineProps<{
  selectedNode: FactoryMenuNode | null
  selectedSystemMenu?: FactorySystemMenu
  menuTree: FactoryMenuTree
  systemMenus: FactorySystemMenu[]
}>()

const emit = defineEmits<{
  update: [menuId: string, updates: Partial<FactoryMenuNode>]
  move: [menuId: string, destination: InsertDestination]
}>()

const languages = [
  { code: 'en-US', label: 'English' },
  { code: 'zh-TW', label: '繁体中文' },
  { code: 'ja-JP', label: '日本語' },
  { code: 'vi-VN', label: 'Tiếng Việt' },
  { code: 'th-TH', label: 'ไทย' }
] as const

const iconPopoverVisible = ref(false)
const langPopoverVisible = ref(false)
const addedMenuIds = computed(() => getTreeMenuIds(props.menuTree))
const systemMenuMap = computed(() => new Map(props.systemMenus.map((menu) => [menu.menuId, menu])))
const displayName = computed(() =>
  props.selectedNode ? resolveNodeName(props.selectedNode, props.selectedSystemMenu) : ''
)
const currentIcon = computed(() =>
  props.selectedNode?.customIcon ?? props.selectedSystemMenu?.menuIcon ?? 'Folder'
)
const menuType = computed(() =>
  props.selectedNode?.menuType ?? props.selectedSystemMenu?.menuType ?? 'function'
)
const currentPath = computed(() =>
  props.selectedNode?.customPath ?? props.selectedSystemMenu?.menuPath ?? ''
)
const selectedLocation = computed(() => findNodeInTree(props.menuTree, props.selectedNode?.menuId))
const parentSelectValue = computed(() => selectedLocation.value?.parentId ?? 'root')

const systemMenuOptions = computed(() => {
  const getFullName = (menu: FactorySystemMenu): string => {
    if (menu.parentMenuId && systemMenuMap.value.has(menu.parentMenuId)) {
      return `${getFullName(systemMenuMap.value.get(menu.parentMenuId)!)} / ${menu.menuName}`
    }
    return menu.applicationName ? `${menu.applicationName} / ${menu.menuName}` : menu.menuName
  }

  return props.systemMenus
    .filter((menu) => menu.menuType !== 'group')
    .filter((menu) => !addedMenuIds.value.has(menu.menuId) || menu.menuId === props.selectedNode?.menuId)
    .map((menu) => ({
      ...menu,
      fullName: getFullName(menu)
    }))
    .sort((left, right) => left.fullName.localeCompare(right.fullName, 'zh-CN'))
})

const parentOptions = computed(() => {
  const selected = props.selectedNode
  if (!selected) return []

  return flattenTree(props.menuTree)
    .filter((location) => {
      const nodeType = location.node.menuType ?? systemMenuMap.value.get(location.node.menuId)?.menuType
      return (
        location.node.menuId !== selected.menuId &&
        nodeType === 'group' &&
        !isDescendantNode(props.menuTree, selected.menuId, location.node.menuId)
      )
    })
    .map((location) => ({
      ...location,
      name: resolveNodeName(location.node, systemMenuMap.value.get(location.node.menuId))
    }))
})

/**
 * 更新多语言名称。
 * 场景：中文主名称直接展示，其他语言通过弹层维护；空值会移除自定义覆盖。
 */
const updateName = (code: keyof FactoryI18nText, value: string) => {
  if (!props.selectedNode) return
  const nextName = { ...(props.selectedNode.customName ?? {}) } as FactoryI18nText
  const normalized = value.trimStart()

  if (normalized) {
    nextName[code] = normalized
  } else {
    delete nextName[code]
  }

  emit('update', props.selectedNode.menuId, {
    customName: Object.keys(nextName).length > 0 ? nextName : null
  })
}

/**
 * 更新菜单图标。
 * 场景：选择与模板一致的图标时清空覆盖值，保留后续接真实模板的能力。
 */
const updateIcon = (iconName: string) => {
  if (!props.selectedNode) return
  emit('update', props.selectedNode.menuId, {
    customIcon: iconName === props.selectedSystemMenu?.menuIcon ? null : iconName
  })
  iconPopoverVisible.value = false
}

const updatePath = (path: string) => {
  if (!props.selectedNode) return
  emit('update', props.selectedNode.menuId, {
    customPath: path === props.selectedSystemMenu?.menuPath ? null : path
  })
}

const handleMenuTypeChange = (value: string | number | boolean | undefined) => {
  if (!props.selectedNode || typeof value !== 'string') return
  emit('update', props.selectedNode.menuId, {
    menuType: value as FactoryMenuNode['menuType'],
    openMode: value === 'group' ? null : props.selectedNode.openMode || 'self'
  })
}

const handleSystemMenuChange = (menuId: string) => {
  if (!props.selectedNode) return
  const nextSystemMenu = systemMenuMap.value.get(menuId)
  emit('update', props.selectedNode.menuId, {
    menuId,
    menuType: nextSystemMenu?.menuType ?? 'function',
    customPath: null,
    customIcon: null,
    customName: null
  })
}

/**
 * 修改上级菜单。
 * 场景：属性面板提供非拖拽方式调整层级，最终仍复用树移动逻辑。
 */
const handleParentChange = (value: string | number | boolean | undefined) => {
  if (!props.selectedNode || typeof value !== 'string') return
  if (value === 'root') {
    emit('move', props.selectedNode.menuId, { position: 'root-end' })
    return
  }

  emit('move', props.selectedNode.menuId, {
    targetId: value,
    position: 'inside'
  })
}
</script>

<style scoped lang="scss">
.menu-properties {
  display: flex;
  width: 100%;
  flex: 1 1 0;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: #ffffff;
}

.panel-header {
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

.empty-properties {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  flex-direction: column;
  min-height: 360px;
  color: #64748b;
  text-align: center;
  padding: 28px;

  .el-icon {
    color: #94a3b8;
    font-size: 40px;
  }

  h4 {
    margin: 16px 0 6px;
    color: #111827;
    font-size: 16px;
    font-weight: 600;
  }

  p {
    max-width: 260px;
    margin: 0;
    font-size: 13px;
    line-height: 22px;
  }
}

.properties-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px;
}

.node-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #dbeafe;
  border-radius: 10px;
  background: #eff6ff;
  padding: 14px;
}

.summary-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  border-radius: 10px;
  background: #ffffff;
  color: #165dff;
  font-size: 22px;
}

.summary-text {
  flex: 1;
  min-width: 0;

  h4 {
    overflow: hidden;
    margin: 0;
    color: #111827;
    font-size: 16px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  p {
    overflow: hidden;
    margin: 4px 0 0;
    color: #64748b;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.form-section {
  margin-top: 22px;
}

.section-title {
  border-bottom: 1px solid #eef2f7;
  color: #111827;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 14px;
  padding-bottom: 8px;
}

.name-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  width: 100%;
}

.popover-block {
  h5 {
    margin: 0;
    color: #111827;
    font-size: 14px;
    font-weight: 600;
  }

  p {
    margin: 4px 0 14px;
    color: #64748b;
    font-size: 12px;
  }
}

.language-row {
  margin-bottom: 12px;

  label {
    display: block;
    margin-bottom: 5px;
    color: #475569;
    font-size: 12px;
    font-weight: 600;
  }
}

.icon-trigger {
  width: 100%;
  justify-content: space-between;

  span {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.icon-option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  color: #475569;
  cursor: pointer;

  &:hover,
  &.active {
    border-color: #bfdbfe;
    background: #eff6ff;
    color: #165dff;
  }
}

</style>
