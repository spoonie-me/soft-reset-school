/* Curriculum audit — how far each track actually is from the 100-hour
 * architecture, and which rules the authored content currently breaks.
 *
 *   node scripts/curriculum-audit.mjs            report, exit 1 on errors
 *   node scripts/curriculum-audit.mjs --strict   exit 1 on warnings too
 *   node scripts/curriculum-audit.mjs --json     machine-readable output
 *
 * Errors are things that are broken: arithmetic that doesn't add up, an
 * exercise reference pointing at nothing, catalog numbers that no longer match
 * the seed data. Warnings are places authored content doesn't yet meet the
 * pedagogy spec — most of the existing curriculum predates it, so these are
 * reported honestly rather than treated as a build break.
 *
 * The spec is docs/CURRICULUM_ARCHITECTURE_100H.md. Section references below
 * point at it.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PLAN_DIR = join(ROOT, 'backend', 'prisma', 'seed-data', 'curriculum-plan');
const DOMAIN_DIR = join(ROOT, 'backend', 'prisma', 'seed-data', 'domains');
const CATALOG = join(ROOT, 'src', 'data', 'trackCatalog.ts');

/** §1 — the hour budget and the module unit it divides into. */
export const TARGET_MINUTES = 6000;
const MODULE_MINUTES = 200;
const LESSON_MINUTES_PER_MODULE = 110;
const PHASES_PER_TRACK = 6;
const MODULES_PER_PHASE = 5;
const LESSONS_PER_MODULE = 5;
/** §6 — nothing longer than this unless it is broken into resumable stages. */
const MAX_UNIT_MINUTES = 30;

/** §9 — section types that count toward the interactivity floor. */
export const INTERACTIVE_SECTIONS = new Set([
  'exercise',
  'interactive-guess',
  'concept-flow',
  'diagnose-mechanism',
  'spot-flaw',
  'sequence-it',
  'build-it',
  'evidence-stack',
  'predict-number',
  'prompt-build',
  'worked-example',
  'retrieval-check',
  'case-sim',
  'lab-brief',
  'screen-reader-sim',
]);

/** Structural sections that are neither prose nor interaction — they don't
 * count toward the floor, and they don't count against it either. */
const NEUTRAL_SECTIONS = new Set(['pod-header']);

/** Exercise types whose config shape is verified against the real React
 * component (see docs/CONTENT_AUTHORING_GUIDE.md §5). The other four
 * (FILL_IN_BLANK, CASE_STUDY, DIAGRAM_LABEL, CODE_QUERY) have pre-existing,
 * unverified config shapes predating this whole effort — flagged as a
 * warning rather than blocked, since fixing them is a separate piece of work. */
const DISCOURAGED_EXERCISE_TYPES = new Set(['FILL_IN_BLANK', 'CASE_STUDY', 'DIAGRAM_LABEL', 'CODE_QUERY']);

/** Checks one exercise's `config` against what its type's component actually
 * reads. This exists because a config shape mismatch renders as a blank or
 * broken exercise in the app with no error anywhere — the seed script and
 * TypeScript are both happy, since `config` is stored as opaque JSON. Two
 * real instances of this shipped before this check existed: a nested
 * CATEGORIZATION shape from an early authoring pattern, and TRUE_FALSE_JUSTIFY
 * entries missing `statement` (the component renders `"${statement}"` as a
 * quoted card — undefined renders as an empty pair of quotes). Returns an
 * error string, or null if the config looks right. */
function checkExerciseConfigShape(ex) {
  const c = ex.config ?? {};
  switch (ex.type) {
    case 'MULTIPLE_CHOICE':
      if (!Array.isArray(c.options) || c.options.length === 0 || !c.options.every((o) => typeof o.text === 'string')) {
        return `config.options must be a non-empty array of {text, correct?}`;
      }
      return null;
    case 'MATCHING':
      if (!Array.isArray(c.pairs) || c.pairs.length === 0 || !c.pairs.every((p) => 'left' in p && 'right' in p)) {
        return `config.pairs must be a non-empty array of {left, right}`;
      }
      return null;
    case 'SEQUENCING':
      if (!('items' in c) || !('correctOrder' in c)) return `config needs both "items" and "correctOrder"`;
      return null;
    case 'TRUE_FALSE_JUSTIFY':
      if (typeof c.statement !== 'string' || !c.statement) return `config.statement is missing — renders as an empty quoted card`;
      if (typeof c.correctAnswer !== 'boolean') return `config.correctAnswer must be a boolean`;
      return null;
    case 'CATEGORIZATION': {
      if (!Array.isArray(c.categories) || c.categories.length === 0) return `config.categories must be a non-empty array of strings`;
      if (typeof c.categories[0] !== 'string') return `config.categories must be flat strings, not {label, items} objects`;
      if (!Array.isArray(c.items) || !c.items.every((i) => 'text' in i && 'category' in i)) {
        return `config.items must be an array of {text, category}`;
      }
      return null;
    }
    case 'OPEN_ENDED':
      return null; // config is legitimately empty/absent — AI-graded from prompt/explanation.
    default:
      return null; // discouraged types are unverified by design, not wrong by definition.
  }
}

