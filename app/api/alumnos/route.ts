import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { nuevoAlumnoSchema } from '@/lib/validations'
import { calcularDuracion } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const vendedor_id = searchParams.get('vendedor_id')

  let query = supabase.from('alumnos').select('*')

  if (vendedor_id) {
    query = query.eq('vendedor_id', vendedor_id)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Verificar que es vendedor
  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!userData || !['vendedor', 'admin'].includes(userData.rol)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json()

  // Validar datos
  const validation = nuevoAlumnoSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0].message },
      { status: 400 }
    )
  }

  const data = validation.data

  try {
    // Crear usuario en Supabase Auth
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: tempPassword,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already')) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este email' },
          { status: 400 }
        )
      }
      throw authError
    }

    // Crear entrada en tabla usuarios (usando adminClient para bypass RLS)
    const { error: usuarioError } = await adminClient
      .from('usuarios')
      .insert({
        id: authData.user.id,
        email: data.email,
        rol: 'alumno',
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: data.telefono,
      })

    if (usuarioError) {
      // Rollback: eliminar usuario de auth
      await adminClient.auth.admin.deleteUser(authData.user.id)
      throw usuarioError
    }

    // Crear alumno (usando adminClient para bypass RLS)
    const { data: alumno, error: alumnoError } = await adminClient
      .from('alumnos')
      .insert({
        user_id: authData.user.id,
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        telefono: data.telefono,
        rut: data.rut || null,
        nivel_actual: data.nivel_actual,
        horas_contratadas: data.horas_contratadas,
        horas_restantes: data.horas_contratadas,
        vendedor_id: user.id,
        bloqueado: false,
        fecha_inicio: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (alumnoError) {
      // Rollback
      await adminClient.auth.admin.deleteUser(authData.user.id)
      throw alumnoError
    }

    // Crear horarios (usando adminClient para bypass RLS)
    const horariosInsert = data.horarios.map(h => ({
      alumno_id: alumno.id,
      dia: h.dia,
      hora_inicio: h.hora_inicio,
      hora_fin: h.hora_fin,
      duracion_minutos: calcularDuracion(h.hora_inicio, h.hora_fin),
      activo: true,
    }))

    const { error: horariosError } = await adminClient
      .from('horarios_alumnos')
      .insert(horariosInsert)

    if (horariosError) {
      console.error('Error al crear horarios:', horariosError)
    }

    return NextResponse.json({
      alumno,
      tempPassword,
      message: 'Alumno creado exitosamente',
    })
  } catch (error) {
    console.error('Error al crear alumno:', error)
    return NextResponse.json(
      { error: 'Error al crear alumno' },
      { status: 500 }
    )
  }
}
