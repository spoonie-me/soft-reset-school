// Display names for the sellable career tracks, shared by the purchase,
// reminder and certificate emails.
export const TRACK_NAMES: Record<string, string> = {
  fundamentals: '🛏️ Code from Bed',
  ai: '🤖 AI Literacy for Humans',
  tools: '⚡ Build Cool Tools Fast',
  advanced: '🚀 AI Agents that Work',
  'ai-orchestrated-dev': '🧭 AI-Assisted Software Development',
  'ai-workflow-consulting': '⚙️ AI Automation Consulting',
  'ai-oversight-health-informatics': '🩺 AI-Augmented Medical Coding',
  'accessibility-qa-lived-experience': '♿ Digital Accessibility QA',
};

/** The name without its leading emoji, for subject lines and sentences. */
export function plainTrackName(trackId: string): string {
  return (TRACK_NAMES[trackId] ?? trackId).replace(/^[^\p{L}\p{N}]+/u, '');
}