/** §2 — at least this share of a lesson's non-structural sections must be
 * interactive. */
const INTERACTIVITY_FLOOR = 0.4;

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function listDirs(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path).filter((f) => statSync(join(path, f)).isDirectory());
}

/* ─────────────────────────────────────────────────────────────
   Blueprint integrity — the plan itself must obey the spec
   ───────────────────────────────────────────────────────────── */

export function auditBlueprint(plan) {
  const errors = [];
  const at = (m) => `${plan.track}/${m}`;

  if (plan.phases.length !== PHASES_PER_TRACK) {
    errors.push(`${plan.track}: ${plan.phases.length} phases, expected ${PHASES_PER_TRACK} (§1)`);
  }

  const titles = new Map();
  let total = 0;
  /** Every unit in the order a learner meets it, for the consecutive-high rule. */
  const stream = [];

  for (const phase of plan.phases) {
    if (phase.modules.length !== MODULES_PER_PHASE) {
      errors.push(`${plan.track}/${phase.slug}: ${phase.modules.length} modules, expected ${MODULES_PER_PHASE} (§1)`);
    }
    for (const m of phase.modules) {
      total += m.minutes;
      if (m.minutes !== MODULE_MINUTES) errors.push(`${at(m.slug)}: module is ${m.minutes} min, expected ${MODULE_MINUTES} (§1)`);
      if (m.lessons.length !== LESSONS_PER_MODULE) errors.push(`${at(m.slug)}: ${m.lessons.length} lessons, expected ${LESSONS_PER_MODULE} (§1)`);

      const lessonMinutes = m.lessons.reduce((n, l) => n + l.minutes, 0);
      if (lessonMinutes !== LESSON_MINUTES_PER_MODULE) {
        errors.push(`${at(m.slug)}: lessons sum to ${lessonMinutes} min, expected ${LESSON_MINUTES_PER_MODULE} (§1)`);
      }

      const declared = lessonMinutes + m.practiceSet.minutes + m.lab.minutes + m.checkpoint.minutes;
      if (declared !== m.minutes) {
        errors.push(`${at(m.slug)}: units sum to ${declared} min but module claims ${m.minutes} (§1)`);
      }

      for (const l of m.lessons) {
        if (titles.has(l.title)) {
          errors.push(`${plan.track}: duplicate lesson title "${l.title}" in ${titles.get(l.title)} and ${m.slug} (§8)`);
        }
        titles.set(l.title, m.slug);
        if (l.minutes > MAX_UNIT_MINUTES) errors.push(`${at(m.slug)}: lesson "${l.title}" is ${l.minutes} min, over the ${MAX_UNIT_MINUTES} min cap (§6)`);
        if (l.energy === 'high') errors.push(`${at(m.slug)}: lesson "${l.title}" is high-energy — the lab is meant to be the module's only one (§6)`);
        stream.push({ where: at(m.slug), what: l.title, energy: l.energy, minutes: l.minutes, badDayPath: l.badDayPath });
      }

      // §5 — a lab over the unit cap must be staged, and must say what it produces.
      if (m.lab.minutes > MAX_UNIT_MINUTES && (!m.lab.stages || m.lab.stages < 3)) {
        errors.push(`${at(m.slug)}: lab is ${m.lab.minutes} min with ${m.lab.stages ?? 0} stages — needs at least 3 (§5, §6)`);
      }
      if (!m.lab.deliverable) errors.push(`${at(m.slug)}: lab has no deliverable (§5)`);
      // §4 — practice sets are 6-8 drills; 10 is tolerated for the densest modules.
      if (m.practiceSet.drills < 6 || m.practiceSet.drills > 10) {
        errors.push(`${at(m.slug)}: practice set has ${m.practiceSet.drills} drills, expected 6-10 (§4)`);
      }

      stream.push({ where: at(m.slug), what: m.practiceSet.title, energy: m.practiceSet.energy, minutes: m.practiceSet.minutes, badDayPath: false });
      stream.push({ where: at(m.slug), what: m.lab.title, energy: m.lab.energy, minutes: m.lab.minutes, badDayPath: false });
      stream.push({ where: at(m.slug), what: m.checkpoint.title, energy: m.checkpoint.energy, minutes: m.checkpoint.minutes, badDayPath: m.checkpoint.badDayPath });

      const highs = [...m.lessons, m.practiceSet, m.lab, m.checkpoint].filter((u) => u.energy === 'high');
      if (highs.length > 1) errors.push(`${at(m.slug)}: ${highs.length} high-energy units, at most 1 allowed (§6)`);

      // §6 — the bad-day path must exist and be a genuine subset, not the whole module.
      const badDayMinutes =
        m.lessons.filter((l) => l.badDayPath).reduce((n, l) => n + l.minutes, 0) +
        (m.checkpoint.badDayPath ? m.checkpoint.minutes : 0);
      const share = badDayMinutes / m.minutes;
      if (share < 0.3 || share > 0.6) {
        errors.push(`${at(m.slug)}: bad-day path is ${Math.round(share * 100)}% of the module, expected 30-60% (§6)`);
      }
      if (!m.checkpoint.badDayPath) errors.push(`${at(m.slug)}: checkpoint is not on the bad-day path (§6)`);

      // §3 — the 40/40/20 rule, relaxed only where there is nothing behind it yet.
      const p = m.checkpoint.pulls;
      const pullTotal = p.thisModule + p.previousModule + p.olderModules;
      if (pullTotal !== 10) errors.push(`${at(m.slug)}: checkpoint pulls sum to ${pullTotal}, expected 10 (§3)`);
      if (m.order > 2 && (p.thisModule !== 4 || p.previousModule !== 4 || p.olderModules !== 2)) {
        errors.push(`${at(m.slug)}: checkpoint pulls are ${p.thisModule}/${p.previousModule}/${p.olderModules}, expected 4/4/2 (§3)`);
      }
    }
  }

  // §6 — never two high-energy units back to back, module boundaries included.
  for (let i = 1; i < stream.length; i += 1) {
    if (stream[i].energy === 'high' && stream[i - 1].energy === 'high') {
      errors.push(`${stream[i].where}: "${stream[i - 1].what}" and "${stream[i].what}" are both high-energy and consecutive (§6)`);
    }
  }

  if (total !== TARGET_MINUTES) {
    errors.push(`${plan.track}: blueprint totals ${total} min, expected ${TARGET_MINUTES} (§1)`);
  }

  return { errors, plannedMinutes: total, plannedLessons: titles.size };
}

