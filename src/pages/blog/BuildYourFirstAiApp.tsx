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

export function BuildYourFirstAiApp() {
  return (
    <BlogLayout
      tag="Tutorial"
      tagColor="var(--rust)"
      date="2026-03-22"
      dateModified="2026-05-08"
      keywords="Claude API tutorial, build AI app, first AI project, beginner AI app, Anthropic API, AI app tutorial, from-scratch AI app"
      readTime="7 min read"
      title="Build Your First AI App with Claude API: A Practical Guide"
      description="You don't need a PhD to build something useful with AI. Here's how to go from zero to a working app using Claude API — in an afternoon, from your couch."
      category="Tutorial"
      slug="build-your-first-ai-app"
    >
      <h1 style={{ fontSize: '2rem', lineHeight: 1.2, marginBottom: 'var(--space-xl)' }}>
        Build Your First AI App<br />
        <span style={{ color: 'var(--rust)' }}>with Claude API</span>
      </h1>

      <p style={p}>
        The Claude API is one of the most beginner-friendly AI APIs available. You don't need to understand transformers, fine-tuning, or embeddings to build something genuinely useful. You need three things: a Node.js environment, an API key, and a problem worth solving.
      </p>

      <p style={p}>
        This guide builds a real, working tool — a text summariser that takes a long article and returns a structured summary with key points. Simple enough to understand in one sitting. Useful enough to actually deploy.
      </p>

      <h2 style={h2}>Step 1: Get your API key</h2>

      <p style={p}>
        Sign up at console.anthropic.com. You'll get free credits to start. Create an API key and save it — you'll need it in the next step.
      </p>

      <h2 style={h2}>Step 2: Install the SDK</h2>

      <pre style={codeBlock}>{`npm install @anthropic-ai/sdk`}</pre>

      <h2 style={h2}>Step 3: Write your first call</h2>

      <pre style={codeBlock}>{`import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function summarise(text: string) {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: \`Summarise this article in 3 bullet points and one sentence conclusion:\\n\\n\${text}\`
      }
    ]
  });

  return response.content[0].text;
}

const summary = await summarise(yourArticleText);
console.log(summary);`}</pre>

      <h3 style={h3}>Why Haiku and not Opus?</h3>

      <p style={p}>
        For simple summarisation, Claude Haiku is 10× cheaper than Opus and nearly as good. Model selection is a core AI literacy skill — match the model to the complexity of the task.
      </p>

      <h2 style={h2}>Step 4: Add a system prompt</h2>

      <p style={p}>
        The system prompt defines how the model behaves. Adding one makes your outputs dramatically more consistent:
      </p>

      <pre style={codeBlock}>{`messages: [
  {
    role: 'user',
    content: text,
    system: 'You are a concise summariser. Always return: a title, 3 bullet points, and a one-sentence conclusion. No other text.'
  }
]`}</pre>

      <h2 style={h2}>Step 5: Deploy it</h2>

      <p style={p}>
        Wrap this in a simple Express route, deploy to Vercel, and you have a working API endpoint that summarises text. Total time: an afternoon. Total cost to run: fractions of a cent per request.
      </p>

      <p style={p}>
        The <strong style={{ color: 'var(--text-primary)' }}>AI-Assisted Software Development</strong> track at Soft Reset School takes this further — directing AI to build and ship real software, and reviewing what it gives back. All from the same pattern you just learned.
      </p>
    </BlogLayout>
  );
}
