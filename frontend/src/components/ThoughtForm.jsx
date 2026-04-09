import { useState } from 'react';

export const ThoughtForm = ({ onSubmit }) => {
  const [text, setText]     = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMsg, setError] = useState('');

  const handleSubmit = async () => {
    if (!text.trim() || status === 'loading') return;
    setStatus('loading');
    setError('');
    try {
      await onSubmit(text.trim());
      setText('');
      setStatus('idle');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  const tooLong = text.length > 2000;

  return (
    <div className="form-card">
      <label className="form-label">What's on your mind?</label>
      <textarea
        className="form-textarea"
        value={text}
        onChange={(e) => { setText(e.target.value); setStatus('idle'); }}
        onKeyDown={handleKeyDown}
        placeholder="A shower thought, a quote, an idea, a question…"
        rows={5}
        disabled={status === 'loading'}
      />
      <div className="form-footer">
        <span className={`char-count ${tooLong ? 'over' : ''}`}>{text.length}/2000</span>
        {errorMsg && <span className="form-error">{errorMsg}</span>}
        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={!text.trim() || tooLong || status === 'loading'}
        >
          {status === 'loading'
            ? <span className="btn-inner"><span className="spinner" /> Analysing…</span>
            : <span className="btn-inner">Capture thought ↵</span>
          }
        </button>
      </div>
      <p className="form-hint">Ctrl + Enter to submit</p>
    </div>
  );
};
