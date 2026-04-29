import request from '@/utils/request'

/**
 * 团队相关API
 */

export interface Team {
  id: number
  name: string
  ownerId: number
  description?: string
  createdAt: string
}

export interface TeamMember {
  id: number
  userId: number
  username?: string
  realName?: string
  role: number
  status: number
  joinedAt?: string
}

export interface CreateTeamData {
  name: string
  description?: string
}

export interface InviteMemberData {
  username: string
  role?: number
}

/**
 * 创建团队
 * @param data 团队数据
 */
export const createTeam = (data: CreateTeamData) => {
  return request.post('/team', data) as Promise<Team>
}

/**
 * 获取团队列表
 */
export const getTeamList = () => {
  return request.get('/team') as Promise<Team[]>
}

/**
 * 获取团队详情
 * @param id 团队ID
 */
export const getTeamDetail = (id: number) => {
  return request.get(`/team/${id}`) as Promise<Team>
}

/**
 * 更新团队信息
 * @param id 团队ID
 * @param data 更新数据
 */
export const updateTeam = (id: number, data: Partial<CreateTeamData>) => {
  return request.put(`/team/${id}`, data) as Promise<Team>
}

/**
 * 获取团队成员列表
 * @param id 团队ID
 */
export const getTeamMembers = (id: number) => {
  return request.get(`/team/${id}/members`) as Promise<TeamMember[]>
}

/**
 * 邀请成员
 * @param id 团队ID
 * @param data 邀请数据
 */
export const inviteMember = (id: number, data: InviteMemberData) => {
  return request.post(`/team/${id}/members`, data) as Promise<any>
}

/**
 * 移除成员
 * @param teamId 团队ID
 * @param memberId 成员ID
 */
export const removeMember = (teamId: number, memberId: number) => {
  return request.delete(`/team/${teamId}/members/${memberId}`) as Promise<any>
}

/**
 * 更新成员角色
 * @param teamId 团队ID
 * @param memberId 成员ID
 * @param role 角色
 */
export const updateMemberRole = (teamId: number, memberId: number, role: number) => {
  return request.put(`/team/${teamId}/members/${memberId}`, { role }) as Promise<any>
}
