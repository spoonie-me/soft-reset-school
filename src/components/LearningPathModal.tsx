interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function LearningPathModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  function select(path: 'technical' | 'clinical') {
    localStorage.setItem('bc_learning_path', path);
    localStorage.setItem('bc_path_selected', 'true');
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose your learning path"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-xl)',
      }}
    >
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-2xl)',
        maxWidth: 560,
        width: '100%',
        boxSizing: 'border-box',
        maxHeight: '100%',
        overflowY: 'auto',
      }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-sm)' }}>Choose your learning path</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-xl)' }}>
          We'll tailor your experience based on your background. You can change this anytime in Settings.
        </p>

        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
          {/* Technical */}
          <button
            onClick={() => select('technical')}
            style={{
              background: 'var(--bg-elevated)',
              border: '2px solid var(--signal)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-xl)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}>💻</div>
            <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-sm)', color: 'var(--signal)' }}>Technical Path</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.5, margin: 0 }}>
              For developers, analysts, and engineers. Full curriculum including Claude API, prompt engineering, coding exercises, and real tool-building projects.
            </p>
          </button>

          {/* Builder */}
          <button
            onClick={() => select('clinical')}
            style={{
              background: 'var(--bg-elevated)',
              border: '2px solid var(--gold)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-xl)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}>🚀</div>
            <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-sm)', color: 'var(--gold)' }}>Builder Path</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.5, margin: 0 }}>
              For product managers, designers, and non-developers who want to understand AI deeply. Concept-first with real examples — fewer code exercises, more strategic thinking.
            </p>
          </button>
        </div>

        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textAlign: 'center', margin: 0 }}>
          Not sure? Start with Technical — you can always switch later.
        </p>
      </div>
    </div>
  );
}
