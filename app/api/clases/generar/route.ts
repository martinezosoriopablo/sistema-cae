import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Genera clases para los próximos N días basado en los horarios de los alumnos
export async function POST(request: NextRequest) {
  const adminClient = createAdminClient()

  // Verificar autorización (puede ser cron o admin)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Si no es cron, verificar que sea admin
  if (authHeader !== `Bearer ${cronSecret}`) {
    const { data: { user } } = await adminClient.auth.getUser(
      request.headers.get('cookie')?.split('sb-')[1]?.split('=')[1] || ''
    )

    if (!user) {
      // Intentar obtener del body para llamadas internas
      const body = await request.json().catch(() => ({}))
      if (body.secret !== cronSecret) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }
    }
  }

  try {
    const body = await request.json().catch(() => ({}))
    const diasAGenerar = body.dias || 14 // Por defecto, generar para 2 semanas

    // Obtener todos los alumnos activos con sus horarios y profesor
    const { data: alumnos, error: alumnosError } = await adminClient
      .from('alumnos')
      .select(`
        id,
        nombre,
        apellido,
        profesor_id,
        horas_restantes,
        bloqueado,
        profesor:profesores(id, zoom_link),
        horarios:horarios_alumnos(dia, hora_inicio, hora_fin, duracion_minutos, activo)
      `)
      .eq('bloqueado', false)
      .gt('horas_restantes', 0)
      .not('profesor_id', 'is', null)

    if (alumnosError) {
      throw alumnosError
    }

    const diasSemana: Record<string, number> = {
      'domingo': 0,
      'lunes': 1,
      'martes': 2,
      'miercoles': 3,
      'jueves': 4,
      'viernes': 5,
      'sabado': 6,
    }

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const clasesACrear: any[] = []
    const clasesExistentes = new Set<string>()

    // Obtener clases ya existentes para evitar duplicados
    const fechaFin = new Date(hoy)
    fechaFin.setDate(fechaFin.getDate() + diasAGenerar)

    const { data: clasesActuales } = await adminClient
      .from('clases')
      .select('alumno_id, fecha, hora_inicio')
      .gte('fecha', hoy.toISOString().split('T')[0])
      .lte('fecha', fechaFin.toISOString().split('T')[0])

    clasesActuales?.forEach(clase => {
      clasesExistentes.add(`${clase.alumno_id}-${clase.fecha}-${clase.hora_inicio}`)
    })

    // Para cada alumno, generar clases según sus horarios
    for (const alumno of alumnos || []) {
      if (!alumno.horarios || !alumno.profesor) continue

      const horariosActivos = alumno.horarios.filter((h: any) => h.activo)
      // Supabase puede retornar relaciones como array o como objeto
      const profesorData = Array.isArray(alumno.profesor) ? alumno.profesor[0] : alumno.profesor
      const profesor = profesorData as { id: string; zoom_link: string | null }

      for (const horario of horariosActivos) {
        const diaNumero = diasSemana[horario.dia]

        // Encontrar las próximas ocurrencias de este día
        for (let i = 0; i < diasAGenerar; i++) {
          const fecha = new Date(hoy)
          fecha.setDate(fecha.getDate() + i)

          if (fecha.getDay() === diaNumero) {
            const fechaStr = fecha.toISOString().split('T')[0]
            const claveUnica = `${alumno.id}-${fechaStr}-${horario.hora_inicio}`

            // Solo crear si no existe
            if (!clasesExistentes.has(claveUnica)) {
              clasesACrear.push({
                alumno_id: alumno.id,
                profesor_id: profesor.id,
                fecha: fechaStr,
                hora_inicio: horario.hora_inicio,
                hora_fin: horario.hora_fin,
                duracion_minutos: horario.duracion_minutos || 60,
                estado: 'programada',
                zoom_link: profesor.zoom_link,
              })
              clasesExistentes.add(claveUnica)
            }
          }
        }
      }
    }

    // Insertar las nuevas clases
    if (clasesACrear.length > 0) {
      const { error: insertError } = await adminClient
        .from('clases')
        .insert(clasesACrear)

      if (insertError) {
        throw insertError
      }
    }

    return NextResponse.json({
      success: true,
      clasesCreadas: clasesACrear.length,
      mensaje: `Se crearon ${clasesACrear.length} clases para los próximos ${diasAGenerar} días`,
    })
  } catch (error) {
    console.error('Error al generar clases:', error)
    return NextResponse.json(
      { error: 'Error al generar clases' },
      { status: 500 }
    )
  }
}
