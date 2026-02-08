import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { agregarHorasSchema } from '@/lib/validations'

export async function POST(
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
  const validation = agregarHorasSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0].message },
      { status: 400 }
    )
  }

  const { horas, motivo } = validation.data

  try {
    // Obtener alumno actual
    const { data: alumno, error: fetchError } = await supabase
      .from('alumnos')
      .select('horas_contratadas, horas_restantes')
      .eq('id', id)
      .single()

    if (fetchError || !alumno) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
    }

    // Actualizar horas
    const { error: updateError } = await adminClient
      .from('alumnos')
      .update({
        horas_contratadas: alumno.horas_contratadas + horas,
        horas_restantes: alumno.horas_restantes + horas,
      })
      .eq('id', id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      message: 'Horas agregadas exitosamente',
      horas_contratadas: alumno.horas_contratadas + horas,
      horas_restantes: alumno.horas_restantes + horas,
    })
  } catch (error) {
    console.error('Error al agregar horas:', error)
    return NextResponse.json(
      { error: 'Error al agregar horas' },
      { status: 500 }
    )
  }
}
