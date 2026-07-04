/**
 * Script para crear usuarios de prueba en Supabase Auth mediante la API de Administración.
 *
 * Modo de ejecución:
 * 1. Definir la clave service role (NUNCA commitear):
 *    PowerShell:
 *      $env:SUPABASE_SERVICE_ROLE_KEY="<pegar_aqui_service_role_key>"
 *    Unix:
 *      export SUPABASE_SERVICE_ROLE_KEY="<pegar_aqui_service_role_key>"
 *
 * 2. Ejecutar el script:
 *    npx --yes tsx scripts/seed-test-users.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kwtqbhhrgolnwasbaadj.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ Error: La variable de entorno SUPABASE_SERVICE_ROLE_KEY no está definida.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const usersToCreate = [
  {
    email: 'profesor@prueba.com',
    password: '123456789',
    role: 'profesor',
    yearLevel: '1ro'
  },
  {
    email: 'coordinador.demo@alejozuloaga.edu.ve',
    password: 'Demo2026Coord!',
    role: 'coordinador',
    yearLevel: 'todos'
  }
];

async function seed() {
  console.log('🚀 Iniciando creación de usuarios de prueba en Supabase Auth...');
  const summary: Array<{ email: string; id: string; role: string; status: string }> = [];

  for (const item of usersToCreate) {
    console.log(`\nCreando usuario: ${item.email}...`);
    let userId = '';
    let status = 'Creado';

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: item.email,
      password: item.password,
      email_confirm: true
    });

    if (authError) {
      if (authError.message.includes('already registered') || authError.status === 422) {
        console.log(`⚠️ El usuario ${item.email} ya existe en Supabase Auth. Buscando ID...`);
        status = 'Ya existía';

        // Buscar ID del usuario existente
        const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
          console.error(`❌ Error listando usuarios:`, listError.message);
          continue;
        }

        const existingUser = listData.users.find(u => u.email === item.email);
        if (existingUser) {
          userId = existingUser.id;
        } else {
          console.error(`❌ No se pudo encontrar el ID del usuario existente ${item.email}`);
          continue;
        }
      } else {
        console.error(`❌ Error al crear usuario en Auth:`, authError.message);
        continue;
      }
    } else if (authData?.user) {
      userId = authData.user.id;
    }

    if (!userId) {
      console.error(`❌ No se pudo obtener el ID del usuario.`);
      continue;
    }

    console.log(`✅ UUID en Auth: ${userId}`);

    // 2. Insertar rol en user_roles
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert(
        {
          user_id: userId,
          role: item.role,
          year_level: item.yearLevel
        },
        { onConflict: 'user_id' }
      );

    if (roleError) {
      console.error(`❌ Error asignando rol en user_roles:`, roleError.message);
      status = 'Fallo asignación de rol';
    } else {
      console.log(`✅ Rol '${item.role}' (${item.yearLevel}) asignado en user_roles.`);
    }

    summary.push({
      email: item.email,
      id: userId,
      role: item.role,
      status
    });
  }

  console.log('\n=============================================================================');
  console.log('📊 RESUMEN DE CREACIÓN DE USUARIOS');
  console.log('=============================================================================');
  console.table(summary);
  console.log('=============================================================================');
}

seed().catch(err => {
  console.error('❌ Error catastrófico en el seed:', err);
  process.exit(1);
});
