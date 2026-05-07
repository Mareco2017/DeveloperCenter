import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * 产品场景行为测试。
 * 场景：创建场景方案前必须先确认产品ID有效且产品存在，避免前端在无效路由下把“产品不存在”当成正常业务失败继续重试。
 * 依赖：TypeORM SQLite 临时库、product.service 的场景创建与列表契约。
 */
const run = async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'developer-center-scenario-'));
  process.env.DB_PATH = path.join(tempDir, 'developer.db');

  const { AppDataSource, initializeDatabase } = await import('../src/config/database');
  const { Product } = await import('../src/entities/Product');
  const { User } = await import('../src/entities/User');
  const productService = await import('../src/services/product.service');

  try {
    await initializeDatabase();

    const userRepository = AppDataSource.getRepository(User);
    const productRepository = AppDataSource.getRepository(Product);

    const admin = await userRepository.findOneByOrFail({ username: 'admin' });
    const product = await productRepository.save(
      productRepository.create({ name: '场景测试产品', status: 0 })
    );

    // 关键控制点：合法产品 ID 必须可以创建并重新读取场景方案。
    const scenario = await productService.createScenario(product.id, admin.id, {
      code: 'scenario_valid_0507',
      name: '有效场景'
    });
    assert.equal(scenario.productId, product.id);
    assert.equal(scenario.code, 'scenario_valid_0507');

    const scenarios = await productService.getScenarios(product.id);
    assert.equal(scenarios.length, 1);
    assert.equal(scenarios[0]?.code, 'scenario_valid_0507');

    // 关键控制点：非法产品 ID 需要在服务层前置拦截，避免误报成产品不存在。
    await assert.rejects(
      async () =>
        productService.createScenario(Number.NaN, admin.id, {
          code: 'scenario_invalid',
          name: '非法场景'
        }),
      /产品ID无效/
    );

    await assert.rejects(
      async () => productService.getScenarios(0),
      /产品ID无效/
    );
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
