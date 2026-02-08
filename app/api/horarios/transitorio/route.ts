import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cambioTransitorioSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

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

  const validation = cambioTransitorioSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0].message },
      { status: 400 }
    )
  }

  const { alumno_id, fecha_original, fecha_nueva, hora_nueva, motivo } = validation.data

  try {
    // Crear registro de cambio transitorio
    const { data: cambio, error: cambioError } = await supabase
      .from('cambios_transitorios')
      .insert({
        alumno_id,
        fecha_original,
        fecha_nueva,
        hora_nueva,
        motivo,
        aprobado_por: user.id,
      })
      .select()
      .single()

    if (cambioError) {
      throw cambioError
    }

    // Actualizar la clase si existe
    const { data: claseExistente } = await supabase
      .from('clases')
      .select('id')
      .eq('alumno_id', alumno_id)
      .eq('fecha', fecha_original)
      .single()

    if (claseExistente) {
      await supabase
        .from('clases')
        .update({
          fecha: fecha_nueva,
          hora_inicio: hora_nueva,
        })
        .eq('id', claseExistente.id)
    }

    return NextResponse.json({
      cambio,
      message: 'Cambio transitorio registrado exitosamente',
    })
  } catch (error) {
    console.error('Error al crear cambio transitorio:', error)
    return NextResponse.json(
      { error: 'Error al crear cambio transitorio' },
      { status: 500 }
    )
  }
}
