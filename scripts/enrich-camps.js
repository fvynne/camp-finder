// enrich-camps.js
// Fills in the structured fields that Google Places can't give us
// (min_age, max_age, price_per_week_cents, length_type, interests) by reading
// each camp's website and asking Claude to extract them as JSON.
//
// This is the "AI-assisted enrichment" step. It is best-effort: ALWAYS review
// the results — many camp sites omit price or exact dates. Treat low-confidence
// extractions as a starting point, not ground truth.
//
// Usage:
//   1. cd scripts && npm install
//   2. ensure ANTHROPIC_API_KEY (and Supabase keys) are in .env
//   3. npm run enrich
//
// Cost control: uses Claude Haiku 4.5 (cheap, fast) and only processes camps
// that still have null structured fields, up to MAX_PER_RUN.

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const { ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

if (!ANTHROPIC_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing env vars (need ANTHROPIC_API_KEY + Supabase keys). See .env.example.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const MODEL = 'claude-haiku-4-5-20251001'; // cheap + fast; good enough for extraction
const MAX_PER_RUN = 25;
const VALID_INTERESTS = ['arts_crafts', 'sports', 'science', 'math', 'theatre', 'biology'];
const VALID_LENGTHS = ['half_day', 'all_day', 'overnight'];

// Crudely strip a web page to text so we don't send huge HTML to the model.
function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 6000);
}

async function fetchSiteText(url) {
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    return htmlToText(await res.text());
  } catch {
    return null;
  }
}

async function extractWithClaude(name, siteText) {
  const prompt =
    `You are extracting structured data about a children's summer camp from its website text.\n` +
    `Camp name: ${name}\n\n` +
    `Website text:\n"""${siteText}"""\n\n` +
    `Return ONLY a JSON object with these keys (use null when not stated — do not guess):\n` +
    `{\n` +
    `  "min_age": integer or null,\n` +
    `  "max_age": integer or null,\n` +
    `  "price_per_week_cents": integer or null,   // weekly price in cents, e.g. $300 -> 30000\n` +
    `  "length_type": one of ${JSON.stringify(VALID_LENGTHS)} or null,\n` +
    `  "interests": array of any of ${JSON.stringify(VALID_INTERESTS)} (empty array if none clear)\n` +
    `}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    console.warn(`  Anthropic API ${res.status}: ${await res.text()}`);
    return null;
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function sanitize(extracted) {
  if (!extracted) return null;
  const out = {};
  if (Number.isInteger(extracted.min_age)) out.min_age = extracted.min_age;
  if (Number.isInteger(extracted.max_age)) out.max_age = extracted.max_age;
  if (Number.isInteger(extracted.price_per_week_cents))
    out.price_per_week_cents = extracted.price_per_week_cents;
  if (VALID_LENGTHS.includes(extracted.length_type)) out.length_type = extracted.length_type;
  if (Array.isArray(extracted.interests)) {
    const interests = extracted.interests.filter((i) => VALID_INTERESTS.includes(i));
    if (interests.length) out.interests = interests;
  }
  return Object.keys(out).length ? out : null;
}

async function run() {
  // Pull camps that have a website but still lack structured data.
  const { data: camps, error } = await supabase
    .from('camps')
    .select('id, name, website, min_age, price_per_week_cents, length_type')
    .not('website', 'is', null)
    .or('min_age.is.null,price_per_week_cents.is.null,length_type.is.null')
    .limit(MAX_PER_RUN);

  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  if (!camps?.length) {
    console.log('No camps need enrichment. Done.');
    return;
  }

  console.log(`Enriching up to ${camps.length} camps...\n`);
  let updated = 0;

  for (const camp of camps) {
    process.stdout.write(`- ${camp.name}: `);
    const siteText = await fetchSiteText(camp.website);
    if (!siteText) {
      console.log('could not read website, skipped');
      continue;
    }
    const extracted = sanitize(await extractWithClaude(camp.name, siteText));
    if (!extracted) {
      console.log('nothing extractable, skipped');
      continue;
    }
    const { error: upErr } = await supabase.from('camps').update(extracted).eq('id', camp.id);
    if (upErr) {
      console.log(`update error: ${upErr.message}`);
      continue;
    }
    updated++;
    console.log(`updated (${Object.keys(extracted).join(', ')})`);
  }

  console.log(`\nDone. Updated ${updated}/${camps.length}. Re-run to process more.`);
  console.log('IMPORTANT: spot-check the values — extraction is best-effort.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
