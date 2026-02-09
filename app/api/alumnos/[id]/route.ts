import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { actualizarAlumnoSchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: alumno, error } = await supabase
    .from('alumnos')
    .select(`
      *,
      horarios:horarios_alumnos(*),
      profesor:profesores(id, nombre, apellido, email, zoom_link)
    `)
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
  }

  return NextResponse.json(alumno)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Verificar que es admin
  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!userData || userData.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json()

  const validation = actualizarAlumnoSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0].message },
      { status: 400 }
    )
  }

  const { data: alumno, error } = await supabase
    .from('alumnos')
    .update({
      ...validation.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(alumno)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Verificar que es admin
  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!userData || userData.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    // Obtener el alumno para conseguir el user_id
    const { data: alumno, error: alumnoError } = await supabase
      .from('alumnos')
      .select('user_id')
      .eq('id', id)
      .single()

    if (alumnoError || !alumno) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
    }

    // Eliminar horarios_alumnos asociados
    const { error: deleteHorariosError } = await adminClient
      .from('horarios_alumnos')
      .delete()
      .eq('alumno_id', id)

    if (deleteHorariosError) {
      console.error('Error al eliminar horarios:', deleteHorariosError)
    }

    // Eliminar clases asociadas
    const { error: deleteClasesError } = await adminClient
      .from('clases')
      .delete()
      .eq('alumno_id', id)

    if (deleteClasesError) {
      console.error('Error al eliminar clases:', deleteClasesError)
    }

    // Eliminar registro de alumnos
    const { error: deleteAlumnoError } = await adminClient
      .from('alumnos')
      .delete()
      .eq('id', id)

    if (deleteAlumnoError) {
      throw deleteAlumnoError
    }

    // Eliminar registro de usuarios
    if (alumno.user_id) {
      const { error: deleteUsuarioError } = await adminClient
        .from('usuarios')
        .delete()
        .eq('id', alumno.user_id)

      if (deleteUsuarioError) {
        console.error('Error al eliminar usuario:', deleteUsuarioError)
      }

      // Eliminar usuario de Supabase Auth
      const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(alumno.user_id)

      if (deleteAuthError) {
        console.error('Error al eliminar usuario de Auth:', deleteAuthError)
      }
    }

    return NextResponse.json({ message: 'Alumno eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar alumno:', error)
    return NextResponse.json(
      { error: 'Error al eliminar alumno' },
      { status: 500 }
    )
  }
}
