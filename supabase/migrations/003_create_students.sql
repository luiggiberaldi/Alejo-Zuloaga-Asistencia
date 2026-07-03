create table students (
  id          uuid primary key default gen_random_uuid(),
  section_id  uuid not null references sections(id) on delete cascade,
  cedula      text not null, -- sin puntos ni guiones
  nombres     text not null,
  apellidos   text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_students_section on students(section_id);
