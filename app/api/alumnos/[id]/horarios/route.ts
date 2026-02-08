import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { actualizarHorariosSchema } from '@/lib/validations'
import { calcularDuracion } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: horarios, error } = await supabase
    .from('horarios_alumnos')
    .select('*')
    .eq('alumno_id', id)
    .eq('activo', true)
    .order('dia')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(horarios)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

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

  // Validar datos
  const validation = actualizarHorariosSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0].message },
      { status: 400 }
    )
  }

  const { horarios } = validation.data

  try {
    // Desactivar todos los horarios existentes
    await adminClient
      .from('horarios_alumnos')
      .update({ activo: false })
      .eq('alumno_id', id)

    // Crear nuevos horarios
    const horariosInsert = horarios.map(h => ({
      alumno_id: id,
      dia: h.dia,
      hora_inicio: h.hora_inicio,
      hora_fin: h.hora_fin,
      duracion_minutos: calcularDuracion(h.hora_inicio, h.hora_fin),
      activo: true,
    }))

    const { error: insertError } = await adminClient
      .from('horarios_alumnos')
      .insert(horariosInsert)

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({ message: 'Horarios actualizados exitosamente' })
  } catch (error) {
    console.error('Error al actualizar horarios:', error)
    return NextResponse.json(
      { error: 'Error al actualizar horarios' },
      { status: 500 }
    )
  }
}
