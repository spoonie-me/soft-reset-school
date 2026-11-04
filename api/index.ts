// @ts-nocheck
// Vercel serverless function — wraps Express backend
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Disable Vercel's built-in body parser so the raw stream reaches Express.
// express.raw() (for the webhook) and express.json() (for all other routes)
// handle body parsing themselves. Without this, Vercel consumes the stream
// before Express sees it, breaking Stripe webhook signature verification.
export const config = {
  api: {
    bodyParser: false,
  },
};

let app: any;
let initError: any;

try {
  const mod = await import('../backend/src/server.js');
  app = mod.default;
  // Behind Vercel there is exactly one proxy hop, and it sets X-Forwarded-For
  // to the real client IP. Without this, req.ip is the proxy's address for
  // every visitor, so the rate limiters count the whole site as one user:
  // 100 requests / 15 min and 10 login attempts / 15 min for everyone combined.
  app.set('trust proxy', 1);
} catch (err) {
  initError = err;
  console.error('Failed to initialize Express app:', err);
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (initError) {
    console.error('Server init error details:', initError);
    return res.status(500).json({
      error: 'Server initialization failed. Check logs.',
    });
  }
  return app(req, res);
}
