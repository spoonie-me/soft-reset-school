/* Expands the compact per-track curriculum definitions in
 * scripts/curriculum-plan-src/ into the full blueprint JSON under
 * backend/prisma/seed-data/curriculum-plan/.
 *
 * The blueprints are generated rather than hand-written JSON because the
 * arithmetic in docs/CURRICULUM_ARCHITECTURE_100H.md is rigid — 30 modules of
 * 200 minutes, five lessons summing to 110, one practice set, one staged lab,
 * one checkpoint — and hand-maintaining 240 modules of that shape across eight
 * tracks invites exactly the silent drift the audit exists to catch. The source
 * files carry the curriculum decisions (module objectives, lesson titles,
 * energy costs, lab deliverables); this file carries the shape.
 *
 *   node scripts/build-curriculum-plan.mjs
 */
import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = join(ROOT, 'scripts', 'curriculum-plan-src');
const OUT_DIR = join(ROOT, 'backend', 'prisma', 'seed-data', 'curriculum-plan');

/** Per docs/CURRICULUM_ARCHITECTURE_100H.md §1. */
export const SHAPE = {
  targetMinutes: 6000,
  phasesPerTrack: 6,
  modulesPerPhase: 5,
  lessonsPerModule: 5,
  lessonMinutesPerModule: 110,
  practiceMinutes: 30,
  labMinutes: 50,
  checkpointMinutes: 10,
  moduleMinutes: 200,
  /** Checkpoint spacing — the 40/40/20 rule (§3). */
  pulls: { thisModule: 4, previousModule: 4, olderModules: 2 },
};

/** A lesson is [title, minutes, energy, bloom, badDayPath]. */
function expandLesson([title, minutes, energy, bloom, badDayPath], order) {
  return { order, title, minutes, energy, bloom, badDayPath: Boolean(badDayPath) };
}

/**
 * Each course is sold separately, so a checkpoint may only draw on modules in
 * its own course. Where a module has fewer than three earlier modules in its
 * course, the source file sets "courseSplitPulls": [this, previous, older] and
 * the pulls carry ownCourseOnly: true, which is the only thing the audit
 * accepts in place of the 40/40/20 rule.
 */
function checkpointPulls(mod, order, phaseOrder) {
  if (mod.courseSplitPulls) {
    const [thisModule, previousModule, olderModules] = mod.courseSplitPulls;
    return { thisModule, previousModule, olderModules, ownCourseOnly: true };
  }
  // Phase 1 module 1 has nothing behind it yet; the audit knows.
  if (phaseOrder === 1 && order === 1) return { thisModule: 10, previousModule: 0, olderModules: 0 };
  if (phaseOrder === 1 && order === 2) return { thisModule: 5, previousModule: 5, olderModules: 0 };
  return SHAPE.pulls;
}

function expandModule(mod, order, phaseOrder) {
  const lessons = mod.lessons.map((l, i) => expandLesson(l, i + 1));
  return {
    order,
    slug: mod.slug,
    name: mod.name,
    tier: mod.tier,
    bloom: mod.bloom,
    objective: mod.objective,
    minutes: SHAPE.moduleMinutes,
    lessons,
    practiceSet: {
      title: mod.practice[0],
      minutes: SHAPE.practiceMinutes,
      drills: mod.practice[1],
      energy: 'medium',
    },
    lab: {
      title: mod.lab[0],
      minutes: SHAPE.labMinutes,
      // Staged because §6 forbids any unit over 30 minutes that isn't broken
      // into independently resumable pieces.
      stages: mod.lab[1],
      deliverable: mod.lab[2],
      energy: 'high',
    },
    checkpoint: {
      title: `Checkpoint — ${mod.name}`,
      minutes: SHAPE.checkpointMinutes,
      energy: 'low',
      badDayPath: true,
      pulls: checkpointPulls(mod, order, phaseOrder),
    },
  };
}

export function expandTrack(def) {
  let moduleCounter = 0;
  const phases = def.phases.map((phase, pi) => ({
    order: pi + 1,
    slug: phase.slug,
    name: phase.name,
    outcome: phase.outcome,
    modules: phase.modules.map((m) => {
      moduleCounter += 1;
      return expandModule(m, moduleCounter, pi + 1);
    }),
    review: {
      title: `Phase review — ${phase.name}`,
      minutes: 20,
      energy: 'low',
      // §3: mixed retrieval across the phase plus one transfer item that needs
      // two modules' skills combined.
      transferQuestions: 1,
    },
  }));

  return {
    $schema: './blueprint.schema.md',
    track: def.track,
    title: def.title,
    outcome: def.outcome,
    targetMinutes: SHAPE.targetMinutes,
    architecture: 'docs/CURRICULUM_ARCHITECTURE_100H.md',
    phases,
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const files = (await readdir(SRC_DIR)).filter((f) => f.endsWith('.json')).sort();
  if (files.length === 0) {
    console.error(`No track definitions found in ${SRC_DIR}`);
    process.exit(1);
  }

  for (const file of files) {
    const def = JSON.parse(await readFile(join(SRC_DIR, file), 'utf-8'));
    const plan = expandTrack(def);
    const out = join(OUT_DIR, `${def.track}.json`);
    await writeFile(out, `${JSON.stringify(plan, null, 2)}\n`, 'utf-8');
    const modules = plan.phases.reduce((n, p) => n + p.modules.length, 0);
    console.log(`  ${def.track}: ${plan.phases.length} phases, ${modules} modules -> ${out}`);
  }
}

if (process.argv[1] && process.argv[1].endsWith('build-curriculum-plan.mjs')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
