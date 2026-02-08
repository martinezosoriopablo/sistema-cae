import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { marcarClaseSchema } from '@/lib/validations'
import { UMBRAL_ALERTA_HORAS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Verificar que es profesor
  const { data: profesor } = await supabase
    .from('profesores')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profesor) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json()

  const validation = marcarClaseSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0].message },
      { status: 400 }
    )
  }

  const { clase_id, estado, notas_profesor } = validation.data

  try {
    // Obtener la clase
    const { data: clase, error: claseError } = await supabase
      .from('clases')
      .select('*, alumno:alumnos(*)')
      .eq('id', clase_id)
      .eq('profesor_id', profesor.id)
      .single()

    if (claseError || !clase) {
      return NextResponse.json(
        { error: 'Clase no encontrada' },
        { status: 404 }
      )
    }

    if (clase.estado !== 'programada') {
      return NextResponse.json(
        { error: 'Esta clase ya fue marcada' },
        { status: 400 }
      )
    }

    // Actualizar estado de la clase
    const { error: updateError } = await supabase
      .from('clases')
      .update({
        estado,
        notas_profesor,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clase_id)

    if (updateError) {
      throw updateError
    }

    // Descontar horas si corresponde (completada o no_asistio)
    if (estado === 'completada' || estado === 'no_asistio') {
      const horasADescontar = clase.duracion_minutos / 60
      const nuevasHoras = Math.max(0, clase.alumno.horas_restantes - horasADescontar)

      const { error: horasError } = await supabase
        .from('alumnos')
        .update({
          horas_restantes: nuevasHoras,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clase.alumno_id)

      if (horasError) {
        console.error('Error al descontar horas:', horasError)
      }

      // Crear alerta si quedan pocas horas
      if (nuevasHoras <= UMBRAL_ALERTA_HORAS && nuevasHoras > 0) {
        await supabase
          .from('alertas')
          .insert({
            alumno_id: clase.alumno_id,
            tipo: 'pocas_horas',
            mensaje: `El alumno ${clase.alumno.nombre} ${clase.alumno.apellido} tiene solo ${nuevasHoras} horas restantes`,
            destinatario_id: clase.alumno.vendedor_id,
            leida: false,
          })
      }
    }

    return NextResponse.json({
      message: 'Clase marcada exitosamente',
      estado,
    })
  } catch (error) {
    console.error('Error al marcar clase:', error)
    return NextResponse.json(
      { error: 'Error al marcar clase' },
      { status: 500 }
    )
  }
}
