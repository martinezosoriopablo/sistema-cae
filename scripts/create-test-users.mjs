import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gnwnywsewbcfzrjsuvsg.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdud255d3Nld2JjZnpyanN1dnNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDI0MTU5MywiZXhwIjoyMDg1ODE3NTkzfQ.g9r6vw1VRPBIU1uxVuGlUl6TYcyswwy3CdacHCVLQ3U'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const testUsers = [
  {
    email: 'admin@talkchile.cl',
    password: 'admin123',
    rol: 'admin',
    nombre: 'Pablo',
    apellido: 'Martínez'
  },
  {
    email: 'vendedor@talkchile.cl',
    password: 'vendedor123',
    rol: 'vendedor',
    nombre: 'María',
    apellido: 'González'
  },
  {
    email: 'profesor@talkchile.cl',
    password: 'profesor123',
    rol: 'profesor',
    nombre: 'Carlos',
    apellido: 'Sánchez'
  },
  {
    email: 'alumno@talkchile.cl',
    password: 'alumno123',
    rol: 'alumno',
    nombre: 'Ana',
    apellido: 'López'
  }
]

async function createTestUsers() {
  console.log('🚀 Creando usuarios de prueba...\n')

  for (const user of testUsers) {
    console.log(`📧 Procesando: ${user.email}`)

    // 1. Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true
    })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log(`   ⚠️  Usuario ya existe en Auth, actualizando contraseña...`)

        // Obtener el usuario existente
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existingUser = existingUsers?.users?.find(u => u.email === user.email)

        if (existingUser) {
          await supabase.auth.admin.updateUserById(existingUser.id, {
            password: user.password
          })
          console.log(`   ✅ Contraseña actualizada`)

          // Verificar/actualizar en tabla usuarios
          const { error: upsertError } = await supabase
            .from('usuarios')
            .upsert({
              id: existingUser.id,
              email: user.email,
              rol: user.rol,
              nombre: user.nombre,
              apellido: user.apellido
            }, { onConflict: 'id' })

          if (upsertError) {
            console.log(`   ❌ Error en tabla usuarios: ${upsertError.message}`)
          } else {
            console.log(`   ✅ Tabla usuarios actualizada`)
          }

          // Si es profesor, crear en tabla profesores
          if (user.rol === 'profesor') {
            const { error: profError } = await supabase
              .from('profesores')
              .upsert({
                user_id: existingUser.id,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                especialidades: ['A1', 'A2', 'B1'],
                activo: true
              }, { onConflict: 'user_id' })

            if (profError) {
              console.log(`   ❌ Error en tabla profesores: ${profError.message}`)
            } else {
              console.log(`   ✅ Tabla profesores actualizada`)
            }
          }
        }
      } else {
        console.log(`   ❌ Error Auth: ${authError.message}`)
      }
      continue
    }

    const userId = authData.user.id
    console.log(`   ✅ Usuario Auth creado: ${userId}`)

    // 2. Crear en tabla usuarios
    const { error: userError } = await supabase
      .from('usuarios')
      .insert({
        id: userId,
        email: user.email,
        rol: user.rol,
        nombre: user.nombre,
        apellido: user.apellido
      })

    if (userError) {
      console.log(`   ❌ Error tabla usuarios: ${userError.message}`)
    } else {
      console.log(`   ✅ Registro en tabla usuarios creado`)
    }

    // 3. Si es profesor, crear en tabla profesores
    if (user.rol === 'profesor') {
      const { error: profError } = await supabase
        .from('profesores')
        .insert({
          user_id: userId,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          especialidades: ['A1', 'A2', 'B1'],
          activo: true
        })

      if (profError) {
        console.log(`   ❌ Error tabla profesores: ${profError.message}`)
      } else {
        console.log(`   ✅ Registro en tabla profesores creado`)
      }
    }

    console.log('')
  }

  // 4. Crear alumno de prueba (necesita vendedor_id)
  console.log('📚 Creando alumno de prueba...')

  // Obtener el vendedor
  const { data: vendedor } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', 'vendedor@talkchile.cl')
    .single()

  // Obtener el profesor
  const { data: profesor } = await supabase
    .from('profesores')
    .select('id')
    .eq('email', 'profesor@talkchile.cl')
    .single()

  // Obtener el alumno user
  const { data: alumnoUser } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', 'alumno@talkchile.cl')
    .single()

  if (vendedor && alumnoUser) {
    const { error: alumnoError } = await supabase
      .from('alumnos')
      .upsert({
        user_id: alumnoUser.id,
        nombre: 'Ana',
        apellido: 'López',
        email: 'alumno@talkchile.cl',
        telefono: '+56912345678',
        nivel_actual: 'A1',
        horas_contratadas: 20,
        horas_restantes: 18,
        vendedor_id: vendedor.id,
        profesor_id: profesor?.id || null,
        bloqueado: false
      }, { onConflict: 'user_id' })

    if (alumnoError) {
      console.log(`   ❌ Error tabla alumnos: ${alumnoError.message}`)
    } else {
      console.log(`   ✅ Registro en tabla alumnos creado`)
    }
  }

  console.log('\n✨ ¡Proceso completado!\n')
  console.log('📋 Credenciales de prueba:')
  console.log('─'.repeat(40))
  testUsers.forEach(u => {
    console.log(`   ${u.rol.toUpperCase().padEnd(10)} → ${u.email} / ${u.password}`)
  })
  console.log('─'.repeat(40))
}

createTestUsers()
