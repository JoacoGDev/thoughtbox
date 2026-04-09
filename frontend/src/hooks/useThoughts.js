import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

export const useThoughts = () => {
  const [thoughts, setThoughts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [activeTag, setActiveTag] = useState(null);

  const fetchThoughts = useCallback(async (tag) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getThoughts(tag);
      setThoughts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchThoughts(activeTag); }, [activeTag, fetchThoughts]);

  const addThought = useCallback(async (text) => {
    const newThought = await api.analyzeThought(text);
    setThoughts((prev) => [newThought, ...prev]);
    return newThought;
  }, []);

  const removeThought = useCallback(async (id) => {
    await api.deleteThought(id);
    setThoughts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const allTags = [...new Set(thoughts.flatMap((t) => t.tags))].sort();

  return { thoughts, loading, error, activeTag, setActiveTag, allTags, addThought, removeThought };
};
