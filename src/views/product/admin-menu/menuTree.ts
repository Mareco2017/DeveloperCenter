export type FactoryMenuType = 'function' | 'link' | 'group'

export interface FactoryI18nText {
  'zh-CN': string
  'en-US'?: string
  'zh-TW'?: string
  'ja-JP'?: string
  'vi-VN'?: string
  'th-TH'?: string
}

export interface FactorySystemMenu {
  menuId: string
  featureId?: string
  menuName: string
  menuNameI18n: FactoryI18nText
  menuType: FactoryMenuType
  menuPath?: string
  menuIcon?: string
  isSystem: boolean
  requiredPermission?: string
  parentMenuId?: string
  defaultSortOrder: number
  applicationName?: string
  poolItem?: boolean
  releaseTag?: string
}

export interface FactoryMenuNode {
  menuId: string
  menuType?: FactoryMenuType
  customName?: FactoryI18nText | null
  customIcon?: string | null
  customPath?: string | null
  openMode?: 'self' | 'blank' | null
  isVisible: boolean
  sortOrder: number
  children: FactoryMenuNode[]
}

export interface FactoryMenuTree {
  children: FactoryMenuNode[]
}

export interface FactoryMenuPreset {
  defaultMenuTree: FactoryMenuTree
  updatedAt: string
  updatedBy: string
}

export interface FactoryPageOption {
  id: string
  label: string
  path: string
}

export type InsertPosition = 'before' | 'after' | 'inside' | 'root-start' | 'root-end'

export interface InsertDestination {
  targetId?: string
  position: InsertPosition
}

export interface DragPayload {
  type: 'pool' | 'tree'
  menuId: string
}

export interface MenuNodeLocation {
  node: FactoryMenuNode
  parentId?: string
  level: number
}

const MAX_MENU_DEPTH = 4

/**
 * 深拷贝菜单树。
 * 场景：localStorage 快照、撤销未保存变更、纯函数返回值都需要避免共享引用。
 */
export const cloneMenuTree = (menuTree: FactoryMenuTree): FactoryMenuTree => {
  return JSON.parse(JSON.stringify(menuTree)) as FactoryMenuTree
}

/**
 * 深拷贝单个节点。
 * 场景：插入/移动节点时保护原树不被 Vue 响应式引用或数组操作误改。
 */
export const cloneMenuNode = (node: FactoryMenuNode): FactoryMenuNode => {
  return JSON.parse(JSON.stringify(node)) as FactoryMenuNode
}

/**
 * 根据排序字段稳定展示同级菜单。
 * 依赖：sortOrder 是同级菜单的用户可见顺序来源。
 */
export const sortMenuNodes = (nodes: FactoryMenuNode[]): FactoryMenuNode[] => {
  return [...nodes].sort((left, right) => left.sortOrder - right.sortOrder)
}

/**
 * 归一同级菜单排序。
 * 场景：拖拽插入、移动、删除后，避免同级 sortOrder 出现空洞或重复。
 */
const normalizeNodes = (nodes: FactoryMenuNode[]): FactoryMenuNode[] => {
  return nodes.map((node, index) => ({
    ...cloneMenuNode(node),
    sortOrder: index + 1,
    children: normalizeNodes(sortMenuNodes(node.children))
  }))
}

/**
 * 生成拖拽目标唯一键。
 * 依赖：树节点和根节点投放区共用同一套 activeDropTarget 状态。
 */
export const dropTargetKey = (destination: InsertDestination): string => {
  return `${destination.position}:${destination.targetId ?? 'root'}`
}

/**
 * 收集整棵树中的菜单 ID。
 * 场景：菜单池展示“已添加”、阻止重复拖入同一菜单模板。
 */
export const getTreeMenuIds = (menuTree: FactoryMenuTree): Set<string> => {
  const ids = new Set<string>()

  const visit = (nodes: FactoryMenuNode[]) => {
    nodes.forEach((node) => {
      ids.add(node.menuId)
      visit(node.children)
    })
  }

  visit(menuTree.children)
  return ids
}

