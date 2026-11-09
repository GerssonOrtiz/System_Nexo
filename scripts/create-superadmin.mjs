import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

function loadEnv() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const env = {};
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || url.includes('placeholder') || key.includes('placeholder')) {
    console.error('ERROR: Falta configurar URL o SERVICE_ROLE_KEY válidos en .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const username = 'venllas';
  const email = 'venllas@cabelab.local';
  const password = process.argv[2] || 'Venllas2026!';

  console.log(`Verificando o creando usuario ${email}...`);

  // 1. Crear usuario en Auth
  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      full_name: 'Superadministrador Venllas',
    },
  });

  let userId;

  if (createError) {
    if (createError.message.toLowerCase().includes('already') || createError.message.toLowerCase().includes('registered')) {
      console.log('El usuario ya existe en Supabase Auth. Buscando ID...');
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existing = listData?.users.find((u) => u.email === email);
      if (!existing) {
        console.error('No se pudo encontrar el usuario existente:', createError.message);
        process.exit(1);
      }
      userId = existing.id;
      // Actualizar password
      await supabase.auth.admin.updateUserById(userId, { password });
      console.log('Contraseña actualizada para el usuario existente.');
    } else {
      console.error('Error al crear usuario en Auth:', createError.message);
      process.exit(1);
    }
  } else {
    userId = createData.user.id;
    console.log('Usuario creado exitosamente en Auth con ID:', userId);
  }

  // 2. Asegurar perfil con rol ADMIN_TI e is_superadmin = true
  console.log('Asignando rol ADMIN_TI y superadmin en public.profiles...');
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      username,
      full_name: 'Superadministrador Venllas',
      role: 'ADMIN_TI',
      is_superadmin: true,
      is_active: true,
      deleted_at: null,
    });

  if (profileError) {
    console.error('Error al actualizar el perfil en la tabla profiles:', profileError.message);
    process.exit(1);
  }

  console.log('========================================================');
  console.log('¡SUPERADMIN VENLLAS CREADO Y CONFIGURADO CON ÉXITO!');
  console.log(`Usuario: ${username}`);
  console.log(`Correo interno: ${email}`);
  console.log(`Contraseña: ${password}`);
  console.log('========================================================');
}

main().catch((err) => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
