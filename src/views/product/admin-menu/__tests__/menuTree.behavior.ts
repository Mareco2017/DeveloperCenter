import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  getTreeMenuIds,
  insertNodeInTree,
  moveNodeInTree,
  type FactoryMenuNode,
  type FactoryMenuTree
} from '../menuTree.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * 行为测试专用节点工厂。
 * 用于验证菜单树纯函数，不依赖 Vue 组件或浏览器状态。
 */
const node = (
  menuId: string,
  children: FactoryMenuNode[] = [],
  menuType: FactoryMenuNode['menuType'] = children.length > 0 ? 'group' : 'function'
): FactoryMenuNode => ({
  menuId,
  menuType,
  customName: { 'zh-CN': menuId },
  customIcon: null,
  customPath: null,
  openMode: 'self',
  isVisible: true,
  sortOrder: 99,
  children
})

const baseTree: FactoryMenuTree = {
  children: [
    node('group_a', [node('child_a')], 'group'),
    node('group_b', [], 'group')
  ]
}

const inserted = insertNodeInTree(baseTree, node('menu_new'), {
  position: 'inside',
  targetId: 'group_b'
})

assert.deepEqual(
  inserted.children.map((item) => item.sortOrder),
  [1, 2],
  '根节点排序应在插入后重新归一'
)
assert.deepEqual(
  inserted.children[1]!.children.map((item) => item.menuId),
  ['menu_new'],
  '应能把新菜单插入目标目录内部'
)
assert.deepEqual(
  Array.from(getTreeMenuIds(inserted)).sort(),
  ['child_a', 'group_a', 'group_b', 'menu_new'],
  '应能收集完整树内菜单 ID，用于判断重复添加'
)

const illegalMove = moveNodeInTree(baseTree, 'group_a', {
  position: 'inside',
  targetId: 'child_a'
})

assert.deepEqual(
  illegalMove,
  baseTree,
  '不允许把父菜单移动到自己的后代节点下'
)

const mockDataSource = readFileSync(resolve(__dirname, '../mockData.ts'), 'utf-8')
assert.equal(
  /visibleRoleIds:\s*\[|\.visibleRoleIds\s*=/.test(mockDataSource),
  false,
  '默认预设不应携带可见角色限制，避免隐藏字段影响出厂菜单'
)

console.log('menuTree behavior tests passed')
