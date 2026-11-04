// Runs the content seed only when the seed files changed since the last
// successful seed. Every production build used to reseed everything (about ten
// minutes), which queued deploys behind each other and let two builds fight
// over the database.
//
// The fingerprint of prisma/seed.ts + prisma/seed-data/** is stored in
// AuditLog (action "seed_complete", the same no-migration pattern as
// /api/inquiries). Fail-safe in every direction: if the fingerprint can't be
// read, or doesn't match, the seed runs. A seed that fails writes nothing, so
// the next build tries again. Set FORCE_SEED=1 to seed regardless.
import { createHash } from 'crypto';
import { readdirSync, readFileSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

export function contentHash(): string {
  const files = [join(root, 'prisma/seed.ts'), ...listFiles(join(root, 'prisma/seed-data'))].sort();
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(relative(root, file));
    hash.update('\0');
    hash.update(readFileSync(file));
    hash.update('\0');
  }
  return hash.digest('hex');
}

async function main() {
  const hash = contentHash();
  const prisma = new PrismaClient();
  try {
    let last: string | null = null;
    try {
      const row = await prisma.auditLog.findFirst({
        where: { action: 'seed_complete', status: 'ok' },
        orderBy: { createdAt: 'desc' },
        select: { resourceId: true },
      });
      last = row?.resourceId ?? null;
    } catch (err) {
      console.warn('Could not read the last seed fingerprint, seeding to be safe:', (err as Error).message);
    }

    if (last === hash && !process.env.FORCE_SEED) {
      console.log(`Seed files unchanged (${hash.slice(0, 12)}), skipping the seed.`);
      return;
    }

    console.log(last ? 'Seed files changed, seeding.' : 'No previous seed on record, seeding.');
    const run = spawnSync('npm', ['run', 'db:seed'], { cwd: root, stdio: 'inherit' });
    if (run.status !== 0) process.exit(run.status ?? 1);

    try {
      await prisma.auditLog.create({
        data: { action: 'seed_complete', resource: 'seed', resourceId: hash, status: 'ok' },
      });
    } catch (err) {
      console.warn('Seeded, but could not record the fingerprint (next build will reseed):', (err as Error).message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
