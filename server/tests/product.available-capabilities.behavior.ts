import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * 产品可绑定能力行为测试。
 * 场景：产品绑定能力弹窗只应该展示当前产品可绑定的已发布能力，避免前端自行拼装通用能力列表时遗漏团队能力或混入不可绑定能力。
 * 依赖：TypeORM SQLite 临时库、product.service 的 getBindableCapabilities 契约。
 */
const run = async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'developer-center-bindable-'));
  process.env.DB_PATH = path.join(tempDir, 'developer.db');

  const { AppDataSource, initializeDatabase } = await import('../src/config/database');
  const { Team } = await import('../src/entities/Team');
  const { TeamMember } = await import('../src/entities/TeamMember');
  const { Capability } = await import('../src/entities/Capability');
  const { Product } = await import('../src/entities/Product');
  const { ProductCapability } = await import('../src/entities/ProductCapability');
  const { User } = await import('../src/entities/User');
  const productService = await import('../src/services/product.service');

  try {
    await initializeDatabase();

    const userRepository = AppDataSource.getRepository(User);
    const teamRepository = AppDataSource.getRepository(Team);
    const teamMemberRepository = AppDataSource.getRepository(TeamMember);
    const productRepository = AppDataSource.getRepository(Product);
    const capabilityRepository = AppDataSource.getRepository(Capability);
    const productCapabilityRepository = AppDataSource.getRepository(ProductCapability);

    const admin = await userRepository.findOneByOrFail({ username: 'admin' });
    const currentTeam = await teamRepository.save(teamRepository.create({ name: '当前团队', ownerId: admin.id }));
    const otherTeam = await teamRepository.save(teamRepository.create({ name: '其他团队', ownerId: admin.id }));
    await teamMemberRepository.save(
      teamMemberRepository.create({ teamId: currentTeam.id, userId: admin.id, role: 1, status: 1 })
    );

    const product = await productRepository.save(
      productRepository.create({ name: '团队产品', teamId: currentTeam.id, status: 0 })
    );

    const platformCapability = await capabilityRepository.save(
      capabilityRepository.create({ code: 'platform_published', name: '平台已发布能力', status: 1 })
    );
    const currentTeamCapability = await capabilityRepository.save(
      capabilityRepository.create({ code: 'team_published', name: '当前团队已发布能力', status: 1, teamId: currentTeam.id })
    );
    const boundCapability = await capabilityRepository.save(
      capabilityRepository.create({ code: 'already_bound', name: '已绑定能力', status: 1, teamId: currentTeam.id })
    );
    await capabilityRepository.save([
      capabilityRepository.create({ code: 'team_draft', name: '当前团队草稿能力', status: 0, teamId: currentTeam.id }),
      capabilityRepository.create({ code: 'other_team_published', name: '其他团队已发布能力', status: 1, teamId: otherTeam.id })
    ]);
    await productCapabilityRepository.save(
      productCapabilityRepository.create({ productId: product.id, capabilityId: boundCapability.id })
    );

    // 关键控制点：候选列表必须排除已绑定、未发布和其他团队能力，只保留本产品可真正绑定的能力。
    const bindableCapabilities = await productService.getBindableCapabilities(product.id, admin.id);
    const bindableNames = bindableCapabilities.map((capability: InstanceType<typeof Capability>) => capability.name);

    assert.deepEqual(bindableNames, [currentTeamCapability.name, platformCapability.name]);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

run().catch(error => {
  console.error(error);
  process.exit(1);
});
