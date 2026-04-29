<template>
  <aside class="menu-pool">
    <header class="pool-header">
      <h3>菜单池</h3>
      <p>支持拖拽至预设菜单中编排层级和顺序。</p>
    </header>

    <div class="pool-content">
      <el-input
        v-model="keyword"
        class="pool-search"
        placeholder="搜索菜单"
        clearable
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <div class="pool-scroll">
        <div
          v-for="app in filteredGroups"
          :key="app.appName"
          class="app-group"
        >
          <button class="app-title" type="button" @click="toggleApp(app.appName)">
            <el-icon class="arrow">
              <ArrowRight :class="{ expanded: isAppExpanded(app.appName) || hasKeyword }" />
            </el-icon>
            <el-icon class="app-icon"><Box /></el-icon>
            <span>{{ app.appName }}</span>
          </button>

          <div v-if="isAppExpanded(app.appName) || hasKeyword" class="feature-list">
            <div
              v-for="feature in app.features"
              :key="feature.featureName"
              class="feature-group"
            >
              <button
                class="feature-title"
                type="button"
                @click="toggleFeature(feature.featureName)"
              >
                <el-icon class="arrow">
                  <ArrowRight
                    :class="{ expanded: isFeatureExpanded(feature.featureName) || hasKeyword }"
                  />
                </el-icon>
                <span>{{ feature.featureName }}</span>
                <el-tag size="small" effect="plain">{{ feature.menus.length }}</el-tag>
              </button>

              <div
                v-if="isFeatureExpanded(feature.featureName) || hasKeyword"
                class="menu-list"
              >
                <div
                  v-for="menu in feature.menus"
                  :key="menu.menuId"
                  class="pool-menu-row"
                  :class="{ added: addedMenuIds.has(menu.menuId) }"
                >
                  <div
                    class="pool-menu-main"
                    :draggable="!addedMenuIds.has(menu.menuId)"
                    @dragstart="handleDragStart($event, menu.menuId)"
                    @dragend="emit('dragEnd')"
                  >
                    <span class="pool-menu-icon">
                      <el-icon>
                        <component :is="resolveMenuIcon(menu.menuIcon)" />
                      </el-icon>
                    </span>
                    <span class="pool-menu-name">{{ menu.menuName }}</span>
                  </div>
                  <el-tag
                    v-if="addedMenuIds.has(menu.menuId)"
                    size="small"
                    type="success"
                    effect="plain"
                  >
                    已添加
                  </el-tag>
                  <el-tag
                    v-else-if="menu.releaseTag"
                    size="small"
                    type="warning"
                    effect="plain"
                  >
                    {{ menu.releaseTag }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>

        <el-empty
          v-if="filteredGroups.length === 0"
          description="没有匹配的菜单"
          :image-size="80"
        />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, Box, Search } from '@element-plus/icons-vue'
import { getTreeMenuIds, type FactoryMenuTree, type FactorySystemMenu } from './menuTree'
import { resolveMenuIcon } from './iconMap'

interface FeatureGroup {
  featureName: string
  menus: FactorySystemMenu[]
}

interface AppGroup {
  appName: string
  features: FeatureGroup[]
}

const props = defineProps<{
  systemMenus: FactorySystemMenu[]
  menuTree: FactoryMenuTree
}>()

const emit = defineEmits<{
  dragStart: [menuId: string]
  dragEnd: []
}>()

const keyword = ref('')
const expandedApps = ref(new Set<string>(['培训应用', '考试']))
const expandedFeatures = ref(new Set<string>(['课程管理', '考试管理']))
const addedMenuIds = computed(() => getTreeMenuIds(props.menuTree))
const hasKeyword = computed(() => keyword.value.trim().length > 0)

const menuMap = computed(() => new Map(props.systemMenus.map((menu) => [menu.menuId, menu])))

/**
 * 获取菜单所属功能组名称。
 * 场景：菜单池按应用/功能两级归类，子菜单归到自己的顶级业务目录下。
 */
const getFeatureName = (menu: FactorySystemMenu): string => {
  let current = menu
  while (current.parentMenuId && menuMap.value.has(current.parentMenuId)) {
    current = menuMap.value.get(current.parentMenuId)!
  }

  return current.menuName
}

