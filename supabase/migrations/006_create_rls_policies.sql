-- RLS: profesor gestiona sus propias secciones/estudiantes/asistencia/comportamiento.
-- Coordinador solo lee lo correspondiente a su year_level (o 'todos').

alter table user_roles enable row level security;

create policy user_roles_self_read on user_roles
  for select using (user_id = auth.uid());

alter table sections enable row level security;

create policy sections_profesor_all on sections
  for all using (
    current_role_name() = 'profesor' and teacher_id = auth.uid()
  ) with check (
    current_role_name() = 'profesor' and teacher_id = auth.uid()
  );

create policy sections_coordinador_read on sections
  for select using (
    current_role_name() = 'coordinador'
    and (current_year_level() = 'todos' or year_level = current_year_level())
  );

alter table students enable row level security;

create policy students_access on students
  for all using (
    exists (
      select 1 from sections s where s.id = students.section_id
      and (
        (current_role_name() = 'profesor' and s.teacher_id = auth.uid())
        or (current_role_name() = 'coordinador'
            and (current_year_level() = 'todos' or s.year_level = current_year_level()))
      )
    )
  ) with check (
    exists (
      select 1 from sections s where s.id = students.section_id
      and current_role_name() = 'profesor' and s.teacher_id = auth.uid()
    )
  );

alter table attendance_records enable row level security;

create policy attendance_access on attendance_records
  for all using (
    exists (
      select 1 from students st join sections s on s.id = st.section_id
      where st.id = attendance_records.student_id
      and (
        (current_role_name() = 'profesor' and s.teacher_id = auth.uid())
        or (current_role_name() = 'coordinador'
            and (current_year_level() = 'todos' or s.year_level = current_year_level()))
      )
    )
  ) with check (
    exists (
      select 1 from students st join sections s on s.id = st.section_id
      where st.id = attendance_records.student_id
      and current_role_name() = 'profesor' and s.teacher_id = auth.uid()
    )
  );

alter table behavior_reports enable row level security;

create policy behavior_reports_access on behavior_reports
  for all using (
    exists (
      select 1 from students st join sections s on s.id = st.section_id
      where st.id = behavior_reports.student_id
      and (
        (current_role_name() = 'profesor' and s.teacher_id = auth.uid())
        or (current_role_name() = 'coordinador'
            and (current_year_level() = 'todos' or s.year_level = current_year_level()))
      )
    )
  ) with check (
    exists (
      select 1 from students st join sections s on s.id = st.section_id
      where st.id = behavior_reports.student_id
      and current_role_name() = 'profesor' and s.teacher_id = auth.uid()
    )
  );
