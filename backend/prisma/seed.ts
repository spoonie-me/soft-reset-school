import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(join(__dirname, path), 'utf-8'));
}

/** Safely stringify a value for SQLite string-JSON columns. */
function toJson(val: unknown): string {
  if (val === undefined || val === null) return '{}';
  if (typeof val === 'string') return val;
  return JSON.stringify(val);
}

function toJsonArray(val: unknown): string {
  if (Array.isArray(val)) return JSON.stringify(val);
  return '[]';
}

// exercises.json uses numeric 1-5, schema uses string
function difficultyLabel(n: number): string {
  if (n <= 2) return 'easy';
  if (n <= 3) return 'medium';
  if (n <= 4) return 'hard';
  return 'expert';
}

// Canonical track definitions. When a new track's content lands (Phase 4),
// add its slug to the `trackIds` array below too so its domains.json gets loaded.
const TRACKS: Array<{ slug: string; name: string; description: string; order: number }> = [
  { slug: 'fundamentals', name: 'Coding Fundamentals', description: 'Core programming foundations: syntax, logic, data structures, and basic problem-solving.', order: 1 },
  { slug: 'ai', name: 'AI Integration for Developers', description: 'Practical AI tools, prompt engineering, and integrating LLMs into development workflows.', order: 2 },
  { slug: 'tools', name: 'Developer Tooling Mastery', description: 'Essential toolchains: IDEs, debuggers, version control, CI/CD, and automation frameworks.', order: 3 },
  { slug: 'advanced', name: 'Advanced Software Engineering', description: 'Scalability, system design, security, performance optimization, and production-grade coding.', order: 4 },
  // Soft Reset School (merged product, working title) tracks — no seed-data/domains content yet, Phase 4
  { slug: 'ai-orchestrated-dev', name: 'AI-Assisted Software Development', description: 'Directing AI tools effectively rather than writing every line manually.', order: 5 },
  { slug: 'ai-workflow-consulting', name: 'AI Automation Consulting', description: 'Designing and auditing human-AI collaboration in real-world systems.', order: 6 },
  { slug: 'ai-oversight-health-informatics', name: 'AI-Augmented Medical Coding', description: 'Expert-level review and exception-handling for AI-generated clinical code — not entry-level data entry.', order: 7 },
  { slug: 'accessibility-qa-lived-experience', name: 'Digital Accessibility QA', description: 'Accessibility review grounded in WCAG standards and lived disability experience.', order: 8 },
];

