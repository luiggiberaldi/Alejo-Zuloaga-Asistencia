create table behavior_reports (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references students(id) on delete cascade,
  description  text not null,
  severity     text not null default 'leve' check (severity in ('leve', 'moderado', 'grave')),
  date         text not null, -- 'YYYY-MM-DD'
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
