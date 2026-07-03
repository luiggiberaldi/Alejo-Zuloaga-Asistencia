# Roles y permisos — Alejo Zuloaga Asistencia

La app tiene dos roles: **profesor** y **coordinador**. El rol se guarda en la tabla `user_roles` de
Supabase y determina tanto lo que el usuario puede hacer en la UI como lo que las RLS policies le
permiten leer/escribir en la base de datos.

## Tabla de permisos por rol

| Acción                          | Profesor            | Coordinador           |
|---------------------------------|---------------------|-----------------------|
| Crear secciones                 | Sí (propias)        | No                    |
| Registrar estudiantes           | Sí                  | No                    |
| Marcar asistencia               | Sí                  | No                    |
| Reportar comportamiento         | Sí                  | No                    |
| Eliminar estudiante             | Sí (con confirmación) | No                  |
| Sincronizar                     | Sí                  | No                    |
| Ver secciones propias           | Sí                  | Sí (todas de su año)  |
| Ver asistencias históricas      | Sí (propias)        | Sí (de su año)        |
| Exportar PDF individual         | Sí                  | Sí                    |
| Exportar PDF por sección        | Sí                  | Sí                    |
| Exportar PDF consolidado año    | No                  | Sí                    |
| Ver profesores de su año        | No                  | Sí                    |

El **profesor** es un usuario operativo: crea y gestiona sus secciones, estudiantes y asistencia.
El **coordinador** es un usuario de solo lectura y reportería a nivel de un año escolar: supervisa a
todos los profesores de su `year_level` y exporta el consolidado, pero no marca asistencia ni edita
datos.

## Tabla user_roles (Supabase)

```sql
CREATE TABLE user_roles (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('profesor', 'coordinador')),
  year_level  TEXT NOT NULL,   -- '1ro' | '2do' | '3ro' | '4to' | '5to' | 'todos'
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

- Un **profesor** normalmente tiene un `year_level` específico o `'todos'` según su carga.
- Un **coordinador** tiene el `year_level` del año que supervisa (ej: `'3ro'`) o `'todos'`.

## RLS policies (resumen)

Función auxiliar recomendada para obtener el rol/año del usuario actual:

```sql
CREATE OR REPLACE FUNCTION current_year_level() RETURNS TEXT
LANGUAGE sql STABLE AS $$
  SELECT year_level FROM user_roles WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION current_role_name() RETURNS TEXT
LANGUAGE sql STABLE AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid()
$$;
```

### sections

```sql
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

-- Profesor: solo sus propias secciones (lectura y escritura)
CREATE POLICY sections_profesor_all ON sections
  FOR ALL USING (
    current_role_name() = 'profesor' AND teacher_id = auth.uid()
  ) WITH CHECK (
    current_role_name() = 'profesor' AND teacher_id = auth.uid()
  );

-- Coordinador: lectura de todas las secciones de su año
CREATE POLICY sections_coordinador_read ON sections
  FOR SELECT USING (
    current_role_name() = 'coordinador'
    AND (current_year_level() = 'todos' OR year_level = current_year_level())
  );
```

### students

```sql
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Hereda de sections: el acceso al estudiante depende del acceso a su sección
CREATE POLICY students_access ON students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sections s WHERE s.id = students.section_id
      AND (
        (current_role_name() = 'profesor' AND s.teacher_id = auth.uid())
        OR (current_role_name() = 'coordinador'
            AND (current_year_level() = 'todos' OR s.year_level = current_year_level()))
      )
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM sections s WHERE s.id = students.section_id
      AND current_role_name() = 'profesor' AND s.teacher_id = auth.uid()
    )
  );
```

### attendance_records y behavior_reports

Ambas heredan el acceso a través de `students` → `sections`. La lectura sigue las mismas reglas de
año/dueño; la escritura queda restringida al **profesor dueño** de la sección del estudiante:

```sql
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY attendance_access ON attendance_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM students st JOIN sections s ON s.id = st.section_id
      WHERE st.id = attendance_records.student_id
      AND (
        (current_role_name() = 'profesor' AND s.teacher_id = auth.uid())
        OR (current_role_name() = 'coordinador'
            AND (current_year_level() = 'todos' OR s.year_level = current_year_level()))
      )
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM students st JOIN sections s ON s.id = st.section_id
      WHERE st.id = attendance_records.student_id
      AND current_role_name() = 'profesor' AND s.teacher_id = auth.uid()
    )
  );
```

`behavior_reports` usa una policy análoga sustituyendo la tabla.

## Flujo de registro de usuarios

- El **coordinador** es pre-registrado por un administrador (se crea el usuario en Supabase Auth y su
  fila en `user_roles` con `role = 'coordinador'` y el `year_level` que supervisa).
- El **profesor** puede **auto-registrarse** con email y contraseña. Tras el registro, un
  administrador (o el coordinador) le asigna su fila en `user_roles` con `role = 'profesor'`. Hasta
  que tenga rol asignado, las RLS policies no le permiten leer ni escribir datos de dominio.

Ver [database_schema.md](database_schema.md) para el esquema completo y la migración
`006_create_rls_policies.sql`.
