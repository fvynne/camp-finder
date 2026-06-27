-- Sample Seattle-area camps so you can run the app immediately, before
-- wiring up the Google Places discovery script. Delete these later with:
--   delete from camps where source = 'sample';

insert into camps
  (name, description, address, city, zip, location, price_per_week_cents,
   length_type, min_age, max_age, interests, rating, website, source)
values
  ('Cascade Science Explorers',
   'Hands-on science and biology day camp with weekly themes from rockets to tide pools.',
   '1200 Westlake Ave N', 'Seattle', '98109',
   ST_SetSRID(ST_MakePoint(-122.3417, 47.6290), 4326)::geography,
   32500, 'all_day', 6, 12, '{science,biology,math}', 4.7,
   'https://example.com/cascade-science', 'sample'),

  ('Emerald City Theatre Workshop',
   'Young performers build a full musical over the week, ending in a family showcase.',
   '305 Harrison St', 'Seattle', '98109',
   ST_SetSRID(ST_MakePoint(-122.3493, 47.6228), 4326)::geography,
   28000, 'half_day', 7, 15, '{theatre,arts_crafts}', 4.5,
   'https://example.com/emerald-theatre', 'sample'),

  ('Lakeside Sports Academy',
   'Multi-sport day camp — soccer, basketball, swimming and field games.',
   '14000 NE 8th St', 'Bellevue', '98007',
   ST_SetSRID(ST_MakePoint(-122.1430, 47.6160), 4326)::geography,
   24000, 'all_day', 5, 13, '{sports}', 4.3,
   'https://example.com/lakeside-sports', 'sample'),

  ('Little Makers Art Studio',
   'Half-day arts and crafts camp: painting, clay, printmaking and collage.',
   '500 Kirkland Way', 'Kirkland', '98033',
   ST_SetSRID(ST_MakePoint(-122.2070, 47.6760), 4326)::geography,
   19500, 'half_day', 4, 9, '{arts_crafts}', 4.8,
   'https://example.com/little-makers', 'sample'),

  ('Pine Ridge Overnight Camp',
   'Classic week-long overnight camp in the foothills: hiking, canoeing, campfires and nature study.',
   '8800 Issaquah Hobart Rd SE', 'Issaquah', '98027',
   ST_SetSRID(ST_MakePoint(-122.0400, 47.4800), 4326)::geography,
   62000, 'overnight', 8, 15, '{sports,biology,arts_crafts}', 4.6,
   'https://example.com/pine-ridge', 'sample'),

  ('Math Quest Academy',
   'Game-based math and logic camp; puzzles, coding and competition prep.',
   '2222 148th Ave NE', 'Redmond', '98052',
   ST_SetSRID(ST_MakePoint(-122.1410, 47.6300), 4326)::geography,
   30000, 'all_day', 9, 15, '{math,science}', 4.4,
   'https://example.com/mathquest', 'sample'),

  ('Sound STEM Juniors',
   'Intro STEM for the youngest learners: simple machines, bugs and building.',
   '700 Bellevue Way NE', 'Bellevue', '98004',
   ST_SetSRID(ST_MakePoint(-122.2010, 47.6180), 4326)::geography,
   21000, 'half_day', 3, 7, '{science,math,arts_crafts}', 4.2,
   'https://example.com/sound-stem', 'sample');

-- One example set of dated sessions for the science camp, so the date filter
-- has something to match. (Other camps have no sessions yet and are kept by
-- the search function's "no sessions loaded" fallback.)
insert into camp_sessions (camp_id, start_date, end_date, spots_available)
select id, d.start_date, d.end_date, 20
from camps c
cross join (values
  (date '2026-06-22', date '2026-06-26'),
  (date '2026-06-29', date '2026-07-03'),
  (date '2026-07-06', date '2026-07-10'),
  (date '2026-07-13', date '2026-07-17')
) as d(start_date, end_date)
where c.name = 'Cascade Science Explorers';
