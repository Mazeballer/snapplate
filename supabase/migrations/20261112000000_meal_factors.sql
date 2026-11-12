-- Keep the reasons behind a meal's health score and its emoji with the meal, so they are still
-- there when the meal is opened later.
alter table public.meals
  add column health_factors jsonb not null default '[]'::jsonb,
  add column emoji text check (emoji is null or length(emoji) <= 16);
