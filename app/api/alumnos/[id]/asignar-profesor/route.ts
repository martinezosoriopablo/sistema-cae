import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  const { profesor_id } = await request.json()

  if (!profesor_id) {
    return NextResponse.json(
      { error: 'ID de profesor requerido' },
      { status: 400 }
    )
  }

  // Verificar que el profesor existe
  const { data: profesor } = await supabase
    .from('profesores')
    .select('id, nombre, apellido')
    .eq('id', profesor_id)
    .single()

  if (!profesor) {
    return NextResponse.json(
      { error: 'Profesor no encontrado' },
      { status: 404 }
    )
  }

  const { data: alumno, error } = await supabase
    .from('alumnos')
    .update({
      profesor_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    alumno,
    mensaje: `Profesor ${profesor.nombre} ${profesor.apellido} asignado exitosamente`,
  })
}
