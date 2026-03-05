
import { GlossToken } from "../types";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("ANTHROPIC_API_KEY is not set in environment variables");
}

const CLAUDE_MODEL = 'claude-sonnet-4-6';
const CLAUDE_HAIKU_MODEL = 'claude-haiku-4-5-20251001';

const splitIntoChunks = (text: string, maxWords: number = 20): string[] => {
  // Split text into alternating tokens: words and whitespace (preserving newlines)
  const tokens = text.split(/(\s+)/);
  const chunks: string[] = [];
  let currentChunk = '';
  let wordCount = 0;

  for (const token of tokens) {
    if (/^\s+$/.test(token)) {
      currentChunk += token;
    } else if (token.length > 0) {
      if (wordCount >= maxWords && currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
        wordCount = 0;
      }
      currentChunk += token;
      wordCount++;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

const MAX_TOKENS: Record<string, number> = {
  [CLAUDE_HAIKU_MODEL]: 8000,
  [CLAUDE_MODEL]: 8000,
};

const callClaude = async (systemPrompt: string, userMessage: string, model: string = CLAUDE_MODEL): Promise<string> => {
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is missing.");

  const response = await fetch('/anthropic-api/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS[model] ?? 8000,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Anthropic API error: ${(error as any).error?.message ?? response.statusText}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error("Empty response from Claude.");
  return text;
};

const ANALYZE_SYSTEM_PROMPT = `You are a scholar of Old English philology with deep expertise in Anglo-Saxon grammar, the Bosworth-Toller Anglo-Saxon Dictionary, Clark Hall's Concise Anglo-Saxon Dictionary, and comparative Germanic linguistics.

Your task is to tokenize and gloss Old English text with scholarly precision. Return a JSON array where each element is one token (a word, punctuation mark, or line break). Do not produce tokens for spaces.

Each token object must have exactly these fields:
- "original": the exact word or punctuation as it appears in the input, or "\\n" for a line break
- "modernTranslation": the word's meaning IN THIS SPECIFIC CONTEXT — not just a dictionary gloss, but the sense that fits the passage
- "lemma": the normalized West Saxon citation form (nominative singular for nouns/adjectives/pronouns; infinitive for verbs)
- "partOfSpeech": one of — Noun, Verb, Adjective, Adverb, Pronoun, Determiner, Preposition, Conjunction, Interjection, Particle, Numeral, Punctuation, Formatting
- "grammaticalInfo": concise morphological tag — one short phrase only (e.g. "nom. pl. neut. a-stem", "3sg. pret. indic. str. cl. III", "dat. sg. masc. weak")
- "etymology": PGmc root + 1–2 key cognates only, one line (e.g. "*wardaz; cf. ON vörðr, ModE ward")
- "isPunctuation": true for punctuation marks and "\\n" tokens; false for all lexical words

CRITICAL OUTPUT RULES:
- Return ONLY a valid JSON array. No markdown code fences, no preamble, no trailing commentary.
- Every line break in the input must yield a dedicated token: { "original": "\\n", "modernTranslation": "Line Break", "lemma": "N/A", "partOfSpeech": "Formatting", "grammaticalInfo": "N/A", "etymology": "N/A", "isPunctuation": true }
- Treat each orthographic word as its own token; do not merge words.
- For contracted or enclitic forms (e.g. "nolde" < "ne" + "wolde"), treat as a single token and note the contraction in grammaticalInfo.
- Old English diacritics (macrons, acutes) should be preserved exactly as written in the input.`;

/** Extract the first balanced JSON array or object from a string. */
const extractBalanced = (text: string, open: '[' | '{'): string | null => {
  const close = open === '[' ? ']' : '}';
  const start = text.indexOf(open);
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === open) depth++;
    if (ch === close) { depth--; if (depth === 0) return text.slice(start, i + 1); }
  }
  return null;
};

const parseJSON = <T>(text: string): T => {
  const cleaned = text
    .replace(/^```[a-z]*\s*/m, '')
    .replace(/```\s*$/m, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const arr = extractBalanced(cleaned, '[');
    if (arr) return JSON.parse(arr) as T;
    const obj = extractBalanced(cleaned, '{');
    if (obj) return JSON.parse(obj) as T;
    throw new Error("Could not extract JSON from response.");
  }
};

/** Ensure a parsed value is an array. If it's an object, look for the first array-valued property. */
const ensureArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    for (const v of Object.values(value)) {
      if (Array.isArray(v)) return v as T[];
    }
  }
  throw new Error(`Expected JSON array from model but got: ${typeof value}`);
};

