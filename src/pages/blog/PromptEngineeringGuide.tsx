import { BlogLayout } from './_BlogLayout';

const h2: React.CSSProperties = { fontSize: '1.375rem', marginTop: 'var(--space-3xl)', marginBottom: 'var(--space-lg)' };
const h3: React.CSSProperties = { fontSize: '1.125rem', marginTop: 'var(--space-2xl)', marginBottom: 'var(--space-md)' };
const p: React.CSSProperties = { color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 'var(--space-lg)' };

const codeBlock: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--bg-border)',
  borderRadius: 8,
  padding: 'var(--space-lg)',
  fontFamily: 'var(--font-code)',
  fontSize: '0.875rem',
  overflowX: 'auto',
  marginBottom: 'var(--space-lg)',
  lineHeight: 1.6,
};

export function PromptEngineeringGuide() {
  return (
    <BlogLayout
      tag="Prompt Engineering"
      tagColor="var(--crystal)"
      date="2026-02-28"
      dateModified="2026-05-08"
      keywords="prompt engineering guide, chain of thought prompting, few-shot prompting, system prompts, Claude prompts, LLM prompting techniques, reliable AI prompts"
      readTime="8 min read"
      title="Prompt Engineering in 2026: The Honest, No-Hype Guide"
      description="Chain-of-thought, few-shot, system prompts — we cut through the buzzwords and show you what actually works for building reliable AI-powered tools."
      category="Prompt Engineering"
      slug="prompt-engineering-guide"
    >
      <h1 style={{ fontSize: '2rem', lineHeight: 1.2, marginBottom: 'var(--space-xl)' }}>
        Prompt Engineering in 2026:<br />
        <span style={{ color: 'var(--crystal)' }}>The Honest, No-Hype Guide</span>
      </h1>

      <p style={p}>
        Prompt engineering gets more mystical coverage than it deserves. It's not magic. It's not a career in itself. It's a skill — like writing clear documentation — that you can get good at in a weekend and keep improving over time.
      </p>

      <p style={p}>
        This guide skips the buzzword soup and tells you what actually works when you're building real tools with Claude.
      </p>

      <h2 style={h2}>The anatomy of a good prompt</h2>

      <p style={p}>
        Every effective prompt has four components. You don't need all four every time, but knowing them helps you diagnose why a prompt isn't working:
      </p>

      <ul style={{ color: 'var(--text-secondary)', paddingLeft: 'var(--space-xl)', lineHeight: 1.8, marginBottom: 'var(--space-lg)' }}>
        <li style={{ marginBottom: '0.75rem' }}><strong style={{ color: 'var(--text-primary)' }}>Role</strong> — who is the model being? ("You are a concise summariser")</li>
        <li style={{ marginBottom: '0.75rem' }}><strong style={{ color: 'var(--text-primary)' }}>Task</strong> — what exactly should it do? Be specific.</li>
        <li style={{ marginBottom: '0.75rem' }}><strong style={{ color: 'var(--text-primary)' }}>Context</strong> — what does it need to know to do the task well?</li>
        <li style={{ marginBottom: '0.75rem' }}><strong style={{ color: 'var(--text-primary)' }}>Output format</strong> — exactly how should the response be structured?</li>
      </ul>

      <h3 style={h3}>Vague vs. specific</h3>

      <pre style={codeBlock}>{`// Vague
"Summarise this article."

// Specific
"Summarise this article in exactly 3 bullet points.
Each bullet point should be one sentence.
End with a one-sentence conclusion.
Do not include any other text."`}</pre>

      <p style={p}>
        The specific version gets consistent output. The vague one gets whatever the model decides is a summary today.
      </p>

      <h2 style={h2}>Chain of thought — when to use it</h2>

      <p style={p}>
        "Think step by step" genuinely works. For reasoning-heavy tasks, asking the model to show its work before giving the final answer improves accuracy. The mechanism: you're giving the model token budget to reason through the problem, not just pattern-match to an answer.
      </p>

      <p style={p}>
        Use it for: classification tasks, multi-step reasoning, code debugging, decision-making prompts.
      </p>

      <p style={p}>
        Don't use it for: simple retrieval, format transformation, summarisation. It's slower and costs more tokens for no benefit.
      </p>

      <h2 style={h2}>Few-shot prompting</h2>

      <p style={p}>
        Show the model examples of what you want before asking for the real thing. This is one of the highest-leverage techniques in prompt engineering:
      </p>

      <pre style={codeBlock}>{`// Few-shot example
"Classify the sentiment of these messages:

Message: 'This is amazing!'
Sentiment: positive

Message: 'I can't believe how bad this is'
Sentiment: negative

Message: 'It works fine I guess'
Sentiment: neutral

Now classify:
Message: 'I love this product!'
Sentiment:"`}</pre>

      <p style={p}>
        The examples teach the model your specific definition of the categories, not a generic one.
      </p>

      <h2 style={h2}>System prompts for production tools</h2>

      <p style={p}>
        When you're building an AI-powered product, the system prompt is your most important reliability lever. A good system prompt defines: the model's role, its constraints, its output format, and what to do when the user asks for something out of scope.
      </p>

      <p style={p}>
        Bad system prompts are vague ("be helpful"). Good system prompts are specific ("Only answer questions about X. When asked about Y, respond with exactly: 'I can only help with X.'").
      </p>

      <h2 style={h2}>What doesn't work</h2>

      <p style={p}>
        Prompts that are long for the sake of being long. Telling the model what not to do without telling it what to do instead. Being passive ("it would be great if you could...") instead of direct. Assuming the model knows things that aren't in the context.
      </p>

      <p style={p}>
        The AI-Assisted Software Development track at Soft Reset School covers prompt debugging — including a systematic framework for figuring out exactly why a prompt isn't working.
      </p>
    </BlogLayout>
  );
}
