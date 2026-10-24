import { describe, it, expect } from 'vitest';
import { stripMarkdownForSpeech, lessonSpeechChunks } from '../speech';

describe('stripMarkdownForSpeech', () => {
  it('drops formatting marks but keeps the words', () => {
    expect(stripMarkdownForSpeech('**Try it** before you *read* on. See [the docs](https://x.test).')).toBe(
      'Try it before you read on. See the docs.',
    );
  });

  it('never reads code blocks aloud', () => {
    const out = stripMarkdownForSpeech('Look at this:\n\n```html\n<input type="checkbox">\n```\n\nThen listen.');
    expect(out).not.toContain('<input');
    expect(out).toContain('code example');
    expect(out).toContain('Then listen.');
  });

  it('keeps inline code words, without the backticks', () => {
    expect(stripMarkdownForSpeech('Press `Tab` to move.')).toBe('Press Tab to move.');
  });

  it('turns list markers and headings into plain sentences', () => {
    const out = stripMarkdownForSpeech('## Steps\n- first\n- second');
    expect(out).toBe('Steps. first. second');
  });
});

describe('lessonSpeechChunks', () => {
  const lesson = {
    title: 'Beyond the Green Light',
    learningObjectives: ['Explain why WCAG alone is not enough'],
    contentSections: [
      { type: 'pod-header', title: 'Pod' },
      { type: 'hook', body: 'You are reviewing a PR.' },
      { type: 'exercise' },
      { type: 'spot-flaw' },
      { type: 'text', body: 'Automated tools miss things.' },
      { type: 'takeaway', body: 'Listen for yourself.' },
    ],
  };

  it('reads title, objectives, then text sections in order', () => {
    const texts = lessonSpeechChunks(lesson).map((c) => c.text);
    expect(texts[0]).toBe('Beyond the Green Light');
    expect(texts[1]).toBe('Learning objectives. Explain why WCAG alone is not enough');
    expect(texts[2]).toBe('You are reviewing a PR.');
    expect(texts[texts.length - 1]).toBe('Listen for yourself.');
  });

  it('skips interactive sections but cues the listener once per run of them', () => {
    const cues = lessonSpeechChunks(lesson).filter((c) => c.text.startsWith('There is an interactive'));
    expect(cues).toHaveLength(1);
  });

  it('keeps the section index so the page can follow along', () => {
    const hook = lessonSpeechChunks(lesson).find((c) => c.text === 'You are reviewing a PR.');
    expect(hook?.sectionIdx).toBe(1);
  });
});
