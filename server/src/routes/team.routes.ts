import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { successResponse, errorResponse } from '../utils/response';
import * as teamService from '../services/team.service';

/**
 * 团队路由
 * 处理团队管理相关请求
 */
const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * 创建团队
 * POST /api/team
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, description } = req.body;

    if (!name) {
      errorResponse(res, '团队名称不能为空', 400);
      return;
    }

    const team = await teamService.createTeam(userId, name, description);
    successResponse(res, team, '创建成功', 201);
  } catch (error: any) {
    errorResponse(res, error.message || '创建失败', 400);
  }
});

/**
 * 获取团队列表
 * GET /api/team
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const teams = await teamService.getUserTeams(userId);
    successResponse(res, teams, '获取成功');
  } catch (error: any) {
    errorResponse(res, error.message || '获取失败', 400);
  }
});

/**
 * 获取团队详情
 * GET /api/team/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const teamId = parseInt(req.params.id as string);

    const team = await teamService.getTeamDetail(teamId, userId);
    successResponse(res, team, '获取成功');
  } catch (error: any) {
    errorResponse(res, error.message || '获取失败', 400);
  }
});

/**
 * 更新团队信息
 * PUT /api/team/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const teamId = parseInt(req.params.id as string);
    const { name, description } = req.body;

    const team = await teamService.updateTeam(teamId, userId, { name, description });
    successResponse(res, team, '更新成功');
  } catch (error: any) {
    errorResponse(res, error.message || '更新失败', 400);
  }
});

/**
 * 获取团队成员列表
 * GET /api/team/:id/members
 */
router.get('/:id/members', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const teamId = parseInt(req.params.id as string);

    const members = await teamService.getTeamMembers(teamId, userId);
    successResponse(res, members, '获取成功');
  } catch (error: any) {
    errorResponse(res, error.message || '获取失败', 400);
  }
});

/**
 * 邀请成员
 * POST /api/team/:id/members
 */
router.post('/:id/members', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const teamId = parseInt(req.params.id as string);
    const { username, role } = req.body;

    if (!username) {
      errorResponse(res, '用户名不能为空', 400);
      return;
    }

    const member = await teamService.inviteMember(teamId, userId, username, role);
    successResponse(res, member, '邀请成功', 201);
  } catch (error: any) {
    errorResponse(res, error.message || '邀请失败', 400);
  }
});

/**
 * 移除成员
 * DELETE /api/team/:id/members/:memberId
 */
router.delete('/:id/members/:memberId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const teamId = parseInt(req.params.id as string);
    const memberId = parseInt(req.params.memberId as string);

    await teamService.removeMember(teamId, userId, memberId);
    successResponse(res, null, '移除成功');
  } catch (error: any) {
    errorResponse(res, error.message || '移除失败', 400);
  }
});

/**
 * 更新成员角色
 * PUT /api/team/:id/members/:memberId
 */
router.put('/:id/members/:memberId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const teamId = parseInt(req.params.id as string);
    const memberId = parseInt(req.params.memberId as string);
    const { role } = req.body;

    if (role === undefined) {
      errorResponse(res, '角色不能为空', 400);
      return;
    }

    await teamService.updateMemberRole(teamId, userId, memberId, role);
    successResponse(res, null, '更新成功');
  } catch (error: any) {
    errorResponse(res, error.message || '更新失败', 400);
  }
});

export default router;
