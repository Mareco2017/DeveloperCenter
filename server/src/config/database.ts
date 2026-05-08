import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../entities/User';
import { EnterpriseAuth } from '../entities/EnterpriseAuth';
import { Team } from '../entities/Team';
import { TeamMember } from '../entities/TeamMember';
import { Capability } from '../entities/Capability';
import { ConfigPackage } from '../entities/ConfigPackage';
import { ConfigPackageItem } from '../entities/ConfigPackageItem';
import { Product } from '../entities/Product';
import { ProductCapability } from '../entities/ProductCapability';
import { AdminMenu } from '../entities/AdminMenu';
import { Scenario } from '../entities/Scenario';
import { ScenarioCapability } from '../entities/ScenarioCapability';
import { Terminal } from '../entities/Terminal';
import { hashPassword } from '../utils/password';

type PostgresSslOptions = false | { rejectUnauthorized: boolean };

export type RuntimeDatabaseOptions =
  | { type: 'sqlite'; database: string }
  | { type: 'postgres'; url: string; ssl?: PostgresSslOptions };

type RuntimeEnv = Record<string, string | undefined>;

/**
 * 判断当前是否运行在 Serverless 函数环境。
 * 场景：Vercel 函数只保证 /tmp 可写，不保证业务数据持久化；数据库配置必须走持久化服务。
 */
const isServerlessRuntime = (env: RuntimeEnv): boolean => Boolean(env.VERCEL);

/**
 * 读取 PostgreSQL 连接串。
 * 场景：Vercel Postgres/Neon/Supabase 等持久数据库通常提供 DATABASE_URL 或 POSTGRES_URL。
 */
const resolvePostgresUrl = (env: RuntimeEnv): string | undefined => {
  return env.DATABASE_URL || env.POSTGRES_URL || env.POSTGRES_PRISMA_URL || env.POSTGRES_URL_NON_POOLING;
};

/**
 * 解析 PostgreSQL SSL 配置。
 * 场景：托管数据库在 Vercel 上通常要求 SSL；本地 PostgreSQL 可通过 DB_SSL=false 显式关闭。
 */
const resolvePostgresSsl = (env: RuntimeEnv): PostgresSslOptions | undefined => {
  if (env.DB_SSL === 'false' || env.DATABASE_SSL === 'false' || env.PGSSLMODE === 'disable') {
    return false;
  }

  if (isServerlessRuntime(env) || env.DB_SSL === 'true' || env.PGSSLMODE === 'require') {
    return {
      rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
    };
  }

  return undefined;
};

/**
 * 解析运行时数据库配置。
 * 场景：本地开发继续使用 SQLite；线上 Serverless 必须使用 PostgreSQL 等持久数据库，避免能力、产品数据写入临时文件后丢失。
 */
export const resolveDatabaseOptions = (env: RuntimeEnv = process.env): RuntimeDatabaseOptions => {
  const postgresUrl = resolvePostgresUrl(env);
  if (postgresUrl) {
    const ssl = resolvePostgresSsl(env);
    return ssl === undefined
      ? { type: 'postgres', url: postgresUrl }
      : { type: 'postgres', url: postgresUrl, ssl };
  }

  if (isServerlessRuntime(env) && env.ALLOW_SERVERLESS_SQLITE !== 'true') {
    throw new Error('Serverless 环境缺少持久化数据库配置，请配置 DATABASE_URL 或 POSTGRES_URL，不能使用临时 SQLite 保存能力、产品数据。');
  }

  return {
    type: 'sqlite',
    database: env.DB_PATH || './data/developer.db'
  };
};

/**
 * SQLite数据库配置
 * 使用TypeORM管理数据库连接和实体
 */
export const AppDataSource = new DataSource({
  ...resolveDatabaseOptions(),
  synchronize: true, // 开发环境自动同步，生产环境建议关闭
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    EnterpriseAuth,
    Team,
    TeamMember,
    Capability,
    ConfigPackage,
    ConfigPackageItem,
    Product,
    ProductCapability,
    AdminMenu,
    Scenario,
    ScenarioCapability,
    Terminal
  ],
  migrations: [],
  subscribers: []
} as DataSourceOptions);

/**
 * 初始化默认管理员账号
 * 如果 admin 账号不存在，则创建默认账号
 */
const initializeDefaultAdmin = async (): Promise<void> => {
  const userRepository = AppDataSource.getRepository(User);

  // 检查是否已存在 admin 账号
  const existingAdmin = await userRepository.findOne({
    where: { username: 'admin' }
  });

  if (!existingAdmin) {
    // 创建默认管理员账号
    const hashedPassword = await hashPassword('123456');
    const adminUser = userRepository.create({
      username: 'admin',
      password: hashedPassword,
      phone: '13800138000',
      email: 'admin@example.com',
      realName: '管理员',
      status: 1
    });

    await userRepository.save(adminUser);
    console.log('默认管理员账号已创建: admin / 123456');
  } else {
    console.log('管理员账号已存在，跳过初始化');
  }
};

/**
 * 初始化数据库连接
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('数据库连接成功');

    // 初始化默认管理员账号
    await initializeDefaultAdmin();
  } catch (error) {
    console.error('数据库连接失败:', error);
    throw error;
  }
};