/**
 * 在菜单树内查找节点和它的上下文位置。
 * 场景：右侧属性面板、上级菜单选择、拖拽合法性判断都会复用。
 */
export const findNodeInTree = (
  menuTree: FactoryMenuTree,
  nodeId?: string | null,
  level = 1,
  parentId?: string
): MenuNodeLocation | null => {
  if (!nodeId) return null

  const visit = (
    nodes: FactoryMenuNode[],
    currentLevel: number,
    currentParentId?: string
  ): MenuNodeLocation | null => {
    for (const node of nodes) {
      if (node.menuId === nodeId) {
        return {
          node,
          parentId: currentParentId,
          level: currentLevel
        }
      }

      const found = visit(node.children, currentLevel + 1, node.menuId)
      if (found) return found
    }

    return null
  }

  return visit(menuTree.children, level, parentId)
}

/**
 * 扁平化菜单树。
 * 场景：右侧属性面板需要列出可选父级目录，同时保持层级文案。
 */
export const flattenTree = (menuTree: FactoryMenuTree): MenuNodeLocation[] => {
  const rows: MenuNodeLocation[] = []

  const visit = (nodes: FactoryMenuNode[], level: number, parentId?: string) => {
    sortMenuNodes(nodes).forEach((node) => {
      rows.push({
        node,
        parentId,
        level
      })
      visit(node.children, level + 1, node.menuId)
    })
  }

  visit(menuTree.children, 1)
  return rows
}

/**
 * 判断 targetId 是否是 sourceId 的后代。
 * 场景：树内拖拽时禁止把父节点放到自己的子孙节点下面，防止形成循环。
 */
export const isDescendantNode = (
  menuTree: FactoryMenuTree,
  sourceId: string,
  targetId?: string
): boolean => {
  if (!targetId) return false

  const source = findNodeInTree(menuTree, sourceId)
  if (!source) return false

  const visit = (nodes: FactoryMenuNode[]): boolean => {
    return nodes.some((node) => {
      if (node.menuId === targetId) return true
      return visit(node.children)
    })
  }

  return visit(source.node.children)
}

const getNodeDepth = (node: FactoryMenuNode): number => {
  if (node.children.length === 0) return 1
  return 1 + Math.max(...node.children.map(getNodeDepth))
}

const getDestinationLevel = (
  menuTree: FactoryMenuTree,
  destination: InsertDestination
): number | null => {
  if (destination.position === 'root-start' || destination.position === 'root-end') {
    return 1
  }

  if (!destination.targetId) return 1

  const target = findNodeInTree(menuTree, destination.targetId)
  if (!target) return null

  return destination.position === 'inside' ? target.level + 1 : target.level
}

const isTargetDirectory = (
  menuTree: FactoryMenuTree,
  destination: InsertDestination,
  systemMenuMap?: Map<string, FactorySystemMenu>
): boolean => {
  if (destination.position !== 'inside') return true
  if (!destination.targetId) return true

  const target = findNodeInTree(menuTree, destination.targetId)
  if (!target) return false

  const targetType = target.node.menuType ?? systemMenuMap?.get(target.node.menuId)?.menuType ?? 'function'
  return targetType === 'group'
}

/**
 * 判断节点能否插入目标位置。
 * 场景：菜单池拖入和树内移动共享深度限制、目录限制。
 */
export const canInsertNodeAt = (
  menuTree: FactoryMenuTree,
  node: FactoryMenuNode,
  destination: InsertDestination,
  systemMenuMap?: Map<string, FactorySystemMenu>,
  maxDepth = MAX_MENU_DEPTH
): boolean => {
  const destinationLevel = getDestinationLevel(menuTree, destination)
  if (!destinationLevel) return false
  if (!isTargetDirectory(menuTree, destination, systemMenuMap)) return false

  return destinationLevel + getNodeDepth(node) - 1 <= maxDepth
}

