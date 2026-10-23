import { Link } from 'react-router-dom';
import { BlogLayout } from './_BlogLayout';

const h2: React.CSSProperties = { fontSize: '1.375rem', marginTop: 'var(--space-3xl)', marginBottom: 'var(--space-lg)' };
const h3: React.CSSProperties = { fontSize: '1.125rem', marginTop: 'var(--space-2xl)', marginBottom: 'var(--space-md)' };
const p: React.CSSProperties = { color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 'var(--space-lg)' };

export function WhatIsAiLiteracy() {
  return (
    <BlogLayout
      tag="AI Literacy"
      tagColor="var(--signal)"
      date="2026-03-12"
      dateModified="2026-05-08"
      keywords="AI literacy, prompt engineering basics, LLM limitations, hallucinations, AI for developers, when to use AI, AI literacy course"
      readTime="6 min read"
      title="What Is AI Literacy? Why Every Coder Needs It in 2026"
      description="AI literacy isn't about knowing the math behind transformers. It's about knowing when to trust the model, how to write prompts that actually work, and where AI falls flat."
      category="AI Literacy"
      slug="what-is-ai-literacy"
    >
      <h1 style={{ fontSize: '2rem', lineHeight: 1.2, marginBottom: 'var(--space-xl)' }}>
        What Is AI Literacy?<br />
        <span style={{ color: 'var(--signal)' }}>Why Every Coder Needs It in 2026</span>
      </h1>

      <p style={p}>
        AI literacy is one of the most misunderstood phrases in tech right now. It gets used to mean everything from "knowing how to use ChatGPT" to "having a PhD in machine learning." Neither of those is quite right.
      </p>

      <p style={p}>
        Real AI literacy means understanding enough about how language models work — their strengths, their failure modes, their limits — that you can use them reliably. Not perfectly. Reliably.
      </p>

      <h2 style={h2}>What AI literacy actually means</h2>

      <p style={p}>
        Here's a working definition: AI literacy is the ability to use AI tools to get real work done, understand why they sometimes fail, and make informed decisions about when to trust the output.
      </p>

      <p style={p}>That breaks down into three things:</p>

      <ul style={{ color: 'var(--text-secondary)', paddingLeft: 'var(--space-xl)', lineHeight: 1.8, marginBottom: 'var(--space-lg)' }}>
        <li style={{ marginBottom: '0.75rem' }}><strong style={{ color: 'var(--text-primary)' }}>Operational</strong> — you can prompt effectively, parse outputs critically, and iterate when something doesn't work</li>
        <li style={{ marginBottom: '0.75rem' }}><strong style={{ color: 'var(--text-primary)' }}>Conceptual</strong> — you understand tokens, temperature, context windows, hallucination, and training cutoffs</li>
        <li style={{ marginBottom: '0.75rem' }}><strong style={{ color: 'var(--text-primary)' }}>Critical</strong> — you know when to trust the output, when to verify, and when to not use AI at all</li>
      </ul>

      <h2 style={h2}>Why it matters for coders specifically</h2>

      <p style={p}>
        If you're building anything with AI — even just using Claude to help write code — AI literacy is the difference between shipping reliable tools and shipping ones that embarrass you at demo time.
      </p>

      <p style={p}>
        A model that doesn't know something will often confidently make something up. If you can't recognise that pattern, you'll ship hallucinations as features.
      </p>

      <h3 style={h3}>Hallucinations, confidence, and the trust problem</h3>

      <p style={p}>
        Language models don't "know" things the way you or I know things. They predict the next plausible token given the context. That means they can produce text that sounds completely authoritative about something that's just… wrong.
      </p>

      <p style={p}>
        AI literacy means you know this, you account for it in your prompts, and you verify outputs that matter. You don't need to understand the full training stack to use models effectively — but you do need to understand this failure mode.
      </p>

      <h2 style={h2}>What AI literacy is not</h2>

      <p style={p}>
        It's not knowing linear algebra. You don't need to understand backpropagation to use Claude effectively. The mathematical foundations are interesting — but they're not what determines whether you can build reliable AI-powered tools.
      </p>

      <p style={p}>
        It's also not just using AI a lot. Many people have been using LLMs daily for two years and still have no mental model of why they fail. Volume of use doesn't build literacy. Deliberate understanding does.
      </p>

      <h2 style={h2}>How to build AI literacy</h2>

      <p style={p}>
        Start with the conceptual foundations: what is a token, what is a context window, why does temperature matter, what causes hallucination. These take a few hours to understand — not weeks.
      </p>

      <p style={p}>
        Then move to applied prompt engineering: system prompts, chain-of-thought, few-shot examples, failure analysis. Build things that break, then fix them. That's how the mental model solidifies.
      </p>

      <p style={p}>
        The <Link to="/tracks/ai-orchestrated-dev" style={{ color: 'var(--signal)', textDecoration: 'none' }}>AI-Assisted Software Development track</Link> puts all of this to work in short, resumable lessons designed for people who learn from bed, not from lecture halls.
      </p>
    </BlogLayout>
  );
}
