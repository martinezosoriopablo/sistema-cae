import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDiaSemana, calcularDuracion } from '@/lib/utils'

// Este endpoint genera las clases de la semana basado en los horarios regulares
// Debe ejecutarse semanalmente (ej: domingo a las 00:00)

export async function POST(request: NextRequest) {
  // Verificar CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()

  try {
    // Obtener todos los alumnos activos con sus horarios y profesor
    const { data: alumnos, error: alumnosError } = await supabase
      .from('alumnos')
      .select(`
        id,
        profesor_id,
        horas_restantes,
        horarios:horarios_alumnos(dia, hora_inicio, hora_fin, duracion_minutos, activo)
      `)
      .eq('bloqueado', false)
      .gt('horas_restantes', 0)
      .not('profesor_id', 'is', null)

    if (alumnosError) {
      throw alumnosError
    }

    // Generar clases para los próximos 7 días
    const hoy = new Date()
    const clasesACrear = []

    for (let dia = 0; dia < 7; dia++) {
      const fecha = new Date(hoy)
      fecha.setDate(fecha.getDate() + dia)
      const diaSemana = getDiaSemana(fecha)
      const fechaStr = fecha.toISOString().split('T')[0]

      for (const alumno of alumnos || []) {
        // Buscar si tiene clase programada para este día
        const horarioDia = alumno.horarios?.find(
          (h: any) => h.dia === diaSemana && h.activo
        )

        if (horarioDia) {
          // Verificar si ya existe una clase para esta fecha y alumno
          const { data: claseExistente } = await supabase
            .from('clases')
            .select('id')
            .eq('alumno_id', alumno.id)
            .eq('fecha', fechaStr)
            .single()

          if (!claseExistente) {
            clasesACrear.push({
              alumno_id: alumno.id,
              profesor_id: alumno.profesor_id,
              fecha: fechaStr,
              hora_inicio: horarioDia.hora_inicio,
              hora_fin: horarioDia.hora_fin,
              duracion_minutos: horarioDia.duracion_minutos || calcularDuracion(horarioDia.hora_inicio, horarioDia.hora_fin),
              estado: 'programada',
            })
          }
        }
      }
    }

    // Insertar clases en batch
    if (clasesACrear.length > 0) {
      const { error: insertError } = await supabase
        .from('clases')
        .insert(clasesACrear)

      if (insertError) {
        throw insertError
      }
    }

    return NextResponse.json({
      success: true,
      clases_creadas: clasesACrear.length,
    })
  } catch (error) {
    console.error('Error al generar clases:', error)
    return NextResponse.json(
      { error: 'Error al generar clases' },
      { status: 500 }
    )
  }
}
