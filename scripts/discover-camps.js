// discover-camps.js
// One-time (or periodic) discovery of summer camps in the Seattle metro using
// the Google Places API (New). Inserts/updates them in Supabase. This gives you
// name, address, location, rating, website & phone automatically — the
// structured fields (age, price, length, interests, dates) are filled in later
// by enrich-camps.js or by hand.
//
// Usage:
//   1. cd scripts && npm install
//   2. copy .env.example to .env and fill in keys
//   3. npm run discover
//
// Notes:
// - Places API (New) returns up to 20 results per call, with a nextPageToken
//   for more. We run several text queries to broaden coverage and de-dupe by
//   place id.
// - Free tier easily covers this. Set a budget alert anyway (see README).

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const { GOOGLE_MAPS_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

if (!GOOGLE_MAPS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing env vars. Copy .env.example to .env and fill in keys.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Center the search on downtown Seattle; bias a ~75km radius.
const SEATTLE = { lat: 47.6062, lng: -122.3321 };
const SEARCH_RADIUS_METERS = 75000;

// Several phrasings catch camps that any single query would miss.
const QUERIES = [
  'summer camp for kids',
  'summer day camp',
  'kids science camp',
  'kids sports camp',
  'kids art camp',
  'youth theatre camp',
  'overnight summer camp',
];

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.websiteUri',
  'places.nationalPhoneNumber',
  'places.addressComponents',
].join(',');

async function searchText(textQuery, pageToken) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery,
      pageToken,
      locationBias: {
        circle: {
          center: { latitude: SEATTLE.lat, longitude: SEATTLE.lng },
          radius: SEARCH_RADIUS_METERS,
        },
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places API ${res.status}: ${text}`);
  }
  return res.json();
}

function pickComponent(components, type) {
  const c = (components || []).find((x) => (x.types || []).includes(type));
  return c ? c.shortText || c.longText : null;
}

function toRow(place) {
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (lat == null || lng == null) return null; // can't place it on a map -> skip

  return {
    place_id: place.id,
    name: place.displayName?.text ?? 'Unknown camp',
    address: place.formattedAddress ?? null,
    city: pickComponent(place.addressComponents, 'locality'),
    state: pickComponent(place.addressComponents, 'administrative_area_level_1') || 'WA',
    zip: pickComponent(place.addressComponents, 'postal_code'),
    // PostGIS geography accepts EWKT text; PostgREST passes it straight through.
    location: `SRID=4326;POINT(${lng} ${lat})`,
    rating: place.rating ?? null,
    website: place.websiteUri ?? null,
    phone: place.nationalPhoneNumber ?? null,
    source: 'google_places',
    // Structured fields intentionally left null — filled by enrich step.
  };
}

async function run() {
  const byId = new Map();

  for (const q of QUERIES) {
    let pageToken;
    let page = 0;
    do {
      const data = await searchText(q, pageToken);
      const places = data.places ?? [];
      for (const p of places) byId.set(p.id, p);
      pageToken = data.nextPageToken;
      page++;
      console.log(`  "${q}" page ${page}: +${places.length} (unique so far: ${byId.size})`);
      // Google needs a moment before a page token becomes valid.
      if (pageToken) await new Promise((r) => setTimeout(r, 2000));
    } while (pageToken && page < 3); // cap at 3 pages (60) per query
  }

  const rows = [...byId.values()].map(toRow).filter(Boolean);
  console.log(`\nDiscovered ${rows.length} unique camps. Upserting to Supabase...`);

  // Upsert in chunks; de-dupe across runs on the unique place_id.
  const CHUNK = 100;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from('camps')
      .upsert(chunk, { onConflict: 'place_id', ignoreDuplicates: false });
    if (error) {
      console.error('Upsert error:', error.message);
      process.exit(1);
    }
  }

  console.log(`Done. ${rows.length} camps saved.`);
  console.log('Next: run "npm run enrich" or hand-fill age/price/length/interests/dates.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
