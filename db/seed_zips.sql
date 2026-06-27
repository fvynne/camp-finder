-- Seattle-metro zip codes (lat/lng) so the app can resolve a parent's zip
-- without putting a Google key in the client. Add more rows as needed:
--   insert into zip_codes (zip, city, state, location)
--   values ('98XXX','City','WA', ST_SetSRID(ST_MakePoint(<lng>, <lat>), 4326)::geography);

insert into zip_codes (zip, city, state, location) values
  ('98101','Seattle','WA',   ST_SetSRID(ST_MakePoint(-122.3358, 47.6109), 4326)::geography),
  ('98103','Seattle','WA',   ST_SetSRID(ST_MakePoint(-122.3422, 47.6736), 4326)::geography),
  ('98109','Seattle','WA',   ST_SetSRID(ST_MakePoint(-122.3470, 47.6256), 4326)::geography),
  ('98115','Seattle','WA',   ST_SetSRID(ST_MakePoint(-122.3036, 47.6846), 4326)::geography),
  ('98144','Seattle','WA',   ST_SetSRID(ST_MakePoint(-122.2986, 47.5896), 4326)::geography),
  ('98004','Bellevue','WA',  ST_SetSRID(ST_MakePoint(-122.2058, 47.6177), 4326)::geography),
  ('98005','Bellevue','WA',  ST_SetSRID(ST_MakePoint(-122.1707, 47.6101), 4326)::geography),
  ('98007','Bellevue','WA',  ST_SetSRID(ST_MakePoint(-122.1430, 47.6136), 4326)::geography),
  ('98008','Bellevue','WA',  ST_SetSRID(ST_MakePoint(-122.1146, 47.6058), 4326)::geography),
  ('98033','Kirkland','WA',  ST_SetSRID(ST_MakePoint(-122.2060, 47.6769), 4326)::geography),
  ('98052','Redmond','WA',   ST_SetSRID(ST_MakePoint(-122.1215, 47.6740), 4326)::geography),
  ('98027','Issaquah','WA',  ST_SetSRID(ST_MakePoint(-122.0326, 47.5301), 4326)::geography),
  ('98011','Bothell','WA',   ST_SetSRID(ST_MakePoint(-122.2054, 47.7601), 4326)::geography),
  ('98201','Everett','WA',   ST_SetSRID(ST_MakePoint(-122.2021, 47.9789), 4326)::geography),
  ('98402','Tacoma','WA',    ST_SetSRID(ST_MakePoint(-122.4443, 47.2529), 4326)::geography)
on conflict (zip) do nothing;
