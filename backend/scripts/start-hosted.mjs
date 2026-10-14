import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import pg from 'pg';
import { buildDatabaseConnectionString } from '../dist/common/prisma/build-connection-string.js';

const migration = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { stdio: 'inherit' });
if (migration.status !== 0) process.exit(migration.status ?? 1);

if (process.env.SEED_DEMO_ON_EMPTY_DATABASE === 'true') {
  const client = new pg.Client({ connectionString: buildDatabaseConnectionString() });
  await client.connect();
  let isEmpty;
  try {
    const result = await client.query('SELECT NOT EXISTS (SELECT 1 FROM users) AS empty');
    isEmpty = result.rows[0].empty;
  } finally {
    await client.end();
  }
  if (isEmpty) {
    console.log('[deploy] Initializing the empty database with demo data.');
    const { runSeed } = await import('../dist-seed/src/common/database/seeds.js');
    await runSeed();
  }
}

await import('../dist/main.js');
