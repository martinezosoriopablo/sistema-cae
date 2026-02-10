import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailRequest {
  to: string
  subject: string
  template: 'bienvenida' | 'asignacion_profesor' | 'pocas_horas' | 'clase_recordatorio'
  data: Record<string, string>
}

const templates: Record<string, (data: Record<string, string>) => string> = {
  bienvenida: (data) => `
    <h1>¡Bienvenido a TalkChile, ${data.nombre}!</h1>
    <p>Tu cuenta ha sido creada exitosamente.</p>
    <p>Credenciales de acceso:</p>
    <ul>
      <li>Email: ${data.email}</li>
      <li>Contraseña temporal: ${data.password}</li>
    </ul>
    <p>Por favor, cambia tu contraseña después de iniciar sesión.</p>
    <p>Accede a tu cuenta en: ${data.appUrl}</p>
    <p>Saludos,<br>Equipo TalkChile</p>
  `,
  asignacion_profesor: (data) => `
    <h1>¡Profesor Asignado!</h1>
    <p>Hola ${data.alumnoNombre},</p>
    <p>Te informamos que tu profesor de inglés ha sido asignado:</p>
    <p><strong>${data.profesorNombre}</strong></p>
    <p>Puedes ver tus horarios y acceder a tus clases desde tu dashboard.</p>
    <p>Saludos,<br>Equipo TalkChile</p>
  `,
  pocas_horas: (data) => `
    <h1>Aviso: Pocas Horas Restantes</h1>
    <p>Hola ${data.nombre},</p>
    <p>Te informamos que te quedan <strong>${data.horasRestantes} horas</strong> de clase.</p>
    <p>Contacta a tu vendedor para renovar tu paquete de horas y continuar aprendiendo.</p>
    <p>Saludos,<br>Equipo TalkChile</p>
  `,
  clase_recordatorio: (data) => `
    <h1>Recordatorio de Clase</h1>
    <p>Hola ${data.nombre},</p>
    <p>Te recordamos que tienes una clase programada:</p>
    <ul>
      <li>Fecha: ${data.fecha}</li>
      <li>Hora: ${data.hora}</li>
      <li>Profesor: ${data.profesor}</li>
    </ul>
    <p>Accede a tu sala de Zoom desde tu dashboard.</p>
    <p>Saludos,<br>Equipo TalkChile</p>
  `,
}

export async function POST(request: NextRequest) {
  // Verificar autorización (cron o usuario admin autenticado)
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

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Servicio de email no configurado' },
      { status: 503 }
    )
  }

  const body: EmailRequest = await request.json()
  const { to, subject, template, data } = body

  if (!to || !subject || !template || !data) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos' },
      { status: 400 }
    )
  }

  const templateFn = templates[template]
  if (!templateFn) {
    return NextResponse.json(
      { error: 'Template no encontrado' },
      { status: 400 }
    )
  }

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'TalkChile <noreply@talkchile.cl>',
      to,
      subject,
      html: templateFn(data),
    })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, id: emailData?.id })
  } catch (error) {
    console.error('Error al enviar email:', error)
    return NextResponse.json(
      { error: 'Error al enviar email' },
      { status: 500 }
    )
  }
}
