import bcrypt from 'bcryptjs';

/**
 * 密码工具函数
 * 提供密码加密和验证功能
 */

/**
 * 加密密码
 * @param password 明文密码
 * @returns 加密后的密码
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * 验证密码
 * @param password 明文密码
 * @param hashedPassword 加密后的密码
 * @returns 是否匹配
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};
