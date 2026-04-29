import request from '@/utils/request'

/**
 * 管理后台菜单相关API
 */

export interface AdminMenu {
  id: number
  productId: number
  parentId: number
  name: string
  icon?: string
  path?: string
  sortOrder: number
  visibleRoles?: string
  children?: AdminMenu[]
  createdAt?: string
}

export interface CreateMenuData {
  parentId?: number
  name: string
  icon?: string
  path?: string
  sortOrder?: number
  visibleRoles?: string
}

export interface UpdateMenuData {
  name?: string
  icon?: string
  path?: string
  sortOrder?: number
  visibleRoles?: string
}

export interface MenuOrderItem {
  id: number
  sortOrder: number
  parentId?: number
}

/**
 * 获取产品管理后台菜单树
 * @param productId 产品ID
 */
export const getMenuTree = (productId: number) => {
  return request.get(`/product/${productId}/admin-menus`) as Promise<AdminMenu[]>
}

/**
 * 获取产品的扁平菜单列表（用于选择父菜单）
 * @param productId 产品ID
 * @param excludeId 排除的菜单ID
 */
export const getFlatMenuList = (productId: number, excludeId?: number) => {
  return request.get(`/product/${productId}/admin-menus/flat`, {
    params: { excludeId }
  }) as Promise<AdminMenu[]>
}

/**
 * 创建管理后台菜单
 * @param productId 产品ID
 * @param data 菜单数据
 */
export const createMenu = (productId: number, data: CreateMenuData) => {
  return request.post(`/product/${productId}/admin-menus`, data) as Promise<AdminMenu>
}

/**
 * 更新管理后台菜单
 * @param productId 产品ID
 * @param menuId 菜单ID
 * @param data 更新数据
 */
export const updateMenu = (productId: number, menuId: number, data: UpdateMenuData) => {
  return request.put(`/product/${productId}/admin-menus/${menuId}`, data) as Promise<AdminMenu>
}

/**
 * 删除管理后台菜单
 * @param productId 产品ID
 * @param menuId 菜单ID
 */
export const deleteMenu = (productId: number, menuId: number) => {
  return request.delete(`/product/${productId}/admin-menus/${menuId}`) as Promise<any>
}

/**
 * 移动管理后台菜单（更改父级）
 * @param productId 产品ID
 * @param menuId 菜单ID
 * @param targetParentId 目标父菜单ID
 */
export const moveMenu = (productId: number, menuId: number, targetParentId: number) => {
  return request.put(`/product/${productId}/admin-menus/${menuId}/move`, {
    targetParentId
  }) as Promise<AdminMenu>
}

/**
 * 批量更新菜单排序
 * @param productId 产品ID
 * @param menuOrders 菜单排序数据
 */
export const updateMenuSort = (productId: number, menuOrders: MenuOrderItem[]) => {
  return request.put(`/product/${productId}/admin-menus/sort`, {
    menuOrders
  }) as Promise<any>
}
