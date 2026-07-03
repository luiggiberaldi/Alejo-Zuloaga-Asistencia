create table sections (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  year_level  text not null, -- '1ro' | '2do' | '3ro' | '4to' | '5to'
  teacher_id  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