/* ─────────────────────────────────────────────────────────────
   Authored content — what actually exists, and what it breaks
   ───────────────────────────────────────────────────────────── */

export function auditAuthoredTrack(trackId) {
  const errors = [];
  const warnings = [];
  const dir = join(DOMAIN_DIR, trackId);
  let lessons = 0;
  let minutes = 0;
  let exercises = 0;
  let interactiveLessons = 0;

  for (const slug of listDirs(dir)) {
    const lessonsPath = join(dir, slug, 'lessons.json');
    if (!existsSync(lessonsPath)) continue;
    const lessonList = readJson(lessonsPath);
    const exercisePath = join(dir, slug, 'exercises.json');
    const exerciseList = existsSync(exercisePath) ? readJson(exercisePath) : [];
    exercises += exerciseList.length;
    const refs = new Set(exerciseList.map((e) => e.ref));

    // Module.id is a real foreign key: Lesson.moduleId and Exercise.moduleId
    // both reference it, so a lesson pointing at a module with no
    // modules.json entry is not a style nit — it's a row the DB seed will
    // fail to insert. Also guard against duplicate ids/refs within a folder,
    // the signature of two writers racing the same file.
    const modulesPath = join(dir, slug, 'modules.json');
    const moduleList = existsSync(modulesPath) ? readJson(modulesPath) : [];
    const moduleIds = new Set();
    for (const m of moduleList) {
      if (moduleIds.has(m.id)) errors.push(`${trackId}/${slug}: duplicate module id "${m.id}" in modules.json`);
      moduleIds.add(m.id);
    }
    const seenLessonIds = new Set();
    for (const l of lessonList) {
      if (seenLessonIds.has(l.id)) errors.push(`${trackId}/${slug}: duplicate lesson id "${l.id}" in lessons.json`);
      seenLessonIds.add(l.id);
      if (!moduleIds.has(l.moduleId)) {
        errors.push(`${trackId}/${slug}/${l.id}: moduleId "${l.moduleId}" has no entry in modules.json`);
      }
    }
    const seenRefs = new Set();
    for (const e of exerciseList) {
      if (seenRefs.has(e.ref)) errors.push(`${trackId}/${slug}: duplicate exercise ref "${e.ref}" in exercises.json`);
      seenRefs.add(e.ref);

      // A bad config shape doesn't fail the seed or the type-checker — config
      // is opaque JSON — it just renders broken or blank in the app, silently.
      const shapeError = checkExerciseConfigShape(e);
      if (shapeError) errors.push(`${trackId}/${slug}/${e.ref}: ${shapeError}`);
      if (DISCOURAGED_EXERCISE_TYPES.has(e.type)) {
        warnings.push(`${trackId}/${slug}/${e.ref}: type "${e.type}" has an unverified config shape — avoid for new content (§5)`);
      }
    }

    for (const lesson of lessonList) {
      lessons += 1;
      minutes += lesson.duration ?? 0;
      const where = `${trackId}/${slug}/${lesson.id}`;

      // §6 — the cap is on unbroken units. A lab carries its own resumable
      // stages, so it is exempt exactly as long as it really has them.
      const stagedLab = (lesson.contentSections ?? []).find(
        (s) => s.type === 'lab-brief' && Array.isArray(s.stages) && s.stages.length >= 3,
      );
      if ((lesson.duration ?? 0) > MAX_UNIT_MINUTES && !stagedLab) {
        warnings.push(`${where}: lesson is ${lesson.duration} min, over the ${MAX_UNIT_MINUTES} min cap (§6)`);
      }
      if (!Array.isArray(lesson.learningObjectives) || lesson.learningObjectives.length === 0) {
        warnings.push(`${where}: no learning objectives (§8)`);
      }

      const sections = Array.isArray(lesson.contentSections) ? lesson.contentSections : [];
      const gradeable = sections.filter((s) => !NEUTRAL_SECTIONS.has(s.type));
      const interactive = gradeable.filter((s) => INTERACTIVE_SECTIONS.has(s.type));

      if (interactive.length === 0) {
        warnings.push(`${where}: no interactive section at all (§2)`);
      } else {
        interactiveLessons += 1;
      }
      // A lab or a checkpoint is one interactive unit filling the whole lesson —
      // counting its sections understates it badly (a 50-minute staged lab reads
      // as one section beside its hook and takeaway). The floor exists to catch
      // lessons that are mostly prose, which these structurally cannot be.
      const isSingleUnitLesson = sections.some((s) => s.type === 'lab-brief' || s.type === 'retrieval-check');
      if (!isSingleUnitLesson && gradeable.length > 0 && interactive.length / gradeable.length < INTERACTIVITY_FLOOR) {
        warnings.push(
          `${where}: ${Math.round((interactive.length / gradeable.length) * 100)}% interactive, floor is ${INTERACTIVITY_FLOOR * 100}% (§2)`,
        );
      }

      // §9 — never the same interactive type twice in a row, and never more than
      // one prose section stranded between two interactions.
      let prosRun = 0;
      let lastInteractive = null;
      for (const s of gradeable) {
        if (INTERACTIVE_SECTIONS.has(s.type)) {
          if (s.type === lastInteractive && s.type !== 'exercise') {
            warnings.push(`${where}: two consecutive "${s.type}" sections (§9)`);
          }
          lastInteractive = s.type;
          prosRun = 0;
        } else {
          prosRun += 1;
          if (prosRun === 3) warnings.push(`${where}: ${prosRun}+ prose sections in a row (§9)`);
        }
      }

      for (const s of sections) {
        if (s.type === 'exercise' && !refs.has(s.exerciseRef)) {
          errors.push(`${where}: references exercise "${s.exerciseRef}" which does not exist in ${slug}/exercises.json`);
        }
      }
    }
  }

  return { errors, warnings, lessons, minutes, exercises, interactiveLessons };
}

