import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, getClassReminderEmail } from '@/lib/email'
import { formatDate, formatTime } from '@/lib/utils'

// Este endpoint debe ser llamado cada minuto por un servicio de cron externo
// Por ejemplo: Vercel Cron, Railway Cron, o cron-job.org
export async function GET(request: NextRequest) {
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
    // Buscar clases que empiezan en exactamente 10 minutos
    const en10Min = new Date(ahora.getTime() + 10 * 60 * 1000)

    const fechaHoy = ahora.toISOString().split('T')[0]
    const horaObjetivo = `${String(en10Min.getHours()).padStart(2, '0')}:${String(en10Min.getMinutes()).padStart(2, '0')}`

    // Buscar clases programadas para los próximos 10 minutos
    const { data: clases, error } = await adminClient
      .from('clases')
      .select(`
        *,
        alumno:alumnos(id, nombre, apellido, email, user_id),
        profesor:profesores(nombre, apellido, zoom_link)
      `)
      .eq('fecha', fechaHoy)
      .eq('hora_inicio', horaObjetivo)
      .eq('estado', 'programada')

    if (error) {
      throw error
    }

    const emailsEnviados: string[] = []
    const errores: string[] = []

    for (const clase of clases || []) {
      const alumno = clase.alumno as { nombre: string; apellido: string; email: string }
      const profesor = clase.profesor as { nombre: string; apellido: string; zoom_link: string }

      if (!alumno?.email || !profesor?.zoom_link) {
        errores.push(`Clase ${clase.id}: Falta email o zoom link`)
        continue
      }

      const portalUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

      const html = getClassReminderEmail({
        alumnoNombre: `${alumno.nombre} ${alumno.apellido}`,
        profesorNombre: `${profesor.nombre} ${profesor.apellido}`,
        fecha: formatDate(clase.fecha, "EEEE d 'de' MMMM 'de' yyyy"),
        horaInicio: formatTime(clase.hora_inicio),
        horaFin: formatTime(clase.hora_fin),
        zoomLink: profesor.zoom_link,
        portalLink: `${portalUrl}/alumno/mi-clase`,
      })

      const result = await sendEmail({
        to: alumno.email,
        subject: '¡Tu clase de inglés comienza en 10 minutos!',
        html,
      })

      if (result.success) {
        emailsEnviados.push(alumno.email)
      } else {
        errores.push(`${alumno.email}: ${result.error}`)
      }
    }

    return NextResponse.json({
      success: true,
      clasesEncontradas: clases?.length || 0,
      emailsEnviados: emailsEnviados.length,
      errores: errores.length > 0 ? errores : undefined,
    })
  } catch (error) {
    console.error('Error en cron de recordatorios:', error)
    return NextResponse.json(
      { error: 'Error al procesar recordatorios' },
      { status: 500 }
    )
  }
}
