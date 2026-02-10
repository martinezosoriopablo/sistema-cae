import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, getClassCancellationEmail } from '@/lib/email'
import { formatDate, formatTime } from '@/lib/utils'
import { HORAS_MINIMAS_CANCELACION } from '@/lib/constants'

// El alumno cancela una clase programada con anticipación
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

  try {
    // Obtener la clase con datos del alumno y profesor
    const { data: clase, error: claseError } = await adminClient
      .from('clases')
      .select(`
        *,
        alumno:alumnos(id, nombre, apellido, user_id),
        profesor:profesores(id, nombre, apellido, email)
      `)
      .eq('id', id)
      .single()

    if (claseError || !clase) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
    }

    const alumno = Array.isArray(clase.alumno) ? clase.alumno[0] : clase.alumno
    const profesor = Array.isArray(clase.profesor) ? clase.profesor[0] : clase.profesor

    // Verificar que el usuario es el alumno de esta clase
    if (!alumno || alumno.user_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Verificar que la clase está programada
    if (clase.estado !== 'programada') {
      return NextResponse.json({
        error: 'Solo se pueden cancelar clases programadas',
      }, { status: 400 })
    }

    // Verificar ventana de cancelación
    const ahora = new Date()
    const fechaClase = new Date(`${clase.fecha}T${clase.hora_inicio}`)
    const horasRestantes = (fechaClase.getTime() - ahora.getTime()) / (1000 * 60 * 60)

    if (horasRestantes < HORAS_MINIMAS_CANCELACION) {
      return NextResponse.json({
        error: `No puedes cancelar con menos de ${HORAS_MINIMAS_CANCELACION} horas de anticipación`,
        horasRestantes: Math.max(0, Math.floor(horasRestantes)),
        horasMinimas: HORAS_MINIMAS_CANCELACION,
      }, { status: 400 })
    }

    // Cancelar la clase
    const { error: updateError } = await adminClient
      .from('clases')
      .update({ estado: 'cancelada' })
      .eq('id', id)

    if (updateError) {
      throw updateError
    }

    // Enviar notificaciones por email
    const portalUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const alumnoNombre = `${alumno.nombre} ${alumno.apellido}`
    const fechaFormateada = formatDate(clase.fecha, "EEEE d 'de' MMMM")
    const horaInicioFormateada = formatTime(clase.hora_inicio)
    const horaFinFormateada = formatTime(clase.hora_fin)

    const emailsEnviados: string[] = []

    // Notificar al profesor
    if (profesor?.email) {
      const html = getClassCancellationEmail({
        destinatarioNombre: `${profesor.nombre} ${profesor.apellido}`,
        alumnoNombre,
        fecha: fechaFormateada,
        horaInicio: horaInicioFormateada,
        horaFin: horaFinFormateada,
        portalLink: `${portalUrl}/profesor/clases-hoy`,
      })

      const result = await sendEmail({
        to: profesor.email,
        subject: `Clase cancelada: ${alumnoNombre} - ${fechaFormateada}`,
        html,
      })

      if (result.success) emailsEnviados.push(profesor.email)
    }

    // Notificar a los admins
    const { data: admins } = await adminClient
      .from('usuarios')
      .select('id, email')
      .eq('rol', 'admin')

    if (admins) {
      for (const admin of admins) {
        // Obtener nombre del admin
        const html = getClassCancellationEmail({
          destinatarioNombre: 'Administrador',
          alumnoNombre,
          fecha: fechaFormateada,
          horaInicio: horaInicioFormateada,
          horaFin: horaFinFormateada,
          portalLink: `${portalUrl}/admin`,
        })

        const result = await sendEmail({
          to: admin.email,
          subject: `Clase cancelada: ${alumnoNombre} - ${fechaFormateada}`,
          html,
        })

        if (result.success) emailsEnviados.push(admin.email)
      }
    }

    return NextResponse.json({
      success: true,
      mensaje: 'Clase cancelada exitosamente',
      notificacionesEnviadas: emailsEnviados.length,
    })
  } catch (error) {
    console.error('Error al cancelar clase:', error)
    return NextResponse.json(
      { error: 'Error al procesar la cancelación' },
      { status: 500 }
    )
  }
}