export const analyzeOldEnglishText = async (text: string): Promise<GlossToken[]> => {
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is missing.");

  const chunks = splitIntoChunks(text, 20);
  let allTokens: GlossToken[] = [];
  let lastResponseText = '';

  for (const [index, chunk] of chunks.entries()) {
    const userMessage = chunks.length > 1
      ? `Analyze segment ${index + 1} of ${chunks.length}. Return ONLY a JSON array starting with [ and ending with ]. No prose, no wrapper object:\n\n${chunk}`
      : `Return ONLY a JSON array starting with [ and ending with ]. No prose, no wrapper object:\n\n${chunk}`;

    const tryParse = async (model: string): Promise<GlossToken[] | null> => {
      try {
        lastResponseText = await callClaude(ANALYZE_SYSTEM_PROMPT, userMessage, model);
        const trimmed = lastResponseText.trim();
        const looksComplete = trimmed.endsWith(']');
        if (!looksComplete) {
          console.warn(`Chunk ${index} response appears truncated (len=${trimmed.length}, ends="${trimmed.slice(-30)}")`);
        }
        return ensureArray<GlossToken>(parseJSON<unknown>(lastResponseText));
      } catch (error) {
        const isOverloaded = error instanceof Error && error.message.includes('Overloaded');
        console.warn(`Chunk ${index} failed with ${model} (overloaded=${isOverloaded}):`, error);
        console.warn(`Response: len=${lastResponseText.length}, start="${lastResponseText.slice(0, 100)}", end="${lastResponseText.slice(-100)}"`);
        if (isOverloaded) await new Promise(r => setTimeout(r, 3000));
        return null;
      }
    };

    let tokens: GlossToken[] | null = null;
    for (let attempt = 0; attempt < 2 && tokens === null; attempt++) {
      tokens = await tryParse(CLAUDE_HAIKU_MODEL);
      if (tokens === null && attempt < 1) await new Promise(r => setTimeout(r, 500));
    }
    if (tokens === null) {
      console.warn(`Chunk ${index}: Haiku failed twice, falling back to Sonnet`);
      tokens = await tryParse(CLAUDE_MODEL);
    }
    if (tokens === null) {
      const preview = lastResponseText
        ? `\n\nResponse: len=${lastResponseText.length}\nStart: ${lastResponseText.slice(0, 300)}\nEnd: ${lastResponseText.slice(-200)}`
        : '';
      throw new Error(`Chunk ${index + 1} of ${chunks.length}: all models failed${preview}`);
    }
    allTokens = [...allTokens, ...tokens];
    if (index < chunks.length - 1) await new Promise(r => setTimeout(r, 300));
  }

  return allTokens;
};

const DEEP_ANALYZE_SYSTEM_PROMPT = `You are a specialist in Old English philology. Re-analyze a single Old English word in context.

Return ONLY a valid JSON object — no markdown fences, no preamble. Keep all values brief and dictionary-style (one line each). Fields:
- "modernTranslation": the word's meaning in this context (a short gloss, e.g. "to go, travel")
- "lemma": normalized West Saxon citation form per Bosworth-Toller (e.g. "faran")
- "partOfSpeech": grammatical category (e.g. "Verb", "Noun", "Adjective")
- "grammaticalInfo": concise morphological tag (e.g. "3sg. pres. indic., str. vb. cl. VI" or "nom. pl. neut. a-stem")
- "etymology": PGmc root + 1–2 key cognates only (e.g. "*faraną; cf. OHG faran, OE fær")`;

export const deepAnalyzeToken = async (
  token: GlossToken,
  context: string
): Promise<{ updates: Partial<GlossToken>; sources: { title: string; uri: string }[] }> => {
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is missing.");

  const lemmaClause = token.lemma
    ? ` (currently lemmatized as "${token.lemma}")`
    : '';
  const userMessage = `Re-analyze the Old English word "${token.original}"${lemmaClause} as it appears in this context:

"${context}"

Apply Bosworth-Toller and Clark Hall conventions. Return a JSON object with the five required fields.`;

  try {
    const responseText = await callClaude(DEEP_ANALYZE_SYSTEM_PROMPT, userMessage);
    const raw = parseJSON<Record<string, unknown>>(responseText);

    const flattenValue = (val: unknown): string => {
      if (typeof val === 'string') return val;
      if (Array.isArray(val)) return val.map(flattenValue).join('; ');
      if (val && typeof val === 'object') {
        return Object.entries(val as Record<string, unknown>)
          .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
          .join(', ');
      }
      return String(val);
    };

    const updates: Partial<GlossToken> = {};
    for (const key of ['modernTranslation', 'lemma', 'partOfSpeech', 'grammaticalInfo', 'etymology'] as const) {
      if (key in raw) {
        updates[key] = flattenValue(raw[key]);
      }
    }

    return { updates, sources: [] };
  } catch (error) {
    console.error("Claude deep analysis error:", error);
    throw error;
  }
};
