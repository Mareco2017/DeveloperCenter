import assert from 'node:assert/strict';

/**
 * 数据库运行时配置行为测试。
 * 场景：Serverless 环境不能把业务数据写入临时 SQLite 文件，否则能力、产品等创建成功后会在实例回收后丢失。
 * 依赖：database.resolveDatabaseOptions 对运行环境和数据库连接环境变量的判断。
 */
const run = async () => {
  const { resolveDatabaseOptions } = await import('../src/config/database');

  // 关键控制点：Vercel 未配置持久数据库时必须失败，而不是继续使用 /tmp/developer.db 造成静默丢数据。
  assert.throws(
    () => resolveDatabaseOptions({ VERCEL: '1' }),
    /持久化数据库/
  );
  assert.throws(
    () => resolveDatabaseOptions({ VERCEL: '1', DB_PATH: '/tmp/developer.db' }),
    /持久化数据库/
  );

  // 关键控制点：配置 DATABASE_URL 后，Vercel API 必须切到 PostgreSQL 这类持久数据库。
  const postgresOptions = resolveDatabaseOptions({
    VERCEL: '1',
    DATABASE_URL: 'postgres://user:pass@example.com:5432/developer_center'
  });
  assert.equal(postgresOptions.type, 'postgres');
  assert.equal(postgresOptions.url, 'postgres://user:pass@example.com:5432/developer_center');

  // 关键控制点：本地开发继续使用项目内 SQLite，避免影响现有一键启动脚本和本地调试习惯。
  const localOptions = resolveDatabaseOptions({});
  assert.equal(localOptions.type, 'sqlite');
  assert.equal(localOptions.database, './data/developer.db');
};

run().catch(error => {
  console.error(error);
  process.exit(1);
});
