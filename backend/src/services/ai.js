const OpenAI = require('openai');

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set. Check your backend/.env file.');
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ALLOWED_TAGS = [
  'ideas', 'work', 'personal', 'learning', 'writing',
  'health', 'relationships', 'projects', 'quotes',
  'questions', 'decisions', 'tasks', 'reflections', 'creativity'
];

const SYSTEM_PROMPT = `
You are a personal knowledge assistant that organizes raw thoughts into structured notes.

When given a raw thought, idea, quote, or note, return ONLY a JSON object.

Rules:
1. Detect the main language of the user's input.
2. Write ALL fields in that SAME language. Never switch languages mid-response.
3. Do not translate unless the user explicitly asked for translation.

--- title ---
Clear and specific. Max 8 words. Sentence case.

--- summary ---
One sentence capturing the core idea. Max 30 words.
Do not repeat the user's words verbatim — rephrase with clarity.

--- insight ---
A single sentence (~30–35 words) that adds genuine value beyond the summary.
Can reference an author, book, framework, or related idea — only if clearly implied by the input.
Must enrich the thought, not restate it.
If nothing truly relevant comes to mind, return "" (empty string).
Never sound encyclopedic or forced.

--- connections ---
Up to 3 short strings (~15–20 words each).
Each must name a real conceptual link: an author, movement, or concept — and briefly explain WHY it connects.
Rules:
- Only include connections that are genuinely relevant.
- Never drop a name without explaining the link.
- Do not invent dubious connections.
- If there are no good connections, return [].

--- tags ---
Choose 1 or 2 tags from the allowed list only. Prefer broad, reusable tags.
Never invent new tags.

Allowed tags: ${ALLOWED_TAGS.join(', ')}
`;

const analyseThought = async (text, attempt = 1) => {
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 400,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'thought_analysis',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              title:       { type: 'string' },
              summary:     { type: 'string' },
              insight:     { type: 'string' },
              connections: {
                type: 'array',
                items: { type: 'string' },
                maxItems: 3
              },
              tags: {
                type: 'array',
                items: { type: 'string', enum: ALLOWED_TAGS },
                minItems: 1,
                maxItems: 2
              }
            },
            required: ['title', 'summary', 'insight', 'connections', 'tags']
          }
        }
      },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: text }
      ]
    });

    const parsed = JSON.parse(response.choices[0].message.content);

    if (
      typeof parsed.title       !== 'string' ||
      typeof parsed.summary     !== 'string' ||
      typeof parsed.insight     !== 'string' ||
      !Array.isArray(parsed.connections) ||
      !Array.isArray(parsed.tags)
    ) {
      throw new Error('AI response did not match expected shape.');
    }

    return {
      title:       parsed.title.trim(),
      summary:     parsed.summary.trim(),
      insight:     parsed.insight.trim(),
      connections: parsed.connections.map((c) => String(c).trim()).filter(Boolean).slice(0, 3),
      tags:        parsed.tags.map((t) => String(t).toLowerCase().trim()).filter((t) => ALLOWED_TAGS.includes(t)).slice(0, 2)
    };
  } catch (err) {
    if (attempt === 1) {
      console.warn('AI call failed, retrying once…', err.message);
      await new Promise((r) => setTimeout(r, 1000));
      return analyseThought(text, 2);
    }
    throw err;
  }
};

const findRelatedThoughts = async (newThought, existingThoughts) => {
  if (existingThoughts.length === 0) return [];

  const candidates = existingThoughts.slice(0, 20);
  const candidateList = candidates
    .map((t) => `ID ${t.id}: "${t.title}" — ${t.summary}`)
    .join('\n');

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 100,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'related_thoughts',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            related_ids: {
              type: 'array',
              items: { type: 'number' },
              maxItems: 3
            }
          },
          required: ['related_ids']
        }
      }
    },
    messages: [
      {
        role: 'system',
        content: `You find meaningful conceptual connections between thoughts.
Given a new thought and a list of existing ones, return the IDs of those that are genuinely related — shared theme, complementary idea, or useful contrast.
Be selective: only return IDs with a real connection. If nothing is related, return an empty array.
Return ONLY a JSON object with a "related_ids" array of numbers.`
      },
      {
        role: 'user',
        content: `New thought: "${newThought.title}" — ${newThought.summary}\n\nExisting thoughts:\n${candidateList}`
      }
    ]
  });

  const parsed = JSON.parse(response.choices[0].message.content);
  const validIds = new Set(candidates.map((t) => t.id));

  return parsed.related_ids
    .map(Number)
    .filter((id) => validIds.has(id));
};

module.exports = { analyseThought, findRelatedThoughts };