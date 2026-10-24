import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListenBar } from '../ListenBar';

const chunks = [
  { sectionIdx: -1, text: 'Lesson title' },
  { sectionIdx: 1, text: 'First part. It has two sentences.' },
  { sectionIdx: 2, text: 'Second part.' },
];

let spoken: string[];
let cancel: ReturnType<typeof vi.fn>;

beforeEach(() => {
  spoken = [];
  cancel = vi.fn();
  class FakeUtterance {
    text: string;
    rate = 1;
    lang = '';
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(text: string) {
      this.text = text;
    }
  }
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      cancel,
      speak: (u: FakeUtterance) => {
        spoken.push(u.text);
        queueMicrotask(() => u.onend?.());
      },
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  // @ts-expect-error cleaning up the stub
  delete window.speechSynthesis;
});

describe('ListenBar', () => {
  it('reads every part in order and tells the page where it is', async () => {
    const user = userEvent.setup();
    const onSection = vi.fn();
    render(<ListenBar chunks={chunks} lessonId="l1" onSection={onSection} />);
    await user.click(screen.getByRole('button', { name: 'Listen' }));
    await vi.waitFor(() => expect(spoken.join(' ')).toContain('Second part.'));
    expect(spoken[0]).toBe('Lesson title');
    expect(onSection.mock.calls.map((c) => c[0])).toEqual([-1, 1, 2]);
  });

  it('stops talking when the learner leaves', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ListenBar chunks={chunks} lessonId="l1" />);
    await user.click(screen.getByRole('button', { name: 'Listen' }));
    cancel.mockClear();
    unmount();
    expect(cancel).toHaveBeenCalled();
  });

  it('offers pause while playing and resume afterwards', async () => {
    const user = userEvent.setup();
    // Never finishes, so it stays in the playing state.
    (window.speechSynthesis as unknown as { speak: () => void }).speak = () => {};
    render(<ListenBar chunks={chunks} lessonId="l1" />);
    await user.click(screen.getByRole('button', { name: 'Listen' }));
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByRole('status')).toHaveTextContent('Paused at part 1 of 3');
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
  });

  it('says so, and offers another go, when the device has no voice', async () => {
    const user = userEvent.setup();
    (window.speechSynthesis as unknown as { speak: (u: { onerror?: (e: { error: string }) => void }) => void }).speak = (u) => {
      queueMicrotask(() => u.onerror?.({ error: 'synthesis-failed' }));
    };
    render(<ListenBar chunks={chunks} lessonId="l1" />);
    await user.click(screen.getByRole('button', { name: 'Listen' }));
    await vi.waitFor(() => expect(screen.getByRole('status')).toHaveTextContent("Audio didn't start"));
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('does not treat its own stop as a failure', async () => {
    const user = userEvent.setup();
    let last: { onerror?: (e: { error: string }) => void } | undefined;
    (window.speechSynthesis as unknown as { speak: (u: typeof last) => void }).speak = (u) => {
      last = u;
    };
    render(<ListenBar chunks={chunks} lessonId="l1" />);
    await user.click(screen.getByRole('button', { name: 'Listen' }));
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    last?.onerror?.({ error: 'canceled' });
    expect(screen.getByRole('status')).toHaveTextContent('Paused at part 1 of 3');
  });

  it('says plainly when the browser cannot speak', () => {
    // @ts-expect-error removing the stub to simulate an unsupported browser
    delete window.speechSynthesis;
    render(<ListenBar chunks={chunks} lessonId="l1" />);
    expect(screen.getByText(/Listening isn't available in this browser/)).toBeInTheDocument();
  });
});
