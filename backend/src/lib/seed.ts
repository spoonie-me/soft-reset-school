import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Starting database seed...\n');

    // Create admin user (Roi)
    const adminUser = await prisma.user.upsert({
      where: { email: 'roi@bedcoders.com' },
      update: {},
      create: {
        id: 'admin-user-001',
        email: 'roi@bedcoders.com',
        name: 'Roi Shternin',
        passwordHash: '$2a$10$demo', // Demo hash
        emailVerified: true,
      },
    });
    console.log('✅ Created admin user');

    // Create user profile
    await prisma.userProfile.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: {
        userId: adminUser.id,
        displayName: 'Roi Shternin',
        bio: 'Building Soft Reset School: free lessons in AI-era work skills for people returning to work. Author, speaker, constraint-based thinker.',
        avatar: 'https://bedcoders.com/roi-avatar.jpg',
        country: 'United States',
      },
    });
    console.log('✅ Created user profile');

    // Create Gamification entry
    await prisma.gamification.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: {
        userId: adminUser.id,
        totalXp: 1000,
        level: 15,
        currentStreak: 7,
        bestStreak: 30,
      },
    });
    console.log('✅ Created gamification record');

    // Create 12 SEO-optimized blog posts
    const blogPosts = [
      {
        slug: 'coding-with-chronic-illness',
        title: 'Coding with Chronic Illness: Building When Your Body Says No',
        excerpt: 'How developers with POTS, ME/CFS, and other chronic illnesses are shipping real projects. Constraints breed innovation.',
        metaTitle: 'Coding with Chronic Illness | Soft Reset School',
        metaDescription: 'Learn how developers with chronic illness ship real projects. Building constraints-first, not productivity-obsessed.',
        keywords: 'chronic illness, disability, accessible coding, POTS, ME/CFS, remote work',
      },
      {
        slug: 'claude-api-for-beginners',
        title: 'Using the Claude API for Beginners: Your First AI-Powered App',
        excerpt: 'Step-by-step guide to building your first app with Claude API. No AI background required.',
        metaTitle: 'Claude API for Beginners | Step-by-Step Guide',
        metaDescription: 'Learn to build AI-powered apps with Claude API. First-time friendly guide with working code examples.',
        keywords: 'Claude API, Anthropic, AI, beginner tutorial, JavaScript',
      },
      {
        slug: 'rest-api-design-from-scratch',
        title: 'REST API Design from Scratch: The 30-Minute Guide',
        excerpt: 'Build your first REST API with Express and PostgreSQL. No prior API experience needed.',
        metaTitle: 'REST API Design Guide | Express + PostgreSQL',
        metaDescription: 'Build a REST API from scratch in 30 minutes. Includes working code examples and best practices.',
        keywords: 'REST API, Express.js, API design, backend, Node.js',
      },
      {
        slug: 'prompt-engineering-101',
        title: 'Prompt Engineering 101: Get Better Answers from Claude',
        excerpt: 'Master the art of asking Claude the right questions. Simple patterns that work.',
        metaTitle: 'Prompt Engineering 101 | Write Better Claude Prompts',
        metaDescription: 'Learn prompt engineering techniques to get better answers from Claude. Framework + real examples.',
        keywords: 'prompt engineering, Claude, AI, LLM, prompts, best practices',
      },
      {
        slug: 'javascript-async-await-explained',
        title: 'Async/Await Explained: Write Non-Blocking JavaScript',
        excerpt: 'Stop worrying about callbacks and promises. Master async/await in 10 minutes.',
        metaTitle: 'Async/Await Explained | JavaScript Guide',
        metaDescription: 'Master JavaScript async/await. Non-blocking code patterns with real examples.',
        keywords: 'async await, JavaScript, asynchronous, promises, fetch',
      },
      {
        slug: 'git-workflow-for-teams',
        title: 'Git Workflow for Teams: Branching and Merging Without Chaos',
        excerpt: 'Git becomes simple when you follow a clear workflow. Here is the pattern that scales.',
        metaTitle: 'Git Workflow for Teams | Branching Best Practices',
        metaDescription: 'Master git branching workflow for team collaboration. Prevent merge conflicts and chaos.',
        keywords: 'git, GitHub, branching, workflow, team collaboration, version control',
      },
      {
        slug: 'deploy-to-vercel-in-5-minutes',
        title: 'Deploy Your First App to Vercel: 5-Minute Guide',
        excerpt: 'Ship your code to the internet with zero configuration. Here is how.',
        metaTitle: 'Deploy to Vercel | Fastest Way to Ship',
        metaDescription: 'Deploy any app to Vercel in 5 minutes. Free tier included. No DevOps knowledge needed.',
        keywords: 'Vercel, deployment, hosting, GitHub, serverless',
      },
      {
        slug: 'testing-javascript-code',
        title: 'Testing JavaScript Code: Why and How to Start',
        excerpt: 'Write tests to catch bugs before users do. Jest and Vitest tutorial.',
        metaTitle: 'Testing JavaScript Code | Jest Tutorial',
        metaDescription: 'Learn unit testing with Jest. Why, when, and how to test JavaScript.',
        keywords: 'testing, Jest, unit tests, JavaScript, TDD, QA',
      },
      {
        slug: 'build-a-todo-app-tutorial',
        title: 'Build Your First Todo App: React Tutorial',
        excerpt: 'Step-by-step guide to building a working todo app in React. No prior experience needed.',
        metaTitle: 'Build a Todo App in React | Tutorial',
        metaDescription: 'Step-by-step React tutorial. Build a working todo app from scratch.',
        keywords: 'React, tutorial, beginner, JavaScript, todo app, useState',
      },
      {
        slug: 'understanding-the-dom',
        title: 'Understanding the DOM: How Browsers Work',
        excerpt: 'The DOM is how JavaScript talks to HTML. Master this and JavaScript clicks.',
        metaTitle: 'Understanding the DOM | Web Development Basics',
        metaDescription: 'Learn how the DOM works. How JavaScript interacts with HTML and CSS.',
        keywords: 'DOM, JavaScript, HTML, web development, querySelector, addEventListener',
      },
      {
        slug: 'accessible-tech-design',
        title: 'Accessible Tech Design: Building for Disabled Developers',
        excerpt: 'Why accessibility matters for developers and how to build inclusive tools.',
        metaTitle: 'Accessible Tech Design | Disability-First Development',
        metaDescription: 'Build accessible software for disabled developers. Techniques and philosophy.',
        keywords: 'accessibility, disability, inclusive design, WCAG, a11y, disabled developers',
      },
      {
        slug: 'why-bedcoders-exists',
        title: 'Why Soft Reset School Exists: Rethinking Developer Education',
        excerpt: 'A platform designed for developers who have to work differently. Energy-aware learning.',
        metaTitle: 'Why Soft Reset School Exists | Inclusive Developer Education',
        metaDescription: 'The story behind Soft Reset School. Building a learning platform for developers with chronic illness.',
        keywords: 'education, learning platform, developer, chronic illness, disability, inclusive',
      },
    ];

    for (const post of blogPosts) {
      await prisma.blogPost.upsert({
        where: { slug: post.slug },
        update: {},
        create: {
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          content: `# ${post.title}\n\n${post.excerpt}\n\nThis is a placeholder for detailed content.`,
          authorEmail: 'roi@bedcoders.com',
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
          keywords: post.keywords,
          status: 'published',
          publishedAt: new Date(),
          viewCount: Math.floor(Math.random() * 500),
        },
      });
    }
    console.log(`✅ Created ${blogPosts.length} blog posts`);

    console.log('\n✨ Database seeding complete!');
    console.log(`   - 1 admin user (roi@bedcoders.com)`);
    console.log(`   - 1 user profile with gamification`);
    console.log(`   - ${blogPosts.length} SEO-optimized blog posts (published)`);
    console.log('\n📊 All posts are published and indexed for SEO');
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
