import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

/**
 * 认证服务
 * 处理用户注册、登录等认证相关逻辑
 */

const userRepository = AppDataSource.getRepository(User);

/**
 * 用户注册
 * @param username 用户名
 * @param password 密码
 * @param phone 手机号（可选）
 * @param email 邮箱（可选）
 * @returns 用户信息（不含密码）
 */
export const register = async (
  username: string,
  password: string,
  phone?: string,
  email?: string
): Promise<Omit<User, 'password'>> => {
  // 检查用户名是否已存在
  const existingUser = await userRepository.findOne({
    where: [{ username }, { phone: phone || undefined }, { email: email || undefined }]
  });

  if (existingUser) {
    throw new Error('用户名、手机号或邮箱已存在');
  }

  // 加密密码
  const hashedPassword = await hashPassword(password);

  // 创建用户
  const user = userRepository.create({
    username,
    password: hashedPassword,
    phone,
    email,
    status: 1
  });

  await userRepository.save(user);

  // 返回用户信息（不含密码）
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * 用户登录
 * @param username 用户名/手机号/邮箱
 * @param password 密码
 * @returns 用户信息和Token
 */
export const login = async (
  username: string,
  password: string
): Promise<{
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
}> => {
  // 查找用户（支持用户名、手机号、邮箱登录）
  const user = await userRepository.findOne({
    where: [{ username }, { phone: username }, { email: username }]
  });

  if (!user) {
    throw new Error('用户不存在');
  }

  // 检查用户状态
  if (user.status !== 1) {
    throw new Error('账号已被禁用');
  }

  // 验证密码
  if (!user.password) {
    throw new Error('账号未设置密码');
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error('密码错误');
  }

  // 生成Token
  const tokenPayload = { userId: user.id, username: user.username };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // 返回用户信息（不含密码）
  const { password: _, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken
  };
};

/**
 * 刷新Token
 * @param refreshToken 刷新Token
 * @returns 新的访问Token
 */
export const refreshToken = async (refreshToken: string): Promise<string> => {
  try {
    const { verifyToken } = await import('../utils/jwt.js');
    const payload = verifyToken(refreshToken);
    return generateAccessToken({ userId: payload.userId, username: payload.username });
  } catch (error) {
    throw new Error('Token无效或已过期');
  }
};

/**
 * 获取用户信息
 * @param userId 用户ID
 * @returns 用户信息
 */
export const getUserInfo = async (userId: number): Promise<Omit<User, 'password'>> => {
  const user = await userRepository.findOne({
    where: { id: userId },
    relations: ['enterpriseAuth']
  });

  if (!user) {
    throw new Error('用户不存在');
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
