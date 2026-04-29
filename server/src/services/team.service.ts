import { AppDataSource } from '../config/database';
import { Team } from '../entities/Team';
import { TeamMember } from '../entities/TeamMember';
import { User } from '../entities/User';

/**
 * 团队服务
 * 处理团队管理相关逻辑
 */

const teamRepository = AppDataSource.getRepository(Team);
const teamMemberRepository = AppDataSource.getRepository(TeamMember);
const userRepository = AppDataSource.getRepository(User);

/**
 * 创建团队
 * @param userId 创建人ID
 * @param name 团队名称
 * @param description 团队描述
 * @returns 团队信息
 */
export const createTeam = async (
  userId: number,
  name: string,
  description?: string
): Promise<Team> => {
  // 创建团队
  const team = teamRepository.create({
    name,
    description,
    ownerId: userId
  });

  await teamRepository.save(team);

  // 创建人自动成为团队管理员
  const member = teamMemberRepository.create({
    teamId: team.id,
    userId,
    role: 1, // 管理员
    status: 1, // 已加入
    joinedAt: new Date()
  });

  await teamMemberRepository.save(member);

  return team;
};

/**
 * 获取用户的团队列表
 * @param userId 用户ID
 * @returns 团队列表
 */
export const getUserTeams = async (userId: number): Promise<Team[]> => {
  // 查找用户加入的所有团队
  const memberships = await teamMemberRepository.find({
    where: { userId, status: 1 },
    relations: ['team']
  });

  return memberships.map(m => m.team).filter((t): t is Team => t !== undefined);
};

/**
 * 获取团队详情
 * @param teamId 团队ID
 * @param userId 当前用户ID
 * @returns 团队详情
 */
export const getTeamDetail = async (teamId: number, userId: number): Promise<Team> => {
  // 检查用户是否是团队成员
  const membership = await teamMemberRepository.findOne({
    where: { teamId, userId, status: 1 }
  });

  if (!membership) {
    throw new Error('您不是该团队成员');
  }

  const team = await teamRepository.findOne({
    where: { id: teamId }
  });

  if (!team) {
    throw new Error('团队不存在');
  }

  return team;
};

/**
 * 更新团队信息
 * @param teamId 团队ID
 * @param userId 当前用户ID
 * @param data 更新数据
 * @returns 更新后的团队
 */
export const updateTeam = async (
  teamId: number,
  userId: number,
  data: { name?: string; description?: string }
): Promise<Team> => {
  // 检查权限（只有管理员可以更新）
  const membership = await teamMemberRepository.findOne({
    where: { teamId, userId, status: 1 }
  });

  if (!membership || membership.role !== 1) {
    throw new Error('只有管理员可以更新团队信息');
  }

  const team = await teamRepository.findOne({ where: { id: teamId } });
  if (!team) {
    throw new Error('团队不存在');
  }

  // 更新字段
  if (data.name) team.name = data.name;
  if (data.description !== undefined) team.description = data.description;

  await teamRepository.save(team);
  return team;
};

/**
 * 获取团队成员列表
 * @param teamId 团队ID
 * @param userId 当前用户ID
 * @returns 成员列表
 */
export const getTeamMembers = async (
  teamId: number,
  userId: number
): Promise<any[]> => {
  // 检查用户是否是团队成员
  const membership = await teamMemberRepository.findOne({
    where: { teamId, userId, status: 1 }
  });

  if (!membership) {
    throw new Error('您不是该团队成员');
  }

  const members = await teamMemberRepository.find({
    where: { teamId },
    relations: ['user']
  });

  return members.map(m => ({
    id: m.id,
    userId: m.userId,
    username: m.user?.username,
    realName: m.user?.realName,
    role: m.role,
    status: m.status,
    joinedAt: m.joinedAt
  }));
};

/**
 * 邀请成员加入团队
 * @param teamId 团队ID
 * @param inviterId 邀请人ID
 * @param username 被邀请人用户名
 * @param role 角色
 * @returns 成员信息
 */
export const inviteMember = async (
  teamId: number,
  inviterId: number,
  username: string,
  role: number = 2
): Promise<TeamMember> => {
  // 检查邀请人权限
  const inviterMembership = await teamMemberRepository.findOne({
    where: { teamId, userId: inviterId, status: 1 }
  });

  if (!inviterMembership || inviterMembership.role !== 1) {
    throw new Error('只有管理员可以邀请成员');
  }

  // 查找被邀请用户
  const user = await userRepository.findOne({ where: { username } });
  if (!user) {
    throw new Error('用户不存在');
  }

  // 检查是否已经是成员
  const existingMember = await teamMemberRepository.findOne({
    where: { teamId, userId: user.id }
  });

  if (existingMember) {
    throw new Error('该用户已经是团队成员');
  }

  // 创建成员记录
  const member = teamMemberRepository.create({
    teamId,
    userId: user.id,
    role,
    status: 1, // 直接加入，简化流程
    joinedAt: new Date()
  });

  await teamMemberRepository.save(member);
  return member;
};

/**
 * 移除团队成员
 * @param teamId 团队ID
 * @param operatorId 操作人ID
 * @param memberId 成员ID
 */
export const removeMember = async (
  teamId: number,
  operatorId: number,
  memberId: number
): Promise<void> => {
  // 检查操作人权限
  const operatorMembership = await teamMemberRepository.findOne({
    where: { teamId, userId: operatorId, status: 1 }
  });

  if (!operatorMembership || operatorMembership.role !== 1) {
    throw new Error('只有管理员可以移除成员');
  }

  // 不能移除自己
  if (operatorId === memberId) {
    throw new Error('不能移除自己');
  }

  const member = await teamMemberRepository.findOne({
    where: { teamId, userId: memberId }
  });

  if (!member) {
    throw new Error('成员不存在');
  }

  await teamMemberRepository.remove(member);
};

/**
 * 更新成员角色
 * @param teamId 团队ID
 * @param operatorId 操作人ID
 * @param memberId 成员ID
 * @param role 新角色
 */
export const updateMemberRole = async (
  teamId: number,
  operatorId: number,
  memberId: number,
  role: number
): Promise<void> => {
  // 检查操作人权限
  const operatorMembership = await teamMemberRepository.findOne({
    where: { teamId, userId: operatorId, status: 1 }
  });

  if (!operatorMembership || operatorMembership.role !== 1) {
    throw new Error('只有管理员可以修改成员角色');
  }

  const member = await teamMemberRepository.findOne({
    where: { teamId, userId: memberId }
  });

  if (!member) {
    throw new Error('成员不存在');
  }

  member.role = role;
  await teamMemberRepository.save(member);
};
