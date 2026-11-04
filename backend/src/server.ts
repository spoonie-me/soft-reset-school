import 'dotenv/config';

// Vercel's `vercel env pull` writes values with a literal `\n` suffix when the
// stored value ended with whitespace. That trailing `\n` survives into
// process.env at runtime and breaks any header/secret/URL comparison.
// Spooniversity hit this on Stripe (commit 129d8395). Scrubbing once at
// startup is cheaper than wrapping every read site in `.trim()`.
for (const k of Object.keys(process.env)) {
  const v = process.env[k];
  if (typeof v === 'string') process.env[k] = v.replace(/\\n$/, '').trim();
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { apiLimiter } from './middleware/rateLimit.js';
import { gdprLogger } from './middleware/gdpr.js';
import authRoutes from './routes/auth.js';
import lessonRoutes from './routes/lessons.js';
import progressRoutes from './routes/progress.js';
import feedbackRoutes from './routes/feedback.js';
import complianceRoutes from './routes/compliance.js';
import webhookRoutes from './routes/webhooks.js';
import trackRoutes from './routes/tracks.js';
import domainRoutes from './routes/domains.js';
import moduleRoutes from './routes/modules.js';
import exerciseRoutes from './routes/exercises.js';
import assessmentRoutes from './routes/assessments.js';
import examRoutes from './routes/exams.js';
import certificateRoutes from './routes/certificates.js';
import gamificationRoutes from './routes/gamification.js';
import checkoutRoutes from './routes/checkout.js';
import storyRoutes from './routes/story.js';
import inquiryRoutes from './routes/inquiries.js';
import subscribeRoutes from './routes/subscribe.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Security
app.use(helmet({
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'https:', 'data:'],
      connectSrc: ["'self'", 'https://api.stripe.com'],
      frameSrc: ["'self'", 'https://js.stripe.com'],
    },
  },
}));
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'https://softreset.school')
  .split(',')
  .map((o) => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    // Allow any localhost origin for local development
    if (origin.startsWith('http://localhost:')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// Stripe webhooks need raw body — mount before JSON parser
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Cookie parsing — auth middleware reads `req.cookies.bc_token` as the
// preferred (XSS-resistant) source for the JWT.
app.use(cookieParser());

// Rate limiting
app.use('/api/', apiLimiter);

// GDPR audit logging
app.use(gdprLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/story', storyRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/subscribe', subscribeRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler — sanitize stack traces in production
app.use((err: any, _req: any, res: any, _next: any) => {
  // Body-parser JSON syntax errors
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: 'Internal server error' });
});

// Only listen when running standalone (not in Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Soft Reset School API running on port ${PORT}`);
  });
}

export default app;
