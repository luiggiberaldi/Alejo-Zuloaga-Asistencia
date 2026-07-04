-- Seed users for local development
-- Note: On remote Supabase, users must be created through Supabase Auth (Dashboard or API)

-- 1. Profesor de prueba: profesor@prueba.com
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
VALUES (
  'a3bc5d98-12ab-4c3e-89da-0b81a7b4512e',
  'profesor@prueba.com',
  crypt('123456789', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 2. Coordinador de prueba: coordinador@liceo.com
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
VALUES (
  'b8bc5d98-34ab-4c3e-89da-0b81a7b4512f',
  'coordinador@liceo.com',
  crypt('coordinador123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 3. Asignar Roles
INSERT INTO public.user_roles (user_id, role, year_level, created_at)
VALUES 
  ('a3bc5d98-12ab-4c3e-89da-0b81a7b4512e', 'profesor', '1ro', now()),
  ('b8bc5d98-34ab-4c3e-89da-0b81a7b4512f', 'coordinador', 'todos', now())
ON CONFLICT (user_id) DO NOTHING;
