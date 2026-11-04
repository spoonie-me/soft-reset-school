import { useCallback, useEffect, useRef, useState } from 'react';
import { speechSupported, type SpeechChunk } from '@/lib/speech';
import { MIN_TOUCH, secondaryActionButtonStyle, primaryActionButtonStyle } from '@/components/lesson-templates/a11y';

const RATES = [0.85, 1, 1.15, 1.3, 1.5];
const RATE_KEY = 'srs_listen_rate';

/** Browsers cut off long utterances (Chrome after roughly 15 seconds), so speak sentence by sentence. */
function splitForSpeech(text: string, max = 200): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const parts: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if ((cur + s).length > max && cur) {
      parts.push(cur.trim());
      cur = s;
    } else {
      cur += s;
    }
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

function readRate(): number {
  try {
    const v = Number(localStorage.getItem(RATE_KEY));
    return RATES.includes(v) ? v : 1;
  } catch {
    return 1;
  }
}

function track(name: string, params: Record<string, unknown>) {
  (window as unknown as { trackEvent?: (n: string, p: Record<string, unknown>) => void }).trackEvent?.(name, params);
}

interface ListenBarProps {
  chunks: SpeechChunk[];
  lessonId: string;
  /** Called as reading reaches each part of the lesson, so the page can follow along. */
  onSection?: (sectionIdx: number) => void;
}

/** Plays the lesson aloud with the browser's own voice. Pause and resume are
 * done by stopping and restarting the current paragraph, because the native
 * pause is unreliable on phones. */
export function ListenBar({ chunks, lessonId, onSection }: ListenBarProps) {
  const [status, setStatus] = useState<'idle' | 'playing' | 'paused' | 'error'>('idle');
  const [index, setIndex] = useState(0);
  const [rate, setRate] = useState(readRate);
  const run = useRef(0); // bumped on every stop/seek so stale callbacks do nothing
  const supported = speechSupported();

  const stop = useCallback(() => {
    run.current += 1;
    if (speechSupported()) window.speechSynthesis.cancel();
  }, []);

  const speakFrom = useCallback(
    (start: number, atRate: number) => {
      if (!speechSupported()) return;
      stop();
      const myRun = run.current;
      setStatus('playing');
      let i = start;

      const next = () => {
        if (run.current !== myRun) return;
        if (i >= chunks.length) {
          setStatus('idle');
          setIndex(0);
          track('listen_complete', { lesson: lessonId });
          return;
        }
        setIndex(i);
        const chunk = chunks[i];
        onSection?.(chunk.sectionIdx);
        const parts = splitForSpeech(chunk.text);
        let p = 0;
        const sayPart = () => {
          if (run.current !== myRun) return;
          if (p >= parts.length) {
            i += 1;
            next();
            return;
          }
          const u = new SpeechSynthesisUtterance(parts[p]);
          u.rate = atRate;
          u.lang = document.documentElement.lang || 'en';
          u.onend = () => {
            p += 1;
            sayPart();
          };
          u.onerror = (e) => {
            // Our own stop/seek cancels the utterance; that is not a failure.
            if (run.current !== myRun || e.error === 'canceled' || e.error === 'interrupted') return;
            setStatus('error');
            track('listen_error', { lesson: lessonId, error: e.error });
          };
          window.speechSynthesis.speak(u);
        };
        sayPart();
      };
      next();
    },
    [chunks, lessonId, onSection, stop],
  );

  // Never keep talking after the learner leaves the lesson.
  useEffect(() => stop, [stop]);

  if (!supported) {
    return (
      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', margin: '0 0 var(--space-xl)' }}>
        Listening isn't available in this browser. Try Chrome, Edge or Safari.
      </p>
    );
  }

  const play = () => {
    if (status === 'idle') track('listen_start', { lesson: lessonId });
    speakFrom(index, rate);
  };
  const pause = () => {
    stop();
    setStatus('paused');
  };
  const reset = () => {
    stop();
    setStatus('idle');
    setIndex(0);
  };
  const seek = (to: number) => {
    const clamped = Math.max(0, Math.min(chunks.length - 1, to));
    setIndex(clamped);
    if (status === 'playing') speakFrom(clamped, rate);
  };
  const changeRate = (r: number) => {
    setRate(r);
    try {
      localStorage.setItem(RATE_KEY, String(r));
    } catch {
      /* storage can be blocked; the speed just won't be remembered */
    }
    if (status === 'playing') speakFrom(index, r);
  };

  const message =
    status === 'error'
      ? "Audio didn't start. This device may not have a voice installed. Reading the lesson works as normal."
      : status === 'playing'
      ? `Listening, part ${index + 1} of ${chunks.length}`
      : status === 'paused'
        ? `Paused at part ${index + 1} of ${chunks.length}`
        : 'Listen to this lesson instead of reading it';

  return (
    <div
      role="group"
      aria-label="Listen to this lesson"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 'var(--space-md)',
        padding: 'var(--space-md) var(--space-lg)',
        marginBottom: 'var(--space-xl)',
        border: '1px solid var(--bg-border)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-surface)',
      }}
    >
      {status === 'playing' ? (
        <button type="button" onClick={pause} style={primaryActionButtonStyle}>
          Pause
        </button>
      ) : (
        <button type="button" onClick={play} style={primaryActionButtonStyle}>
          {status === 'paused' ? 'Resume' : status === 'error' ? 'Try again' : 'Listen'}
        </button>
      )}
      <button type="button" onClick={() => seek(index - 1)} style={secondaryActionButtonStyle} aria-label="Back one part">
        Back
      </button>
      <button type="button" onClick={() => seek(index + 1)} style={secondaryActionButtonStyle} aria-label="Skip to next part">
        Skip
      </button>
      {status !== 'idle' && status !== 'error' && (
        <button type="button" onClick={reset} style={secondaryActionButtonStyle}>
          Stop
        </button>
      )}
      <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
        Speed
        <select
          value={rate}
          onChange={(e) => changeRate(Number(e.target.value))}
          style={{
            minHeight: MIN_TOUCH,
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--bg-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0 var(--space-sm)',
            fontFamily: 'inherit',
          }}
        >
          {RATES.map((r) => (
            <option key={r} value={r}>
              {r}x
            </option>
          ))}
        </select>
      </label>
      <p role="status" style={{ flexBasis: '100%', margin: 0, color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
        {message}
      </p>
    </div>
  );
}
