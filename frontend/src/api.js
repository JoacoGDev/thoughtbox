const BASE = '/api/thoughts';

const handleResponse = async (res) => {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
};

export const api = {
  getThoughts: (tag) => {
    const url = tag ? `${BASE}?tag=${encodeURIComponent(tag)}` : BASE;
    return fetch(url).then(handleResponse);
  },

  analyzeThought: (text) =>
    fetch(`${BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }).then(handleResponse),

  deleteThought: (id) =>
    fetch(`${BASE}/${id}`, { method: 'DELETE' }).then(handleResponse),
};
