import jwt from 'jsonwebtoken';

/**
 * JWT工具函数
 * 提供Token生成和验证功能
 */

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN: jwt.SignOptions['expiresIn'] = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];
const REFRESH_TOKEN_EXPIRES_IN: jwt.SignOptions['expiresIn'] = (process.env.REFRESH_TOKEN_EXPIRES_IN || '30d') as jwt.SignOptions['expiresIn'];

/**
 * Token载荷接口
 */
export interface TokenPayload {
  userId: number;
  username: string;
}

/**
 * 生成访问Token
 * @param payload Token载荷
 * @returns JWT Token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * 生成刷新Token
 * @param payload Token载荷
 * @returns JWT Token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};

/**
 * 验证Token
 * @param token JWT Token
 * @returns Token载荷
 */
export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};
