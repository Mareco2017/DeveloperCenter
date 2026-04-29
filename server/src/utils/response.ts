import { Response } from 'express';

/**
 * 统一响应格式
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

/**
 * 成功响应
 * @param res Express响应对象
 * @param data 响应数据
 * @param message 响应消息
 * @param code 状态码
 */
export const successResponse = <T>(
  res: Response,
  data?: T,
  message: string = '操作成功',
  code: number = 200
): void => {
  const response: ApiResponse<T> = {
    code,
    message,
    data
  };
  res.status(code).json(response);
};

/**
 * 错误响应
 * @param res Express响应对象
 * @param message 错误消息
 * @param code 状态码
 * @param data 附加数据
 */
export const errorResponse = (
  res: Response,
  message: string = '操作失败',
  code: number = 400,
  data?: any
): void => {
  const response: ApiResponse = {
    code,
    message,
    data
  };
  res.status(code).json(response);
};
