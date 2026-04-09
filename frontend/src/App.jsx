import { useThoughts } from './hooks/useThoughts';
import { ThoughtForm } from './components/ThoughtForm';
import { ThoughtCard } from './components/ThoughtCard';
import { TagFilter } from './components/TagFilter';

export default function App() {
  const { thoughts, loading, error, activeTag, setActiveTag, allTags, addThought, removeThought } = useThoughts();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-mark">✦</span>
          <span className="logo-text">Thoughtbox</span>
        </div>
        <p className="tagline">Your second brain,<br />organised by AI.</p>
        <TagFilter tags={allTags} activeTag={activeTag} onSelect={setActiveTag} />
        <div className="sidebar-footer">
          <span className="thought-count">
            {thoughts.length} {thoughts.length === 1 ? 'thought' : 'thoughts'}
          </span>
        </div>
      </aside>

      <main className="main">
        <ThoughtForm onSubmit={addThought} />
        <section className="thoughts-section">
          {activeTag && (
            <div className="active-filter">
              Showing: <strong>#{activeTag}</strong>
              <button onClick={() => setActiveTag(null)}>Clear ×</button>
            </div>
          )}
          {loading && <div className="state-msg"><span className="spinner large" /> Loading…</div>}
          {error && <div className="state-msg error">Could not load thoughts: {error}</div>}
          {!loading && !error && thoughts.length === 0 && (
            <div className="empty-state">
              <p className="empty-icon">✦</p>
              <p className="empty-title">Nothing here yet.</p>
              <p className="empty-sub">Write your first thought above and let AI make sense of it.</p>
            </div>
          )}
          <div className="thoughts-grid">
            {thoughts.map((t) => (
              <ThoughtCard key={t.id} thought={t} onDelete={removeThought} onTagClick={setActiveTag} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
