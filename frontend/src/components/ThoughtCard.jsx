import { useState } from 'react';

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const ThoughtCard = ({ thought, onDelete, onTagClick }) => {
  const [expanded, setExpanded]     = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const handleDelete = async () => {
    if (!confirming) { setConfirming(true); return; }
    setDeleting(true);
    try {
      await onDelete(thought.id);
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  };

  const related = thought.related || [];

  return (
    <article className={`thought-card ${deleting ? 'fading' : ''}`}>
      <header className="card-header">
        <h3 className="card-title">{thought.title}</h3>
        <button
          className={`delete-btn ${confirming ? 'confirming' : ''}`}
          onClick={handleDelete}
          onBlur={() => setConfirming(false)}
          title={confirming ? 'Click again to confirm' : 'Delete'}
        >
          {confirming ? '?' : '×'}
        </button>
      </header>

      <p className="card-summary">{thought.summary}</p>

      <div className="card-tags">
        {thought.tags.map((tag) => (
          <button key={tag} className="tag" onClick={() => onTagClick(tag)}>#{tag}</button>
        ))}
      </div>

      {related.length > 0 && (
        <div className="related-section">
          <p className="related-label">Connected thoughts</p>
          {related.map((r) => (
            <div key={r.id} className="related-item">
              <span className="related-dot" />
              <span className="related-title">{r.title}</span>
            </div>
          ))}
        </div>
      )}

      {expanded && (
        <blockquote className="card-raw">{thought.raw_text}</blockquote>
      )}

      <footer className="card-footer">
        <time className="card-date">{formatDate(thought.created_at)}</time>
        <button className="expand-btn" onClick={() => setExpanded((p) => !p)}>
          {expanded ? 'Hide original' : 'Show original'}
        </button>
      </footer>
    </article>
  );
};