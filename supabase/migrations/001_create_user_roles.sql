-- Roles de usuario: profesor o coordinador, con el año escolar que les corresponde.
create table user_roles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('profesor', 'coordinador')),
  year_level  text not null, -- '1ro' | '2do' | '3ro' | '4to' | '5to' | 'todos'
  created_at  timestamptz not null default now()
);

create or replace function current_year_level() returns text
language sql stable as $$
  select year_level from user_roles where user_id = auth.uid()
$$;

create or replace function current_role_name() returns text
language sql stable as $$
  select role from user_roles where user_id = auth.uid()
$$;
