import 'reflect-metadata';
import { DataSource } from 'typeorm';
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

/**
 * SQLite数据库配置
 * 使用TypeORM管理数据库连接和实体
 */
export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DB_PATH || './data/developer.db',
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
});

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