const removeNode = (
  nodes: FactoryMenuNode[],
  nodeId: string
): { removed: FactoryMenuNode | null; nodes: FactoryMenuNode[] } => {
  let removed: FactoryMenuNode | null = null
  const nextNodes: FactoryMenuNode[] = []

  nodes.forEach((node) => {
    if (node.menuId === nodeId) {
      removed = cloneMenuNode(node)
      return
    }

    const childResult = removeNode(node.children, nodeId)
    if (childResult.removed) {
      removed = childResult.removed
    }

    nextNodes.push({
      ...cloneMenuNode(node),
      children: childResult.nodes
    })
  })

  return {
    removed,
    nodes: normalizeNodes(nextNodes)
  }
}

const insertIntoNodes = (
  nodes: FactoryMenuNode[],
  newNode: FactoryMenuNode,
  destination: InsertDestination
): FactoryMenuNode[] => {
  if (destination.position === 'root-start') {
    return normalizeNodes([cloneMenuNode(newNode), ...nodes])
  }

  if (destination.position === 'root-end' || !destination.targetId) {
    return normalizeNodes([...nodes, cloneMenuNode(newNode)])
  }

  let inserted = false

  const visit = (currentNodes: FactoryMenuNode[]): FactoryMenuNode[] => {
    const nextNodes: FactoryMenuNode[] = []

    currentNodes.forEach((node) => {
      if (!inserted && node.menuId === destination.targetId && destination.position === 'before') {
        nextNodes.push(cloneMenuNode(newNode))
        inserted = true
      }

      if (!inserted && node.menuId === destination.targetId && destination.position === 'inside') {
        nextNodes.push({
          ...cloneMenuNode(node),
          children: normalizeNodes([...node.children, cloneMenuNode(newNode)])
        })
        inserted = true
        return
      }

      nextNodes.push({
        ...cloneMenuNode(node),
        children: visit(node.children)
      })

      if (!inserted && node.menuId === destination.targetId && destination.position === 'after') {
        nextNodes.push(cloneMenuNode(newNode))
        inserted = true
      }
    })

    return normalizeNodes(nextNodes)
  }

  return visit(nodes)
}

/**
 * 将节点插入树结构。
 * 场景：菜单池拖入、新建目录、拖拽重排最终都落到该纯函数。
 */
export const insertNodeInTree = (
  menuTree: FactoryMenuTree,
  node: FactoryMenuNode,
  destination: InsertDestination
): FactoryMenuTree => {
  return {
    children: insertIntoNodes(
      sortMenuNodes(menuTree.children).map(cloneMenuNode),
      cloneMenuNode(node),
      destination
    )
  }
}

/**
 * 移动树内节点。
 * 场景：中间菜单树拖拽调整层级和顺序；非法目标返回原树快照。
 */
export const moveNodeInTree = (
  menuTree: FactoryMenuTree,
  nodeId: string,
  destination: InsertDestination,
  systemMenuMap?: Map<string, FactorySystemMenu>
): FactoryMenuTree => {
  if (destination.targetId === nodeId || isDescendantNode(menuTree, nodeId, destination.targetId)) {
    return cloneMenuTree(menuTree)
  }

  const source = findNodeInTree(menuTree, nodeId)
  if (!source || !canInsertNodeAt(menuTree, source.node, destination, systemMenuMap)) {
    return cloneMenuTree(menuTree)
  }

  const { removed, nodes } = removeNode(sortMenuNodes(menuTree.children), nodeId)
  if (!removed) return cloneMenuTree(menuTree)

  return {
    children: insertIntoNodes(nodes, removed, destination)
  }
}

/**
 * 删除树内节点。
 * 场景：点击删除按钮或拖入删除区时移除整个节点子树。
 */
export const removeNodeFromTree = (
  menuTree: FactoryMenuTree,
  nodeId: string
): FactoryMenuTree => {
  return {
    children: removeNode(sortMenuNodes(menuTree.children), nodeId).nodes
  }
}

/**
 * 更新树内节点字段。
 * 场景：右侧属性面板修改名称、图标、路由、显示状态等配置。
 */
