import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, getUnmarkedClassesReminderEmail } from '@/lib/email'
import { formatDate, formatTime } from '@/lib/utils'

// Busca clases que ya terminaron pero siguen en estado "programada"
// y envía un recordatorio al profesor para que las marque.
// Ejecutar cada hora (o según se configure en vercel.json)

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (authHeader !== `Bearer ${cronSecret}`) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (!userData || userData.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
  }

  const adminClient = createAdminClient()

  try {
    const ahora = new Date()
    const fechaHoy = ahora.toISOString().split('T')[0]
    const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`

    // Buscar clases de los últimos 7 días que siguen como "programada"
    const hace7Dias = new Date(ahora)
    hace7Dias.setDate(hace7Dias.getDate() - 7)
    const fechaDesde = hace7Dias.toISOString().split('T')[0]

    const { data: clasesNoMarcadas, error } = await adminClient
      .from('clases')
      .select(`
        id,
        fecha,
        hora_inicio,
        hora_fin,
        profesor_id,
        alumno:alumnos(nombre, apellido),
        profesor:profesores(nombre, apellido, email, user_id)
      `)
      .gte('fecha', fechaDesde)
      .lte('fecha', fechaHoy)
      .eq('estado', 'programada')

    if (error) {
      throw error
    }

    // Filtrar: para clases de hoy, solo incluir las que ya terminaron
    const clasesNoMarcadasFiltradas = (clasesNoMarcadas || []).filter(clase => {
      if (clase.fecha === fechaHoy) {
        return clase.hora_fin < horaActual
      }
      return true // Clases de días anteriores siempre se incluyen
    })

    if (clasesNoMarcadasFiltradas.length === 0) {
      return NextResponse.json({
        success: true,
        mensaje: 'No hay clases pendientes de marcar',
        recordatoriosEnviados: 0,
      })
    }

    // Agrupar clases por profesor
    const clasesPorProfesor = new Map<string, {
      profesor: { nombre: string; apellido: string; email: string }
      clases: { alumnoNombre: string; fecha: string; horaInicio: string; horaFin: string }[]
    }>()

    for (const clase of clasesNoMarcadasFiltradas) {
      const profesor = Array.isArray(clase.profesor) ? clase.profesor[0] : clase.profesor
      const alumno = Array.isArray(clase.alumno) ? clase.alumno[0] : clase.alumno

      if (!profesor?.email || !alumno) continue

      const key = clase.profesor_id

      if (!clasesPorProfesor.has(key)) {
        clasesPorProfesor.set(key, {
          profesor: { nombre: profesor.nombre, apellido: profesor.apellido, email: profesor.email },
          clases: [],
        })
      }

      clasesPorProfesor.get(key)!.clases.push({
        alumnoNombre: `${alumno.nombre} ${alumno.apellido}`,
        fecha: formatDate(clase.fecha, "EEEE d 'de' MMMM"),
        horaInicio: formatTime(clase.hora_inicio),
        horaFin: formatTime(clase.hora_fin),
      })
    }

    // Enviar email a cada profesor
    const portalUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const emailsEnviados: string[] = []
    const errores: string[] = []

    for (const [, { profesor, clases }] of clasesPorProfesor) {
      const html = getUnmarkedClassesReminderEmail({
        profesorNombre: `${profesor.nombre} ${profesor.apellido}`,
        clases,
        portalLink: `${portalUrl}/profesor/clases-hoy`,
      })

      const result = await sendEmail({
        to: profesor.email,
        subject: `Tienes ${clases.length} clase${clases.length > 1 ? 's' : ''} pendiente${clases.length > 1 ? 's' : ''} de marcar`,
        html,
      })

      if (result.success) {
        emailsEnviados.push(profesor.email)
      } else {
        errores.push(`${profesor.email}: ${result.error}`)
      }
    }

    return NextResponse.json({
      success: true,
      clasesNoMarcadas: clasesNoMarcadasFiltradas.length,
      profesoresNotificados: emailsEnviados.length,
      recordatoriosEnviados: emailsEnviados.length,
      errores: errores.length > 0 ? errores : undefined,
    })
  } catch (error) {
    console.error('Error en cron de clases sin marcar:', error)
    return NextResponse.json(
      { error: 'Error al procesar clases sin marcar' },
      { status: 500 }
    )
  }
}