const groups = computed<AppGroup[]>(() => {
  const appMap = new Map<string, Map<string, FactorySystemMenu[]>>()
  const poolMenus = props.systemMenus.filter((menu) => menu.poolItem !== false)

  poolMenus.forEach((menu) => {
    const appName = menu.applicationName ?? '其他功能'
    const featureName = getFeatureName(menu)
    const featureMap = appMap.get(appName) ?? new Map<string, FactorySystemMenu[]>()
    const menus = featureMap.get(featureName) ?? []
    menus.push(menu)
    featureMap.set(featureName, menus)
    appMap.set(appName, featureMap)
  })

  return Array.from(appMap.entries()).map(([appName, featureMap]) => ({
    appName,
    features: Array.from(featureMap.entries()).map(([featureName, menus]) => ({
      featureName,
      menus: [...menus].sort((left, right) => left.defaultSortOrder - right.defaultSortOrder)
    }))
  }))
})

const filteredGroups = computed(() => {
  const search = keyword.value.trim().toLowerCase()
  if (!search) return groups.value

  return groups.value
    .map((app) => ({
      ...app,
      features: app.features
        .map((feature) => ({
          ...feature,
          menus: feature.menus.filter((menu) => {
            return (
              app.appName.toLowerCase().includes(search) ||
              feature.featureName.toLowerCase().includes(search) ||
              menu.menuName.toLowerCase().includes(search) ||
              menu.menuId.toLowerCase().includes(search)
            )
          })
        }))
        .filter((feature) => feature.menus.length > 0)
    }))
    .filter((app) => app.features.length > 0)
})

const isAppExpanded = (appName: string) => expandedApps.value.has(appName)
const isFeatureExpanded = (featureName: string) => expandedFeatures.value.has(featureName)

const toggleSetValue = (source: Set<string>, value: string) => {
  const next = new Set(source)
  if (next.has(value)) {
    next.delete(value)
  } else {
    next.add(value)
  }
  return next
}

const toggleApp = (appName: string) => {
  expandedApps.value = toggleSetValue(expandedApps.value, appName)
}

const toggleFeature = (featureName: string) => {
  expandedFeatures.value = toggleSetValue(expandedFeatures.value, featureName)
}

/**
 * 菜单池拖拽开始。
 * 场景：拖入中间树时以 copy 语义复制模板，而不是移除菜单池原始项。
 */
const handleDragStart = (event: DragEvent, menuId: string) => {
  if (addedMenuIds.value.has(menuId)) return
  event.dataTransfer!.effectAllowed = 'copy'
  event.dataTransfer!.setData('text/plain', menuId)
  emit('dragStart', menuId)
}
</script>

<style scoped lang="scss">
.menu-pool {
  display: flex;
  flex-direction: column;
  min-width: 220px;
  min-height: 0;
  background: #ffffff;
}

.pool-header {
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

.pool-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 14px;
}

.pool-search {
  margin-bottom: 12px;
}

.pool-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-right: 2px;
}

.app-group {
  margin-bottom: 10px;
}

.app-title,
.feature-title {
  width: 100%;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  text-align: left;
}

.app-title {
  gap: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
  padding: 9px 10px;
}

.feature-list {
  margin-top: 8px;
}

.feature-title {
  gap: 6px;
  border-radius: 6px;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 8px;

  &:hover {
    background: #f1f5f9;
  }

  .el-tag {
    margin-left: auto;
  }
}

.menu-list {
  margin: 2px 0 6px 18px;
  border-left: 2px solid #eef2f7;
  padding-left: 8px;
}

.pool-menu-row {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  margin: 2px 0;
  padding: 7px 8px;
  transition: all 0.16s ease;

  &:not(.added):hover {
    border-color: #dbeafe;
    background: #f8fafc;
  }

  &.added {
    background: #f8fafc;
    opacity: 0.66;
  }
}

.pool-menu-main {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 8px;
  cursor: grab;

  .added & {
    cursor: not-allowed;
  }
}

.pool-menu-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  border-radius: 6px;
  background: #eef2ff;
  color: #165dff;
}

.pool-menu-name {
  min-width: 0;
  overflow: hidden;
  color: #334155;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow {
  color: #94a3b8;

  .expanded {
    transform: rotate(90deg);
  }
}

.app-icon {
  color: #165dff;
}
</style>
