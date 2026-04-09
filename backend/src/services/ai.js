const OpenAI = require('openai');

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set. Check your backend/.env file.');
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ALLOWED_TAGS = [
  'ideas',
  'work',
  'personal',
  'learning',
  'writing',
  'health',
  'relationships',
  'projects',
  'quotes',
  'questions',
  'decisions',
  'tasks',
  'reflections',
  'creativity'
];

const SYSTEM_PROMPT = `
You are a personal knowledge assistant that organizes raw thoughts into structured notes.

When given a raw thought, idea, quote, or note, return ONLY a JSON object.

Rules:
1. Detect the main language of the user's input.
2. Write "title" and "summary" in that SAME language.
3. Do not translate unless the user explicitly asked for translation.
4. Keep the title clear and specific, max 8 words, sentence case.
5. Keep the summary to one sentence, max 30 words.
6. For tags, ONLY choose from the allowed tag list provided.
7. Choose 1 or 2 tags maximum.
8. Prefer broader, reusable tags over overly specific ones.
9. Never invent new tags.

Allowed tags:
${ALLOWED_TAGS.join(', ')}
`;

const analyseThought = async (text, attempt = 1) => {
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'thought_analysis',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              title: {
                type: 'string'
              },
              summary: {
                type: 'string'
              },
              tags: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ALLOWED_TAGS
                },
                minItems: 1,
                maxItems: 2
              }
            },
            required: ['title', 'summary', 'tags']
          }
        }
      },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text }
      ]
    });

    const raw = response.choices[0].message.content;
    const parsed = JSON.parse(raw);

    if (
      typeof parsed.title !== 'string' ||
      typeof parsed.summary !== 'string' ||
      !Array.isArray(parsed.tags)
    ) {
      throw new Error('AI response did not match expected shape.');
    }

    return {
      title: parsed.title.trim(),
      summary: parsed.summary.trim(),
      tags: parsed.tags
        .map((t) => String(t).toLowerCase().trim())
        .filter((t) => ALLOWED_TAGS.includes(t))
        .slice(0, 2)
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

module.exports = { analyseThought };