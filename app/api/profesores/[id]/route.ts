import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

  const { data: profesor, error } = await supabase
    .from('profesores')
    .select(`
      *,
      alumnos:alumnos(id, nombre, apellido, nivel_actual, horas_restantes)
    `)
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Profesor no encontrado' }, { status: 404 })
  }

  return NextResponse.json(profesor)
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

  const { data: profesor, error } = await supabase
    .from('profesores')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(profesor)
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
    // Obtener el profesor para conseguir el user_id
    const { data: profesor, error: profesorError } = await supabase
      .from('profesores')
      .select('user_id')
      .eq('id', id)
      .single()

    if (profesorError || !profesor) {
      return NextResponse.json({ error: 'Profesor no encontrado' }, { status: 404 })
    }

    // Verificar si tiene alumnos asignados
    const { data: alumnosAsignados } = await supabase
      .from('alumnos')
      .select('id')
      .eq('profesor_id', id)

    if (alumnosAsignados && alumnosAsignados.length > 0) {
      // Desasignar profesor de los alumnos
      const { error: desasignarError } = await adminClient
        .from('alumnos')
        .update({ profesor_id: null })
        .eq('profesor_id', id)

      if (desasignarError) {
        console.error('Error al desasignar alumnos:', desasignarError)
      }
    }

    // Eliminar clases del profesor
    const { error: deleteClasesError } = await adminClient
      .from('clases')
      .delete()
      .eq('profesor_id', id)

    if (deleteClasesError) {
      console.error('Error al eliminar clases:', deleteClasesError)
    }

    // Eliminar registro de profesores
    const { error: deleteProfesorError } = await adminClient
      .from('profesores')
      .delete()
      .eq('id', id)

    if (deleteProfesorError) {
      throw deleteProfesorError
    }

    // Eliminar registro de usuarios
    if (profesor.user_id) {
      const { error: deleteUsuarioError } = await adminClient
        .from('usuarios')
        .delete()
        .eq('id', profesor.user_id)

      if (deleteUsuarioError) {
        console.error('Error al eliminar usuario:', deleteUsuarioError)
      }

      // Eliminar usuario de Supabase Auth
      const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(profesor.user_id)

      if (deleteAuthError) {
        console.error('Error al eliminar usuario de Auth:', deleteAuthError)
      }
    }

    return NextResponse.json({ message: 'Profesor eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar profesor:', error)
    return NextResponse.json(
      { error: 'Error al eliminar profesor' },
      { status: 500 }
    )
  }
}
