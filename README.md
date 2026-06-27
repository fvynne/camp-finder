# Camp Finder (Seattle MVP)

A mobile app that helps parents find summer camps for kids ages 2–15. A parent
enters their criteria (children, age, interests, zip, price, length, dates) and
gets a ranked list of camps within 75 miles.

This MVP targets the **Seattle metro area**.

## How it's built

```
camp-finder/
├── db/                     SQL for Supabase (Postgres + PostGIS)
│   ├── schema.sql            tables, indexes, row-level security
│   ├── search_camps.sql      the radius + filter + ranking function
│   ├── seed_zips.sql         Seattle-area zip -> lat/lng
│   └── seed_sample_camps.sql 7 sample camps so the app works immediately
├── scripts/                Node data scripts
│   ├── discover-camps.js     pull real camps from Google Places (New)
│   └── enrich-camps.js       AI-fill age/price/length/interests from websites
└── app/                    Expo (React Native) app — iOS + Android
    └── src/screens/          Search → Results → Camp detail
```

**Architecture:** the app talks directly to Supabase (no custom backend). The
parent's zip is resolved to a location inside the database, a PostGIS query
finds camps within 75 miles, hard filters narrow them, and a weighted score
ranks them. See `db/search_camps.sql` for the scoring weights.

---

## Setup

### Step 1 — Supabase (the database)
1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run these files in order (paste & Run each):
   1. `db/schema.sql`
   2. `db/search_camps.sql`
   3. `db/seed_zips.sql`
   4. `db/seed_sample_camps.sql`  ← lets you test before adding real data
3. From **Project Settings → API**, copy your **Project URL** and **anon key**.

### Step 2 — Run the app (works on sample data right away)
```bash
cd app
npm install
cp .env.example .env        # then paste your Supabase URL + anon key
npx expo start -c
```
Scan the QR code with the **Expo Go** app on your phone. Search zip `98101`,
age `8`, interest `Science` — you should see the sample camps ranked.

### Step 3 — Load real Seattle camps (when ready)
1. Get a Google Cloud API key with **Places API (New)** + **Geocoding API**
   enabled (see "Google key" below).
2. Configure and run the discovery script:
   ```bash
   cd scripts
   npm install
   cp .env.example .env      # add GOOGLE_MAPS_API_KEY + Supabase SERVICE key
   npm run discover          # pulls real camps (name, address, location, rating)
   ```
3. Fill in the structured fields (age, price, length, interests). Either:
   - **AI-assisted:** add `ANTHROPIC_API_KEY` to `scripts/.env`, then `npm run enrich`
     (reads each camp's website, extracts fields — **review the results**), or
   - **By hand:** edit rows in the Supabase Table Editor.
4. Remove the samples when you're happy: `delete from camps where source='sample';`

---

## Google key (quick reference)
1. [console.cloud.google.com](https://console.cloud.google.com) → new project.
2. **Billing** → link a card (free tier covers MVP; set a $10 budget alert).
3. **APIs & Services → Library** → enable **Places API (New)** and **Geocoding API**.
4. **Credentials → Create credentials → API key** → copy it.
5. Restrict the key to those two APIs.

---

## What's intentionally NOT in the MVP
Accounts/login, saved camps, child profiles, in-app booking/payments, photos &
maps polish, and markets beyond Seattle. Each is a clean next step once the core
search proves useful with real parents.

## Next steps after MVP
- Add a date picker (replace the YYYY-MM-DD text fields).
- Track which results parents tap/save and retune the scoring weights.
- Load `camp_sessions` with real dates so the date filter is exact.
- Add accounts + saved camps.
- A camp self-service portal to keep listings fresh.

## Note on children's data (COPPA)
You store data about minors. Keep it minimal (age + first name), publish a
privacy policy before launch, and get legal review. The current MVP collects no
child data server-side — search criteria are sent per-request, not stored.
