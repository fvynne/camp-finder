-- Camp Finder — search + ranking function
-- Run this in the Supabase SQL editor AFTER schema.sql.
-- The mobile app calls it with: supabase.rpc('search_camps', { ... })
--
-- Hard filters narrow the set (radius, age, price, length, dates);
-- the weighted score then ORDERS the survivors. Tune the weights freely.

create or replace function search_camps(
  p_zip            text,
  p_child_age      integer  default null,
  p_interests      text[]   default null,
  p_min_price_cents integer default null,
  p_max_price_cents integer default null,
  p_length_types   text[]   default null,
  p_start_date     date     default null,
  p_end_date       date     default null,
  p_radius_miles   double precision default 75
)
returns table (
  id                   uuid,
  name                 text,
  description          text,
  address              text,
  city                 text,
  zip                  text,
  price_per_week_cents integer,
  length_type          text,
  min_age              integer,
  max_age              integer,
  interests            text[],
  rating               numeric,
  website              text,
  phone                text,
  photo_url            text,
  distance_miles       double precision,
  matched_interests    text[],
  score                double precision
)
language plpgsql
stable
set search_path = public, pg_temp   -- pinned so the function can't be hijacked via search_path
as $$
declare
  v_origin geography;
  v_meters double precision := p_radius_miles * 1609.344;
begin
  -- Resolve the parent's zip to a point. Unknown zip -> no results.
  select location into v_origin from zip_codes where zip_codes.zip = p_zip;
  if v_origin is null then
    return;
  end if;

  return query
  with base as (
    select
      c.*,
      ST_Distance(c.location, v_origin) / 1609.344 as dist_miles,
      case
        when p_interests is null then c.interests
        else array(select unnest(c.interests) intersect select unnest(p_interests))
      end as matched
    from camps c
    where ST_DWithin(c.location, v_origin, v_meters)
      -- age: child must fall inside the camp's accepted range (unknown range = keep)
      and (p_child_age is null or c.min_age is null or c.max_age is null
           or p_child_age between c.min_age and c.max_age)
      -- length type
      and (p_length_types is null or c.length_type = any(p_length_types))
      -- price overlap (unknown price = keep, scored neutrally below)
      and (p_min_price_cents is null or c.price_per_week_cents is null
           or c.price_per_week_cents >= p_min_price_cents)
      and (p_max_price_cents is null or c.price_per_week_cents is null
           or c.price_per_week_cents <= p_max_price_cents)
      -- at least one matching interest (if the parent specified any)
      and (p_interests is null or c.interests && p_interests)
      -- dates: a session must overlap the requested window
      -- (camps with no sessions loaded yet are kept so results aren't empty)
      and (
        p_start_date is null or p_end_date is null
        or exists (
          select 1 from camp_sessions s
          where s.camp_id = c.id
            and s.start_date <= p_end_date
            and s.end_date   >= p_start_date
        )
        or not exists (select 1 from camp_sessions s2 where s2.camp_id = c.id)
      )
  )
  select
    base.id, base.name, base.description, base.address, base.city, base.zip,
    base.price_per_week_cents, base.length_type, base.min_age, base.max_age,
    base.interests, base.rating, base.website, base.phone, base.photo_url,
    round(base.dist_miles::numeric, 1)::double precision as distance_miles,
    base.matched as matched_interests,
    (
      -- 40 pts: share of the child's interests this camp covers
      40.0 * (
        coalesce(cardinality(base.matched), 0)::double precision
        / nullif(coalesce(cardinality(p_interests), cardinality(base.interests), 1), 0)
      )
      -- 25 pts: closeness (1 at the doorstep, 0 at the radius edge)
      + 25.0 * greatest(0, 1 - base.dist_miles / p_radius_miles)
      -- 15 pts: price fit (cheaper within budget scores higher; unknown = neutral)
      + 15.0 * (
          case
            when base.price_per_week_cents is null then 0.5
            when p_max_price_cents is null then 0.7
            else greatest(0, 1 - base.price_per_week_cents::double precision
                               / nullif(p_max_price_cents, 0))
          end
        )
      -- 10 pts: quality/rating (unknown rating treated as 3.0/5)
      + 10.0 * (coalesce(base.rating, 3.0) / 5.0)
    )::double precision as score
  from base
  order by score desc, distance_miles asc;
end;
$$;

-- Let the mobile app (anon key) and signed-in users call it.
grant execute on function search_camps(text, integer, text[], integer, integer, text[], date, date, double precision)
  to anon, authenticated;
