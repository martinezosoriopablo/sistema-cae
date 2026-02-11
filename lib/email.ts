import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!resend) {
    console.warn('Resend no configurado. Email no enviado:', { to, subject })
    return { success: false, error: 'Resend no configurado' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'LiveMode TalkChile <livemode@talkchile.cl>',
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
  rol: 'alumno' | 'profesor' | 'vendedor' | 'admin'
  portalUrl: string
}) {
  const { nombre, email, password, rol, portalUrl } = params

  const rolLabels = {
    alumno: 'Alumno',
    profesor: 'Profesor',
    vendedor: 'Vendedor',
    admin: 'Administrador',
  }

  const rolDescriptions = {
    alumno: 'Podrás ver tus clases programadas, unirte a las sesiones de Zoom y acceder a material de estudio.',
    profesor: 'Podrás ver tus clases del día, marcar asistencia y gestionar a tus alumnos.',
    vendedor: 'Podrás registrar nuevos alumnos y hacer seguimiento de sus horas.',
    admin: 'Tendrás acceso completo al sistema: gestión de alumnos, profesores, vendedores, horarios y reportes.',
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

export function getWelcomeAlumnoEmail(params: {
  nombre: string
  email: string
  password: string
  modalidad: string
  nivelActual: string
  horasContratadas: number
  portalUrl: string
}) {
  const { nombre, email, password, modalidad, nivelActual, horasContratadas, portalUrl } = params

  const modalidadLabels: Record<string, string> = {
    privado: 'Privado',
    livemode: 'LiveMode',
    kids: 'Kids',
    presencial: 'Presencial Privado',
    espanol: 'Español',
    nativo: 'Nativo',
  }

  const esPresencial = modalidad === 'presencial'
  const modalidadLabel = modalidadLabels[modalidad] || 'Privado'

  const introTexto = esPresencial
    ? `Nuestro centro académico de capacitación en idiomas TalkChile, te da la más cordial bienvenida a tu curso de inglés privado en su modalidad presencial en el cual lograrás desarrollar o ampliar el dominio del idioma inglés a través de clases guiadas 100% sincrónicas y personalizadas con el apoyo de una plataforma dinámica y divertida.`
    : `Nuestro centro académico de capacitación en idiomas TalkChile, te da la más cordial bienvenida a tu curso de inglés privado ${modalidadLabel} en el cual lograrás desarrollar o ampliar el dominio del idioma inglés a través de clases guiadas 100% sincrónicas y personalizadas, con el apoyo de una plataforma dinámica y divertida.`

  const ubicacion = esPresencial
    ? `<p><strong>Ubicación:</strong> Por confirmar con tu asesor académico</p>`
    : `<p><strong>Ubicación:</strong> Online (el link de Zoom será compartido por tu profesor)</p>`

  const grabacionClases = esPresencial ? '' : `
      <h3 style="color: #0070f3; margin-top: 20px;">Grabación de clases</h3>
      <p>Las clases online serán grabadas con el objetivo de dejar respaldo para los alumnos y profesores, mejorar la seguridad, metodología y calidad de las clases. Todo el contenido grabado es de uso exclusivo de TalkChile, no será difundido a través de ningún medio.</p>`

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
    .header p { margin: 5px 0 0; font-size: 14px; opacity: 0.9; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0070f3; }
    .credentials p { margin: 8px 0; }
    .credentials .label { color: #666; font-size: 14px; }
    .credentials .value { font-family: monospace; font-size: 16px; font-weight: bold; color: #333; }
    .course-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .course-info p { margin: 8px 0; }
    .policies { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
    .policies h3 { color: #0070f3; margin-top: 15px; margin-bottom: 8px; font-size: 15px; }
    .policies p { margin: 6px 0; }
    .button { display: inline-block; background: #0070f3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Bienvenido a TalkChile!</h1>
      <p>Curso ${modalidadLabel}</p>
    </div>
    <div class="content">
      <p>Hola <strong>${nombre}</strong>,</p>

      <p>${introTexto}</p>

      <div class="course-info">
        <h3 style="margin-top: 0; color: #0070f3;">Detalles de tu curso</h3>
        <p><strong>Modalidad:</strong> ${modalidadLabel}</p>
        <p><strong>Nivel de inicio:</strong> ${nivelActual}</p>
        <p><strong>Horas contratadas:</strong> ${horasContratadas}h</p>
        ${ubicacion}
        <p><strong>Profesor:</strong> Por asignar</p>
        <p><strong>Horario:</strong> Según tu horario registrado</p>
        <p style="font-size: 13px; color: #666; margin-top: 12px;">
          <em>Por protocolo, en su primera clase el profesor conocerá al alumno, diagnosticará y confirmará su nivel actual a través de una breve introducción.</em>
        </p>
      </div>

      <p><strong>Importante:</strong> El uso de la plataforma de estudio será activada el primer día de clases por tu profesor.</p>

      <div class="credentials">
        <h3 style="margin-top: 0; color: #0070f3;">Tus credenciales de acceso</h3>
        <p class="label">Email de acceso:</p>
        <p class="value">${email}</p>
        <p class="label" style="margin-top: 15px;">Contraseña temporal:</p>
        <p class="value">${password}</p>
      </div>

      <div class="warning">
        <strong>Importante:</strong> Por seguridad, te recomendamos cambiar tu contraseña después de iniciar sesión por primera vez.
      </div>

      <p style="text-align: center;">
        <a href="${portalUrl}" class="button">Iniciar Sesión en el Portal</a>
      </p>

      <div class="policies">
        <h3>Políticas de Cancelación</h3>
        <p>Puedes cancelar hasta 8 horas antes para no perder la clase, enviando un correo a <strong>livemode@talkchile.cl</strong>, siempre con copia al profesor/a a cargo del curso y asesor/a académico/a. Si la cancelación se realiza posterior a las 8 horas se descontará automáticamente de tu curso.</p>
        <p>Tope de cancelación: máximo de 6 clases por cada nivel de estudio. Posterior a esto cualquier cancelación debe ser descontada, salvo justificación por circunstancias de fuerza mayor. Se excluyen los días que corresponden a interferiados, feriados o fines de semanas largos, en estos periodos no se realizarán clases.</p>

        <h3>Suspensiones por más de 1 mes</h3>
        <p>La suspensión superior a un mes libera al profesor del horario comprometido. Sin embargo, podrá revisar a su retorno la disponibilidad y acordar nuevos horarios que le acomoden a ambas partes. En caso de no haber, tendremos que buscar un nuevo profesor. Solo le pedimos avisarnos 1 semana antes para coordinarlo.</p>

        <h3>Reemplazo de Profesor</h3>
        <p>En caso de vacaciones, licencia médicas o razones de fuerza mayor, el alumno tiene la opción de tener profesor de reemplazo durante este periodo si lo estima conveniente o de lo contrario, puede suspender y reagendar las clases con su profesor titular.</p>

        <h3>Tiempo de espera</h3>
        <p>El profesor esperará un máximo de 15 minutos para que el alumno se ${esPresencial ? 'presente' : 'conecte a la clase en vivo'}. (Si no se presenta la clase se descuenta).</p>
        ${grabacionClases}
      </div>

      <p style="text-align: center; font-size: 16px; color: #0070f3; font-weight: bold;">
        ¡¡¡Mucha suerte y bienvenid@!!!
      </p>
    </div>
    <div class="footer">
      <p><strong>LiveMode TalkChile</strong></p>
      <p>Customer And Academic Service</p>
      <p>Cruz del Sur 0180, Las Condes</p>
      <p><a href="http://www.talkchile.cl" style="color: #0070f3;">www.talkchile.cl</a></p>
      <p style="margin-top: 10px;">Este es un correo automático, por favor no respondas a este mensaje.</p>
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
        Recuerda conectarte a tiempo. Tu profesor registrará la asistencia al finalizar la clase.
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

export function getUnmarkedClassesReminderEmail(params: {
  profesorNombre: string
  clases: { alumnoNombre: string; fecha: string; horaInicio: string; horaFin: string }[]
  portalLink: string
}) {
  const { profesorNombre, clases, portalLink } = params

  const clasesHtml = clases.map(c => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${c.alumnoNombre}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${c.fecha}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${c.horaInicio} - ${c.horaFin}</td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #0070f3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 10px 0; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background: #f0f0f0; padding: 10px 12px; text-align: left; font-size: 14px; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Clases pendientes de marcar</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${profesorNombre}</strong>,</p>

      <p>Tienes <strong>${clases.length} clase${clases.length > 1 ? 's' : ''}</strong> que ya finalizaron pero aun no han sido marcadas. Por favor, registra la asistencia para que las horas de los alumnos se actualicen correctamente.</p>

      <table>
        <thead>
          <tr>
            <th>Alumno</th>
            <th>Fecha</th>
            <th>Horario</th>
          </tr>
        </thead>
        <tbody>
          ${clasesHtml}
        </tbody>
      </table>

      <p style="text-align: center;">
        <a href="${portalLink}" class="button">Marcar Clases</a>
      </p>
    </div>
    <div class="footer">
      <p>TalkChile - Clases de Ingles</p>
      <p>Este es un correo automatico, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
`
}

export function getClassCancellationEmail(params: {
  destinatarioNombre: string
  alumnoNombre: string
  fecha: string
  horaInicio: string
  horaFin: string
  portalLink: string
}) {
  const { destinatarioNombre, alumnoNombre, fecha, horaInicio, horaFin, portalLink } = params

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
    .info p { margin: 8px 0; }
    .button { display: inline-block; background: #0070f3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 10px 0; font-weight: bold; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Clase Cancelada</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${destinatarioNombre}</strong>,</p>

      <p>El alumno <strong>${alumnoNombre}</strong> ha cancelado la siguiente clase:</p>

      <div class="info">
        <p><strong>Fecha:</strong> ${fecha}</p>
        <p><strong>Horario:</strong> ${horaInicio} - ${horaFin}</p>
        <p><strong>Alumno:</strong> ${alumnoNombre}</p>
      </div>

      <p>Este horario queda disponible. No se descontaron horas al alumno por cancelar con anticipacion.</p>

      <p style="text-align: center;">
        <a href="${portalLink}" class="button">Ir al Portal</a>
      </p>
    </div>
    <div class="footer">
      <p>TalkChile - Clases de Ingles</p>
      <p>Este es un correo automatico, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
`
}
