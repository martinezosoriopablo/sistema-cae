import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { UMBRAL_ALERTA_HORAS } from '@/lib/constants'

// Este endpoint verifica alumnos con pocas horas y crea alertas
// Debe ejecutarse diariamente

export async function POST(request: NextRequest) {
  // Verificar CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()

  try {
    // Obtener alumnos con pocas horas que no tienen alerta reciente
    const { data: alumnos, error: alumnosError } = await supabase
      .from('alumnos')
      .select('id, nombre, apellido, horas_restantes, vendedor_id')
      .eq('bloqueado', false)
      .gt('horas_restantes', 0)
      .lte('horas_restantes', UMBRAL_ALERTA_HORAS)

    if (alumnosError) {
      throw alumnosError
    }

    const alertasCreadas = []

    for (const alumno of alumnos || []) {
      // Verificar si ya existe una alerta no leída para este alumno
      const { data: alertaExistente } = await supabase
        .from('alertas')
        .select('id')
        .eq('alumno_id', alumno.id)
        .eq('tipo', 'pocas_horas')
        .eq('leida', false)
        .single()

      if (!alertaExistente) {
        // Crear alerta para el vendedor
        const { error: alertaError } = await supabase
          .from('alertas')
          .insert({
            alumno_id: alumno.id,
            tipo: 'pocas_horas',
            mensaje: `El alumno ${alumno.nombre} ${alumno.apellido} tiene solo ${alumno.horas_restantes} horas restantes`,
            destinatario_id: alumno.vendedor_id,
            leida: false,
          })

        if (!alertaError) {
          alertasCreadas.push(alumno.id)
        }
      }
    }

    // También verificar alumnos sin profesor asignado
    const { data: alumnosSinProfesor } = await supabase
      .from('alumnos')
      .select('id, nombre, apellido, vendedor_id')
      .eq('bloqueado', false)
      .is('profesor_id', null)

    for (const alumno of alumnosSinProfesor || []) {
      const { data: alertaExistente } = await supabase
        .from('alertas')
        .select('id')
        .eq('alumno_id', alumno.id)
        .eq('tipo', 'sin_profesor')
        .eq('leida', false)
        .single()

      if (!alertaExistente) {
        await supabase
          .from('alertas')
          .insert({
            alumno_id: alumno.id,
            tipo: 'sin_profesor',
            mensaje: `El alumno ${alumno.nombre} ${alumno.apellido} no tiene profesor asignado`,
            destinatario_id: alumno.vendedor_id,
            leida: false,
          })
      }
    }

    return NextResponse.json({
      success: true,
      alertas_pocas_horas: alertasCreadas.length,
      alumnos_sin_profesor: alumnosSinProfesor?.length || 0,
    })
  } catch (error) {
    console.error('Error al verificar alertas:', error)
    return NextResponse.json(
      { error: 'Error al verificar alertas' },
      { status: 500 }
    )
  }
}
