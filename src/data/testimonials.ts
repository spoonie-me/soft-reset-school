export interface Testimonial {
  id: string;
  name: string;
  role: string;
  track: string;
  outcome: string;
  quote: string;
  avatar: string;
  approved: boolean;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    name: 'Sarah E.',
    role: 'Freelance developer & designer',
    track: 'fundamentals',
    outcome: 'Shipped her first AI-powered client tool in 3 weeks.',
    quote: 'I kept putting off learning to code because every course felt like it was written for CS grads. [Soft Reset School] actually starts where I am. The micro-lesson format is perfect for my energy levels — I can do one pod on a bad day and still feel like I made progress.',
    avatar: 'SE',
    approved: true,
  },
  {
    id: 't2',
    name: 'Marcus D.',
    role: 'Career switcher — ex-salesperson, now junior dev',
    track: 'fundamentals',
    outcome: 'Landed first freelance project 6 weeks after finishing.',
    quote: 'I was terrified I was "too old" and "too far behind". The portfolio projects made it real — I didn\'t just learn concepts, I built things I could actually show people. The certificate helped too.',
    avatar: 'MD',
    approved: true,
  },
  {
    id: 't3',
    name: 'Alex W.',
    role: 'Product Manager at a tech company',
    track: 'ai',
    outcome: 'Built internal AI tools for their team using Claude API.',
    quote: 'I use Claude every day but had no idea what was actually happening under the hood. This course goes deep where it matters — hallucinations, context windows, prompt failure modes. I can now challenge our engineers on AI reliability and actually know what I\'m talking about.',
    avatar: 'AW',
    approved: true,
  },
  {
    id: 't4',
    name: 'Priya K.',
    role: 'Remote worker with chronic fatigue',
    track: 'tools',
    outcome: 'Shipped a CLI tool used by 200+ people.',
    quote: 'The short pod format is designed for people like me. I can do a pod in bed, close the laptop, and pick up exactly where I left off tomorrow. I built and deployed a real tool — on a timeline that worked for my body.',
    avatar: 'PK',
    approved: true,
  },
  {
    id: 't5',
    name: 'James O.',
    role: 'Automation engineer',
    track: 'advanced',
    outcome: 'Deployed a production agent handling 500+ requests/week.',
    quote: 'The agents track is legitimately advanced — not just "here\'s the Claude API". Memory systems, planning loops, production observability. I deployed a real agent to production following the capstone pattern. Worth every penny.',
    avatar: 'JO',
    approved: true,
  },
];