export const updateNodeInTree = (
  menuTree: FactoryMenuTree,
  nodeId: string,
  updates: Partial<FactoryMenuNode>
): FactoryMenuTree => {
  const visit = (nodes: FactoryMenuNode[]): FactoryMenuNode[] => {
    return nodes.map((node) => {
      if (node.menuId === nodeId) {
        return {
          ...cloneMenuNode(node),
          ...updates,
          children: updates.children ? updates.children.map(cloneMenuNode) : node.children.map(cloneMenuNode)
        }
      }

      return {
        ...cloneMenuNode(node),
        children: visit(node.children)
      }
    })
  }

  return {
    children: visit(menuTree.children)
  }
}

/**
 * 解析节点显示名称。
 * 依赖：自定义名称优先，未配置时回落系统菜单模板。
 */
export const resolveNodeName = (
  node: FactoryMenuNode,
  systemMenu?: FactorySystemMenu
): string => {
  return node.customName?.['zh-CN'] || systemMenu?.menuNameI18n['zh-CN'] || systemMenu?.menuName || '未命名菜单'
}

/**
 * 创建自定义目录节点。
 * 场景：中间预设菜单树点击“新建菜单”时创建可承载子菜单的目录。
 */
export const createCustomGroupNode = (
  name = '新建菜单',
  icon = 'Folder',
  id = `custom_group_${Date.now()}`
): FactoryMenuNode => ({
  menuId: id,
  menuType: 'group',
  customName: { 'zh-CN': name },
  customIcon: icon,
  customPath: null,
  openMode: null,
  isVisible: true,
  sortOrder: 999,
  children: []
})

const buildChildrenMap = (systemMenus: FactorySystemMenu[]) => {
  const childrenMap = new Map<string, FactorySystemMenu[]>()

  systemMenus.forEach((menu) => {
    if (!menu.parentMenuId) return
    const children = childrenMap.get(menu.parentMenuId) ?? []
    children.push(menu)
    childrenMap.set(menu.parentMenuId, children)
  })

  return childrenMap
}

const buildTemplateNode = (
  systemMenu: FactorySystemMenu,
  childrenMap: Map<string, FactorySystemMenu[]>
): FactoryMenuNode => {
  const children = sortMenuNodes(
    (childrenMap.get(systemMenu.menuId) ?? []).map((child) => buildTemplateNode(child, childrenMap))
  )

  return {
    menuId: systemMenu.menuId,
    menuType: systemMenu.menuType,
    customName: null,
    customIcon: null,
    customPath: null,
    openMode: systemMenu.menuType === 'group' ? null : 'self',
    isVisible: true,
    sortOrder: systemMenu.defaultSortOrder,
    children
  }
}

/**
 * 从系统菜单模板创建可编辑节点。
 * 场景：从菜单池拖入预设菜单树时，目录型模板会带上默认子菜单。
 */
export const createMenuNodeFromTemplate = (
  systemMenus: FactorySystemMenu[],
  menuId: string
): FactoryMenuNode => {
  const systemMenu = systemMenus.find((menu) => menu.menuId === menuId)
  if (!systemMenu) {
    throw new Error(`未知菜单模板：${menuId}`)
  }

  return buildTemplateNode(systemMenu, buildChildrenMap(systemMenus))
}

/**
 * 判断树内节点能否移动到目标位置。
 * 场景：拖拽悬停时决定是否展示投放区和高亮状态。
 */
export const canMoveNodeTo = (
  menuTree: FactoryMenuTree,
  nodeId: string,
  destination: InsertDestination,
  systemMenuMap?: Map<string, FactorySystemMenu>
): boolean => {
  if (destination.targetId === nodeId) return false
  if (isDescendantNode(menuTree, nodeId, destination.targetId)) return false

  const source = findNodeInTree(menuTree, nodeId)
  if (!source) return false

  return canInsertNodeAt(menuTree, source.node, destination, systemMenuMap)
}
