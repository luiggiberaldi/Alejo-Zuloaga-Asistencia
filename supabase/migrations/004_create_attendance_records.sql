create table attendance_records (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references students(id) on delete cascade,
  date        text not null, -- 'YYYY-MM-DD'
  status      text not null check (status in ('presente', 'ausente')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (student_id, date)
);

create index idx_attendance_student_date on attendance_records(student_id, date);