/* ─────────────────────────────────────────────────────────────
   Catalog consistency — the public numbers must match the data
   ───────────────────────────────────────────────────────────── */

/** Parses the lessonCount / totalMinutes each track advertises on /tracks.
 * Deliberately a regex over the source rather than an import: the catalog is a
 * .ts module with JSX-free but TS-only syntax, and this script runs under plain
 * node with no build step. */
export function parseCatalogCounts(source = readFileSync(CATALOG, 'utf-8')) {
  const counts = {};
  const blocks = source.split(/\n\s*slug: '/).slice(1);
  for (const block of blocks) {
    const slug = block.slice(0, block.indexOf("'"));
    const lessonCount = /lessonCount:\s*(\d+)/.exec(block);
    const totalMinutes = /totalMinutes:\s*(\d+)/.exec(block);
    if (lessonCount && totalMinutes) {
      counts[slug] = { lessonCount: Number(lessonCount[1]), totalMinutes: Number(totalMinutes[1]) };
    }
  }
  return counts;
}

/* ─────────────────────────────────────────────────────────────
   Report
   ───────────────────────────────────────────────────────────── */

export function runAudit() {
  const errors = [];
  const warnings = [];
  const tracks = [];

  const planFiles = existsSync(PLAN_DIR) ? readdirSync(PLAN_DIR).filter((f) => f.endsWith('.json')) : [];
  const catalog = parseCatalogCounts();

  for (const file of planFiles) {
    const plan = readJson(join(PLAN_DIR, file));
    const blueprint = auditBlueprint(plan);
    const authored = auditAuthoredTrack(plan.track);
    errors.push(...blueprint.errors, ...authored.errors);
    warnings.push(...authored.warnings);

    const advertised = catalog[plan.track];
    if (advertised) {
      if (advertised.lessonCount !== authored.lessons) {
        errors.push(
          `${plan.track}: trackCatalog advertises ${advertised.lessonCount} lessons, seed data has ${authored.lessons}`,
        );
      }
      if (advertised.totalMinutes !== authored.minutes) {
        errors.push(
          `${plan.track}: trackCatalog advertises ${advertised.totalMinutes} min, seed data has ${authored.minutes}`,
        );
      }
    }

    tracks.push({
      track: plan.track,
      title: plan.title,
      plannedMinutes: blueprint.plannedMinutes,
      plannedLessons: blueprint.plannedLessons,
      authoredMinutes: authored.minutes,
      authoredLessons: authored.lessons,
      authoredExercises: authored.exercises,
      percentComplete: Math.round((authored.minutes / blueprint.plannedMinutes) * 1000) / 10,
    });
  }

  return { tracks, errors, warnings };
}

function main() {
  const strict = process.argv.includes('--strict');
  const result = runAudit();

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('\nCurriculum audit — target is 6,000 authored minutes per track (docs/CURRICULUM_ARCHITECTURE_100H.md)\n');
    const pad = (s, n) => String(s).padEnd(n);
    const num = (s, n) => String(s).padStart(n);
    console.log(`  ${pad('track', 34)}${num('authored', 9)}${num('planned', 9)}${num('done', 7)}${num('lessons', 9)}`);
    console.log(`  ${'-'.repeat(34 + 9 + 9 + 7 + 9)}`);
    let authoredTotal = 0;
    let plannedTotal = 0;
    for (const t of result.tracks.sort((a, b) => b.percentComplete - a.percentComplete)) {
      authoredTotal += t.authoredMinutes;
      plannedTotal += t.plannedMinutes;
      console.log(
        `  ${pad(t.track, 34)}${num(`${(t.authoredMinutes / 60).toFixed(1)}h`, 9)}${num(`${t.plannedMinutes / 60}h`, 9)}${num(`${t.percentComplete}%`, 7)}${num(`${t.authoredLessons}/${t.plannedLessons}`, 9)}`,
      );
    }
    console.log(`  ${'-'.repeat(34 + 9 + 9 + 7 + 9)}`);
    console.log(
      `  ${pad('total', 34)}${num(`${(authoredTotal / 60).toFixed(1)}h`, 9)}${num(`${plannedTotal / 60}h`, 9)}${num(`${Math.round((authoredTotal / plannedTotal) * 1000) / 10}%`, 7)}\n`,
    );

    if (result.warnings.length) {
      console.log(`  ${result.warnings.length} spec warnings in authored content:`);
      for (const w of result.warnings.slice(0, 30)) console.log(`    · ${w}`);
      if (result.warnings.length > 30) console.log(`    · ... and ${result.warnings.length - 30} more`);
      console.log('');
    }

    if (result.errors.length) {
      console.log(`  ${result.errors.length} ERRORS:`);
      for (const e of result.errors) console.log(`    ✗ ${e}`);
      console.log('');
    } else {
      console.log('  No errors.\n');
    }
  }

  const failed = result.errors.length > 0 || (strict && result.warnings.length > 0);
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && process.argv[1].endsWith('curriculum-audit.mjs')) main();