async function main() {
  console.log('Seeding Bedcoders database...\n');

  // ─── 0. Seed canonical Tracks ────────────────────────────────────────
  for (const t of TRACKS) {
    await prisma.track.upsert({
      where: { slug: t.slug },
      update: { name: t.name, description: t.description, order: t.order },
      create: t,
    });
  }
  console.log(`  ${TRACKS.length} tracks seeded\n`);

  // ─── 1. Seed Badges ──────────────────────────────────────────────────
  const badges = loadJson<any[]>('seed-data/badges.json');
  console.log(`Seeding ${badges.length} badges...`);
  for (const badge of badges) {
    const category = badge.criteria?.type || 'milestone';
    await prisma.badge.upsert({
      where: { key: badge.id },
      update: {},
      create: {
        key: badge.id,
        name: badge.name,
        description: badge.description,
        tier: badge.tier,
        icon: badge.icon,
        category,
        criteria: toJson(badge.criteria),
      },
    });
  }
  console.log(`  ${badges.length} badges seeded\n`);

  // Course fields per domain, keyed by the domain's seed id (domains.json "id").
  // Domains not listed here (the health-informatics track and the archived
  // tracks) are reset to the defaults below: not for sale.
  const courses = loadJson<Record<string, {
    courseSlug: string; courseTitle: string; courseBlurb: string; courseOrder: number; courseForSale: boolean;
  }>>('seed-data/courses.json');

  const COURSE_DEFAULTS = {
    courseSlug: null, courseTitle: null, courseBlurb: null, courseOrder: null, courseForSale: false,
  };

  // ─── 2. Seed all tracks ──────────────────────────────────────────────
  const trackIds = ['fundamentals', 'ai', 'tools', 'advanced', 'accessibility-qa-lived-experience', 'ai-orchestrated-dev', 'ai-workflow-consulting', 'ai-oversight-health-informatics'];

  for (const trackId of trackIds) {
    let domains: any[];
    try {
      domains = loadJson<any[]>(`seed-data/domains/${trackId}/domains.json`);
    } catch {
      console.log(`No domains.json for track ${trackId}, skipping`);
      continue;
    }

    console.log(`\nSeeding track "${trackId}" (${domains.length} domains)...`);

    for (const domainData of domains) {
      // Course fields follow the seed id, not the row position. If the row at
      // (trackId, order) belongs to another seed id, domains.json was reordered:
      // stop instead of moving a course (and its buyers) onto the wrong domain.
      const atPosition = await prisma.competencyDomain.findUnique({
        where: { trackId_order: { trackId, order: domainData.order } },
        select: { seedKey: true },
      });
      if (atPosition?.seedKey && atPosition.seedKey !== domainData.id) {
        throw new Error(
          `Seed refused: ${trackId} order ${domainData.order} is domain "${atPosition.seedKey}" in the database ` +
            `but domains.json now has "${domainData.id}" there. Reordering would move course fields onto the wrong domain.`,
        );
      }
      const course = courses[domainData.id] ?? COURSE_DEFAULTS;

      const domain = await prisma.competencyDomain.upsert({
        where: {
          trackId_order: {
            trackId,
            order: domainData.order,
          },
        },
        update: {
          name: domainData.name,
          description: domainData.description,
          seedKey: domainData.id,
          ...course,
        },
        create: {
          trackId,
          name: domainData.name,
          description: domainData.description,
          order: domainData.order,
          seedKey: domainData.id,
          ...course,
        },
      });

      console.log(`  Domain: ${domain.name}`);

      const domainSlug = domainData.slug;
      if (!domainSlug) continue;

      try {
        const modules = loadJson<any[]>(
          `seed-data/domains/${trackId}/${domainSlug}/modules.json`,
        );

        for (const moduleData of modules) {
          const mod = await prisma.module.upsert({
            where: { id: moduleData.id },
            update: {
              title: moduleData.title,
              description: moduleData.description,
              tier: moduleData.tier,
              bloomLevel: moduleData.bloomLevel,
              order: moduleData.order,
              isPublished: true,
            },
            create: {
              id: moduleData.id,
              domainId: domain.id,
              title: moduleData.title,
              description: moduleData.description,
              tier: moduleData.tier,
              bloomLevel: moduleData.bloomLevel,
              order: moduleData.order,
              isPublished: true,
            },
          });

          console.log(`    Module: ${mod.title} (${mod.tier})`);
        }

        // Load lessons
        try {
          const lessons = loadJson<any[]>(
            `seed-data/domains/${trackId}/${domainSlug}/lessons.json`,
          );

          for (const lessonData of lessons) {
            await prisma.lesson.upsert({
              where: { id: lessonData.id },
              update: {
                title: lessonData.title,
                description: lessonData.description || '',
                learningObjectives: toJson(lessonData.learningObjectives),
                contentSections: toJson(lessonData.contentSections),
                duration: lessonData.duration,
                difficulty: lessonData.difficulty || 'medium',
                order: lessonData.order,
                isPublished: true,
                publishedAt: new Date(),
              },
              create: {
                id: lessonData.id,
                moduleId: lessonData.moduleId,
                title: lessonData.title,
                description: lessonData.description || '',
                learningObjectives: toJson(lessonData.learningObjectives),
                contentSections: toJson(lessonData.contentSections),
                duration: lessonData.duration,
                difficulty: lessonData.difficulty || 'medium',
                order: lessonData.order,
                isPublished: true,
                publishedAt: new Date(),
              },
            });
          }
          console.log(`    ${lessons.length} lessons loaded`);
        } catch {
          console.log(`    No lessons.json for ${domainSlug}`);
        }

        // Load exercises — resolve lessonId from module+order if available
        try {
          const exercises = loadJson<any[]>(
            `seed-data/domains/${trackId}/${domainSlug}/exercises.json`,
          );

          // Build a lookup: moduleId → array of lesson IDs (ordered by lesson.order)
          const lessonsByModule = new Map<string, string[]>();
          const allLessons = await prisma.lesson.findMany({
            where: { module: { domainId: domain.id } },
            select: { id: true, moduleId: true, order: true },
            orderBy: { order: 'asc' },
          });
          for (const l of allLessons) {
            if (!lessonsByModule.has(l.moduleId)) lessonsByModule.set(l.moduleId, []);
            lessonsByModule.get(l.moduleId)!.push(l.id);
          }

          // Build a lookup: moduleId → DB module id (for exercises that only have moduleId)
          const allModules = await prisma.module.findMany({
            where: { domainId: domain.id },
            select: { id: true },
          });
          const moduleIdSet = new Set(allModules.map((m) => m.id));

          for (let i = 0; i < exercises.length; i++) {
            const ex = exercises[i];

            // Resolve lessonId: prefer explicit lessonId, then derive from moduleId
            let resolvedLessonId: string | undefined = ex.lessonId ?? undefined;
            if (!resolvedLessonId && ex.moduleId && moduleIdSet.has(ex.moduleId)) {
              const lessonsInModule = lessonsByModule.get(ex.moduleId) ?? [];
              // Use lessonOrder if provided, otherwise fall back to first lesson in module
              const lessonIdx = ex.lessonOrder != null ? ex.lessonOrder - 1 : 0;
              resolvedLessonId = lessonsInModule[lessonIdx] ?? lessonsInModule[0];
            }

            if (!resolvedLessonId) {
              console.warn(`[seed] Exercise ref=${ex.ref} has no resolvable lessonId (moduleId=${ex.moduleId}). It will be seeded with lessonId=null and won't appear in lesson views.`);
            }

            await prisma.exercise.upsert({
              where: { ref: ex.ref },
              update: {
                prompt: ex.prompt,
                type: ex.type,
                config: toJson(ex.config),
                hints: toJsonArray(ex.hints),
                explanation: ex.explanation,
                difficulty: difficultyLabel(ex.difficulty),
                bloomLevel: ex.bloomLevel,
                domainId: domain.id,
                lessonId: resolvedLessonId ?? null,
                timeEstimate: (ex.timeEstimate || 2) * 60,
                xpReward: ex.xpReward || 10,
                isKnowledgeCheck: ex.isKnowledgeCheck || false,
                tags: toJsonArray(ex.tags),
              },
              create: {
                ref: ex.ref,
                prompt: ex.prompt,
                type: ex.type,
                config: toJson(ex.config),
                hints: toJsonArray(ex.hints),
                explanation: ex.explanation,
                difficulty: difficultyLabel(ex.difficulty),
                bloomLevel: ex.bloomLevel,
                domainId: domain.id,
                lessonId: resolvedLessonId ?? null,
                timeEstimate: (ex.timeEstimate || 2) * 60,
                xpReward: ex.xpReward || 10,
                isKnowledgeCheck: ex.isKnowledgeCheck || false,
                order: i + 1,
                tags: toJsonArray(ex.tags),
              },
            });
          }
          console.log(`    ${exercises.length} exercises loaded`);
        } catch {
          console.log(`    No exercises.json for ${domainSlug}`);
        }
      } catch {
        console.log(`    No detailed data for ${domainSlug}`);
      }
    }
  }

  // ─── 3. Create Track Exams ────────────────────────────────────────────
  const tracks = loadJson<any[]>('seed-data/tracks.json');

  console.log(`\nSeeding track exams...`);
  for (const track of tracks) {
    // Guard against the exact bug found by the 2026-08-04 learning-design
    // audit: examQuestionCount configured higher than the track's real
    // MULTIPLE_CHOICE pool made 4 of 8 credential exams mathematically
    // impossible to pass even at 100% correct (exams.ts's scoring divides
    // by the served count now, not the configured target — but a
    // misconfigured seed can still silently promise more questions than
    // exist). Warn loudly rather than let this drift back in unnoticed.
    // Exercise has no real Prisma relation to CompetencyDomain (only a bare
    // domainId scalar) — resolve trackId -> domain IDs first, same fix
    // applied to the identical bug found in exams.ts.
    const trackDomains = await prisma.competencyDomain.findMany({
      where: { trackId: track.id },
      select: { id: true },
    });
    const mcPoolSize = await prisma.exercise.count({
      where: { isActive: true, type: 'MULTIPLE_CHOICE', domainId: { in: trackDomains.map((d) => d.id) } },
    });
    if (mcPoolSize < track.examQuestionCount) {
      console.warn(`  ⚠️  ${track.title}: examQuestionCount=${track.examQuestionCount} but only ${mcPoolSize} MULTIPLE_CHOICE exercises exist for this track — exam will serve fewer questions than configured.`);
    } else if (mcPoolSize < track.examQuestionCount * 1.5) {
      console.warn(`  ⚠️  ${track.title}: MC pool (${mcPoolSize}) is less than 1.5x examQuestionCount (${track.examQuestionCount}) — exam has little room to vary between attempts.`);
    }

    await prisma.trackExam.upsert({
      where: { trackId: track.id },
      update: {
        title: `${track.title} Certification Exam`,
        timeLimit: track.examTimeLimit,
        passScore: track.examPassScore,
        questionCount: track.examQuestionCount,
      },
      create: {
        trackId: track.id,
        title: `${track.title} Certification Exam`,
        description: `Final certification exam for the ${track.title} track. Timed, ${track.examQuestionCount} questions, ${track.examPassScore}% to pass.`,
        timeLimit: track.examTimeLimit,
        passScore: track.examPassScore,
        questionCount: track.examQuestionCount,
      },
    });
    console.log(`  ${track.title} exam (${track.examQuestionCount}q, ${track.examTimeLimit}min)`);
  }

  // ─── Summary ──────────────────────────────────────────────────────────
  const counts = {
    domains: await prisma.competencyDomain.count(),
    modules: await prisma.module.count(),
    lessons: await prisma.lesson.count(),
    exercises: await prisma.exercise.count(),
    badges: await prisma.badge.count(),
    exams: await prisma.trackExam.count(),
  };

  console.log(`\nSeed complete!`);
  console.log(`  ${counts.domains} domains`);
  console.log(`  ${counts.modules} modules`);
  console.log(`  ${counts.lessons} lessons`);
  console.log(`  ${counts.exercises} exercises`);
  console.log(`  ${counts.badges} badges`);
  console.log(`  ${counts.exams} track exams`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
