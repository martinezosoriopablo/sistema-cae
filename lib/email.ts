import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!resend) {
    console.log('Resend no configurado. Email no enviado:', { to, subject })
    return { success: false, error: 'Resend no configurado' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'TalkChile <onboarding@resend.dev>', // Cambiar a noreply@tudominio.cl cuando verifiques dominio
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Error enviando email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error enviando email:', error)
    return { success: false, error: 'Error desconocido' }
  }
}

export function getWelcomeEmail(params: {
  nombre: string
  email: string
  password: string
  rol: 'alumno' | 'profesor' | 'vendedor'
  portalUrl: string
}) {
  const { nombre, email, password, rol, portalUrl } = params

  const rolLabels = {
    alumno: 'Alumno',
    profesor: 'Profesor',
    vendedor: 'Vendedor',
  }

  const rolDescriptions = {
    alumno: 'Podrás ver tus clases programadas, unirte a las sesiones de Zoom y acceder a material de estudio.',
    profesor: 'Podrás ver tus clases del día, marcar asistencia y gestionar a tus alumnos.',
    vendedor: 'Podrás registrar nuevos alumnos y hacer seguimiento de sus horas.',
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0070f3; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0070f3; }
    .credentials p { margin: 8px 0; }
    .credentials .label { color: #666; font-size: 14px; }
    .credentials .value { font-family: monospace; font-size: 16px; font-weight: bold; color: #333; }
    .button { display: inline-block; background: #0070f3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Bienvenido a TalkChile!</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${nombre}</strong>,</p>

      <p>Tu cuenta de <strong>${rolLabels[rol]}</strong> ha sido creada exitosamente en nuestra plataforma.</p>

      <p>${rolDescriptions[rol]}</p>

      <div class="credentials">
        <p class="label">Email de acceso:</p>
        <p class="value">${email}</p>
        <p class="label" style="margin-top: 15px;">Contraseña temporal:</p>
        <p class="value">${password}</p>
      </div>

      <div class="warning">
        <strong>Importante:</strong> Por seguridad, te recomendamos cambiar tu contraseña después de iniciar sesión por primera vez.
      </div>

      <p style="text-align: center;">
        <a href="${portalUrl}" class="button">Iniciar Sesión</a>
      </p>
    </div>
    <div class="footer">
      <p><strong>TalkChile</strong> - Clases de Inglés</p>
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
`
}

export function getClassReminderEmail(params: {
  alumnoNombre: string
  profesorNombre: string
  fecha: string
  horaInicio: string
  horaFin: string
  zoomLink: string
  portalLink: string
}) {
  const { alumnoNombre, profesorNombre, fecha, horaInicio, horaFin, zoomLink, portalLink } = params

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0070f3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #0070f3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 10px 5px; font-weight: bold; }
    .button.zoom { background: #2D8CFF; }
    .info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Tu clase comienza pronto</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${alumnoNombre}</strong>,</p>

      <p>Te recordamos que tu clase de inglés comienza en <strong>10 minutos</strong>.</p>

      <div class="info">
        <p><strong>Fecha:</strong> ${fecha}</p>
        <p><strong>Horario:</strong> ${horaInicio} - ${horaFin}</p>
        <p><strong>Profesor:</strong> ${profesorNombre}</p>
      </div>

      <p style="text-align: center;">
        <a href="${zoomLink}" class="button zoom">Unirse por Zoom</a>
        <a href="${portalLink}" class="button">Ir al Portal</a>
      </p>

      <p style="color: #666; font-size: 14px;">
        Recuerda unirte a la clase desde el portal para que se registre tu asistencia y se descuenten las horas correctamente.
      </p>
    </div>
    <div class="footer">
      <p>TalkChile - Clases de Inglés</p>
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
`
}
