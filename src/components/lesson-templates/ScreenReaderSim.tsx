/* ─── Simulated screen reader ───
 * Lets a learner who has no screen reader running tab through a short form and
 * read what one would announce. It is a stand-in, never a replacement: the
 * lesson still sends people to a real one. The announcements are authored per
 * control in the lesson data, so what is "heard" is exactly what the lesson
 * teaches.
 *
 * Built to be accessible itself, in an accessibility course:
 *  - Tab and Shift+Tab are ordinary buttons. Nothing traps or hijacks the
 *    keyboard, and the page's real Tab order is untouched.
 *  - Every control is 48px or larger.
 *  - The output panel is a polite live region, so a real screen reader user
 *    gets the same text.
 *  - Named versus unnamed is stated in words, never by colour alone.
 *  - Speaking the output aloud is optional and off by default.
 */
import { useId, useState } from 'react';
import Markdown from 'react-markdown';
import { markdownComponents } from './markdownComponents';
import { MIN_TOUCH, primaryActionButtonStyle, revealPanelFocusStyle, secondaryActionButtonStyle, templateFrameStyle, useRevealFocus, visuallyHidden } from './a11y';
import { speechSupported } from '@/lib/speech';

export interface SimControl {
  id: string;
  /** What a sighted person sees next to the box. */
  visual: string;
  /** The markup behind it, shown in the debrief. */
  code: string;
  /** What gets announced on landing, written as "<name>, checkbox, not checked" or "checkbox, not checked". */
  announces: string;
  /** True when a name is announced. States it in words in the debrief. */
  named: boolean;
}

export interface ScreenReaderSimProps {
  title: string;
  intro?: string;
  note?: string;
  controls: SimControl[];
  debrief: string;
}

/** Same sentence, with the state flipped. */
function announcement(control: SimControl, checked: boolean): string {
  return checked ? control.announces.replace(/not checked$/, 'checked') : control.announces;
}

function speak(text: string) {
  if (!speechSupported()) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

const MAX_LOG = 8;

export function ScreenReaderSim({ title, intro, note, controls, debrief }: ScreenReaderSimProps) {
  const [focusIdx, setFocusIdx] = useState(-1);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [log, setLog] = useState<string[]>([]);
  const [speakOn, setSpeakOn] = useState(false);
  const titleId = useId();
  const canSpeak = speechSupported();

  const done = visited.size === controls.length;
  const debriefRef = useRevealFocus<HTMLDivElement>(done);

  const say = (text: string) => {
    setLog((prev) => [...prev, text].slice(-MAX_LOG));
    if (speakOn) speak(text);
  };

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= controls.length) {
      setFocusIdx(-1);
      say(idx < 0 ? 'Start of form.' : 'End of form.');
      return;
    }
    setFocusIdx(idx);
    const c = controls[idx];
    setVisited((v) => new Set(v).add(c.id));
    say(announcement(c, !!checked[c.id]));
  };

  const toggle = () => {
    if (focusIdx < 0) return;
    const c = controls[focusIdx];
    const now = !checked[c.id];
    setChecked((s) => ({ ...s, [c.id]: now }));
    say(announcement(c, now));
  };

  const reset = () => {
    setFocusIdx(-1);
    setChecked({});
    setVisited(new Set());
    setLog([]);
    if (canSpeak) window.speechSynthesis.cancel();
  };

  return (
    <section aria-labelledby={titleId} style={templateFrameStyle}>
      <div style={{ padding: 'var(--space-lg) var(--space-xl)', background: 'rgba(201,168,76,0.07)' }}>
        <h3 id={titleId} style={{ margin: '0 0 var(--space-sm)', fontSize: '1.0625rem' }}>
          {title}
        </h3>
        {intro && (
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
            <Markdown components={markdownComponents}>{intro}</Markdown>
          </div>
        )}
      </div>

      <div style={{ padding: 'var(--space-lg) var(--space-xl)', display: 'grid', gap: 'var(--space-lg)' }}>
        <div>
          <p style={{ margin: '0 0 var(--space-sm)', fontSize: '0.75rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>
            What a sighted person sees
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--space-sm)' }}>
            {controls.map((c, i) => {
              const isFocus = i === focusIdx;
              return (
                <li
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    minHeight: MIN_TOUCH,
                    padding: '0 var(--space-md)',
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${isFocus ? 'var(--signal)' : 'var(--bg-border)'}`,
                    background: 'var(--bg-elevated)',
                  }}
                >
                  <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>
                    {checked[c.id] ? '☑' : '☐'}
                  </span>
                  <span>{c.visual}</span>
                  {isFocus && <span style={visuallyHidden}>(current focus)</span>}
                </li>
              );
            })}
          </ul>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
          <button type="button" style={primaryActionButtonStyle} onClick={() => goTo(focusIdx + 1)}>
            Tab (next control)
          </button>
          <button type="button" style={secondaryActionButtonStyle} onClick={() => goTo(focusIdx < 0 ? -1 : focusIdx - 1)}>
            Shift+Tab (previous)
          </button>
          <button type="button" style={secondaryActionButtonStyle} onClick={toggle} disabled={focusIdx < 0}>
            Space (check or uncheck)
          </button>
          <button type="button" style={secondaryActionButtonStyle} onClick={reset}>
            Start again
          </button>
        </div>

        {canSpeak && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)', minHeight: MIN_TOUCH }}>
            <input type="checkbox" checked={speakOn} onChange={(e) => setSpeakOn(e.target.checked)} style={{ width: 20, height: 20 }} />
            Speak the output aloud too
          </label>
        )}

        <div>
          <p style={{ margin: '0 0 var(--space-sm)', fontSize: '0.75rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>
            Simulated screen reader output
          </p>
          <div
            role="log"
            aria-live="polite"
            aria-label="Simulated screen reader output"
            style={{
              minHeight: 96,
              padding: 'var(--space-md)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-void)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-code)',
              fontSize: '0.875rem',
              lineHeight: 1.7,
            }}
          >
            {log.length === 0 ? (
              <span style={{ color: 'var(--text-tertiary)' }}>Press Tab to move to the first control.</span>
            ) : (
              log.map((line, i) => <div key={i}>{line}</div>)
            )}
          </div>
        </div>

        {note && <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{note}</p>}
      </div>

      {done && (
        <div
          ref={debriefRef}
          tabIndex={-1}
          style={{ ...revealPanelFocusStyle, borderTop: '1px solid var(--bg-border)', padding: 'var(--space-lg) var(--space-xl)', background: 'rgba(90,158,106,0.05)' }}
        >
          <p style={{ margin: '0 0 var(--space-sm)', fontSize: '0.75rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--signal)' }}>
            What you just heard
          </p>
          <ul style={{ listStyle: 'none', margin: '0 0 var(--space-lg)', padding: 0, display: 'grid', gap: 'var(--space-md)' }}>
            {controls.map((c) => (
              <li key={c.id}>
                <p style={{ margin: 0, fontWeight: 600 }}>
                  {c.visual}: {c.named ? 'a name was announced' : 'no name was announced'}
                </p>
                <p style={{ margin: '2px 0 var(--space-xs)', fontFamily: 'var(--font-code)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Heard: {c.announces}
                </p>
                <pre style={{ margin: 0, padding: 'var(--space-sm) var(--space-md)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', overflowX: 'auto', fontSize: '0.8125rem' }}>
                  <code>{c.code}</code>
                </pre>
              </li>
            ))}
          </ul>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
            <Markdown components={markdownComponents}>{debrief}</Markdown>
          </div>
        </div>
      )}
    </section>
  );
}
