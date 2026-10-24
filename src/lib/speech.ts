/* ─── Text-to-speech helpers ───
 * Used by the lesson "Listen" bar and the simulated screen reader.
 *
 * This is the browser's own speech engine (speechSynthesis): free, offline
 * once voices are installed, no audio files to host. Voice quality varies by
 * device. It is a prototype for finding out whether learners use audio at all;
 * if they do, swap the source for pre-generated narration and keep this
 * module's chunking.
 */

export interface SpeechChunk {
  /** Index of the lesson content section this text came from, or -1 for the
   * title and learning objectives that sit above the sections. */
  sectionIdx: number;
  text: string;
}

/** Markdown to something a voice can read. Code is never read aloud. */
export function stripMarkdownForSpeech(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' (code example, see the screen) ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[<>]/g, '') // nothing like "<scr<script>ipt>" can survive the pass above
    .replace(/\s*\n\s*/g, '. ')
    .replace(/\.\s*\.+/g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

interface SpeakableSection {
  type: string;
  body?: string;
  title?: string;
}

const TEXT_TYPES = new Set(['hook', 'text', 'callout', 'takeaway']);

/** Chunks for one lesson, in reading order. Interactive sections are not read;
 * a short cue tells an audio-only listener there is something to do on screen. */
export function lessonSpeechChunks(lesson: {
  title: string;
  learningObjectives: string[];
  contentSections: SpeakableSection[];
}): SpeechChunk[] {
  const chunks: SpeechChunk[] = [];
  chunks.push({ sectionIdx: -1, text: lesson.title });
  if (lesson.learningObjectives.length > 0) {
    chunks.push({
      sectionIdx: -1,
      text: `Learning objectives. ${lesson.learningObjectives.map(stripMarkdownForSpeech).join('. ')}`,
    });
  }
  let lastWasCue = false;
  lesson.contentSections.forEach((section, idx) => {
    if (TEXT_TYPES.has(section.type) && section.body) {
      const text = stripMarkdownForSpeech(section.body);
      if (text) chunks.push({ sectionIdx: idx, text });
      lastWasCue = false;
    } else if (section.type !== 'pod-header' && !lastWasCue) {
      chunks.push({ sectionIdx: idx, text: 'There is an interactive activity here. Continue on screen.' });
      lastWasCue = true;
    }
  });
  return chunks;
}

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}
