export const TagFilter = ({ tags, activeTag, onSelect }) => {
  if (tags.length === 0) return null;
  return (
    <nav className="tag-filter">
      <p className="filter-label">Filter by tag</p>
      <button className={`filter-tag ${!activeTag ? 'active' : ''}`} onClick={() => onSelect(null)}>
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          className={`filter-tag ${activeTag === tag ? 'active' : ''}`}
          onClick={() => onSelect(activeTag === tag ? null : tag)}
        >
          #{tag}
        </button>
      ))}
    </nav>
  );
};
