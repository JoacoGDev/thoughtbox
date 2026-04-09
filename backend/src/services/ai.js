const Anthropic = require('@anthropic-ai/sdk');

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is not set. Check your backend/.env file.');
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a personal knowledge assistant that helps people organise their thoughts.

When given a raw thought, idea, quote, or note, analyse it and respond with ONLY a JSON object.
No markdown, no backticks, no explanation — raw JSON only.

The JSON must follow this exact shape:
{
  "title":   string,   // Clear, specific title. Max 8 words. Sentence case.
  "summary": string,   // One sentence capturing the essence. Max 30 words.
  "tags":    string[]  // 2–4 lowercase tags useful for retrieval (e.g. "creativity", "health")
}`;

const cleanJson = (raw) =>
  raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

/**
 * Calls the Anthropic API to analyse a raw thought.
 * Retries once on transient errors.
 */
const analyseThought = async (text, attempt = 1) => {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: text }],
    });

    const raw = message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');

    const parsed = JSON.parse(cleanJson(raw));

    if (typeof parsed.title !== 'string' || typeof parsed.summary !== 'string' || !Array.isArray(parsed.tags)) {
      throw new Error('AI response did not match expected shape.');
    }

    return {
      title:   parsed.title.trim(),
      summary: parsed.summary.trim(),
      tags:    parsed.tags.map((t) => String(t).toLowerCase().trim()).slice(0, 6),
    };
  } catch (err) {
    if (attempt === 1 && !(err instanceof SyntaxError)) {
      console.warn('AI call failed, retrying once…', err.message);
      await new Promise((r) => setTimeout(r, 1000));
      return analyseThought(text, 2);
    }
    throw err;
  }
};

module.exports = { analyseThought };
