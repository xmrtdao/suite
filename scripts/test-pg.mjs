// scripts/test-pg.mjs — quick smoke test for embedded postgres
import EmbeddedPostgres from 'embedded-postgres';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function main() {
  console.log('[test-pg] starting embedded postgres...');
  const pg = new EmbeddedPostgres({
    databaseDir: path.join(ROOT, '.pgdata'),
    user: 'postgres',
    password: 'postgres',
    port: 5432,
    persistent: true,
    // Force-load the windows-x64 binary we already have.
  });
  // initialise (idempotent — only runs if databaseDir is empty)
  try {
    await pg.initialise();
    console.log('[test-pg] initialised');
  } catch (e) {
    if (/already initialised|database directory is not empty/i.test(String(e.message))) {
      console.log('[test-pg] databaseDir already populated, skipping init');
    } else {
      throw e;
    }
  }
  await pg.start();
  console.log('[test-pg] started on port 5432');
  const client = pg.getPgClient();
  await client.connect();
  const r = await client.query('SELECT version()');
  console.log('[test-pg]', r.rows[0].version);
  await client.end();
  await pg.stop();
  console.log('[test-pg] stopped cleanly');
}

main().catch((e) => { console.error(e); process.exit(1); });
