import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  canMoveNodeTo,
  cloneMenuTree,
  createCustomGroupNode,
  createMenuNodeFromTemplate,
  findNodeInTree,
  flattenTree,
  insertNodeInTree,
  moveNodeInTree,
  removeNodeFromTree,
  resolveNodeName,
  updateNodeInTree,
  type FactoryMenuNode,
  type FactoryMenuPreset,
  type FactoryMenuTree,
  type FactorySystemMenu,
  type InsertDestination
} from './menuTree'
import { defaultFactoryMenuPreset, mockSystemMenus, pageOptions } from './mockData'

const storageKeyPrefix = 'developer-center:factory-admin-menu-preset'

const clonePreset = (preset: FactoryMenuPreset): FactoryMenuPreset => ({
  ...preset,
  defaultMenuTree: cloneMenuTree(preset.defaultMenuTree)
})

const getFirstNodeId = (menuTree: FactoryMenuTree): string | null => {
  return menuTree.children[0]?.menuId ?? null
}

const readStoredPreset = (productId: number): FactoryMenuPreset => {
  if (typeof window === 'undefined') {
    return clonePreset(defaultFactoryMenuPreset)
  }

  const raw = window.localStorage.getItem(`${storageKeyPrefix}:${productId}`)
  if (!raw) {
    return clonePreset(defaultFactoryMenuPreset)
  }

  try {
    const parsed = JSON.parse(raw) as FactoryMenuPreset
    if (!parsed.defaultMenuTree?.children) {
      return clonePreset(defaultFactoryMenuPreset)
    }
    return clonePreset(parsed)
  } catch {
    return clonePreset(defaultFactoryMenuPreset)
  }
}

const writeStoredPreset = (productId: number, preset: FactoryMenuPreset) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(`${storageKeyPrefix}:${productId}`, JSON.stringify(preset))
}

/**
 * 产品出厂菜单预设状态管理。
 * 场景：AdminMenuManage 页面需要 mock 持久化、菜单树编辑和选中节点联动。
 */
export const useFactoryMenuPreset = (productId: number) => {
  const savedPreset = ref<FactoryMenuPreset>(readStoredPreset(productId))
  const menuTree = ref<FactoryMenuTree>(cloneMenuTree(savedPreset.value.defaultMenuTree))
  const selectedMenuId = ref<string | null>(getFirstNodeId(menuTree.value))
  const isSaving = ref(false)
  const systemMenuMap = computed(() => new Map(mockSystemMenus.map((menu) => [menu.menuId, menu])))

  const selectedNodeLocation = computed(() => findNodeInTree(menuTree.value, selectedMenuId.value))
  const selectedNode = computed(() => selectedNodeLocation.value?.node ?? null)
  const selectedSystemMenu = computed(() =>
    selectedNode.value ? systemMenuMap.value.get(selectedNode.value.menuId) : undefined
  )

  const hasPendingChanges = computed(() => {
    return JSON.stringify(menuTree.value) !== JSON.stringify(savedPreset.value.defaultMenuTree)
  })

  watch(menuTree, () => {
    if (!selectedMenuId.value) return
    if (!findNodeInTree(menuTree.value, selectedMenuId.value)) {
      selectedMenuId.value = getFirstNodeId(menuTree.value)
    }
  })

  /**
   * 选择菜单树节点。
   * 依赖：右侧属性面板通过 selectedMenuId 派生当前可编辑节点。
   */
  const selectMenu = (menuId: string | null) => {
    selectedMenuId.value = menuId
  }

  /**
   * 新建自定义目录。
   * 场景：用户需要在出厂菜单中创建不绑定具体系统能力的分组。
   */
  const addCustomGroup = () => {
    const nextNode = createCustomGroupNode('新建菜单')
    menuTree.value = insertNodeInTree(menuTree.value, nextNode, { position: 'root-end' })
    selectedMenuId.value = nextNode.menuId
  }

  /**
   * 从菜单池模板添加菜单。
   * 依赖：createMenuNodeFromTemplate 会自动复制模板子菜单。
   */
  const addMenuFromTemplate = (menuId: string, destination: InsertDestination) => {
    const nextNode = createMenuNodeFromTemplate(mockSystemMenus, menuId)
    menuTree.value = insertNodeInTree(menuTree.value, nextNode, destination)
    selectedMenuId.value = nextNode.menuId
  }

  /**
   * 移动树内菜单节点。
   * 场景：拖拽排序、右侧选择上级菜单共用该入口。
   */
  const moveMenu = (menuId: string, destination: InsertDestination) => {
    menuTree.value = moveNodeInTree(menuTree.value, menuId, destination, systemMenuMap.value)
    selectedMenuId.value = menuId
  }

  /**
   * 删除菜单节点及其子树。
   * 场景：树节点删除按钮和拖入删除区共用。
   */
  const removeMenu = (menuId: string) => {
    menuTree.value = removeNodeFromTree(menuTree.value, menuId)
  }

  /**
   * 更新菜单节点配置。
   * 场景：属性面板更新名称、图标、路由、显示状态等字段。
   */
  const updateMenuItem = (menuId: string, updates: Partial<FactoryMenuNode>) => {
    menuTree.value = updateNodeInTree(menuTree.value, menuId, updates)
    if (updates.menuId && updates.menuId !== menuId) {
      selectedMenuId.value = updates.menuId
    }
  }

  /**
   * 保存 mock 预设到浏览器本地。
   * 依赖：productId 拼接 localStorage key，确保不同产品互不影响。
   */
  const saveConfig = async () => {
    isSaving.value = true
    await new Promise((resolve) => window.setTimeout(resolve, 300))

    savedPreset.value = {
      defaultMenuTree: cloneMenuTree(menuTree.value),
      updatedAt: new Date().toISOString(),
      updatedBy: 'mock_admin'
    }
    writeStoredPreset(productId, savedPreset.value)
    isSaving.value = false
    ElMessage.success('菜单预设已保存到本地 mock')
  }

  /**
   * 丢弃未保存变更。
   * 场景：用户点“重置未保存变更”时恢复最近一次保存快照。
   */
  const restoreSavedPreset = () => {
    menuTree.value = cloneMenuTree(savedPreset.value.defaultMenuTree)
    selectedMenuId.value = getFirstNodeId(menuTree.value)
  }

  const canMove = (menuId: string, destination: InsertDestination) => {
    return canMoveNodeTo(menuTree.value, menuId, destination, systemMenuMap.value)
  }

  const resolveSelectedName = computed(() => {
    return selectedNode.value
      ? resolveNodeName(selectedNode.value, selectedSystemMenu.value)
      : ''
  })

  return {
    menuTree,
    selectedMenuId,
    selectedNode,
    selectedNodeLocation,
    selectedSystemMenu,
    systemMenus: mockSystemMenus,
    pageOptions,
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
    canMove,
    flattenTree,
    resolveSelectedName
  }
}
