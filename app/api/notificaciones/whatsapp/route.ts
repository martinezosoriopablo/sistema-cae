import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

interface WhatsAppRequest {
  to: string
  template: 'bienvenida' | 'clase_recordatorio' | 'pocas_horas'
  data: Record<string, string>
}

const templates: Record<string, (data: Record<string, string>) => string> = {
  bienvenida: (data) =>
    `¡Bienvenido a TalkChile, ${data.nombre}! Tu cuenta ha sido creada. Accede en ${data.appUrl} con tu email y la contraseña temporal que te enviamos por correo.`,

  clase_recordatorio: (data) =>
    `Recordatorio: Tienes clase de inglés hoy a las ${data.hora} con ${data.profesor}. ¡Te esperamos!`,

  pocas_horas: (data) =>
    `Aviso TalkChile: Te quedan ${data.horasRestantes} horas de clase. Contacta a tu vendedor para renovar tu paquete.`,
}

export async function POST(request: NextRequest) {
  // Verificar configuración
  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_WHATSAPP_NUMBER
  ) {
    return NextResponse.json(
      { error: 'Servicio de WhatsApp no configurado' },
      { status: 503 }
    )
  }

  const body: WhatsAppRequest = await request.json()
  const { to, template, data } = body

  if (!to || !template || !data) {
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

  // Formatear número
  let phoneNumber = to.replace(/\D/g, '')
  if (!phoneNumber.startsWith('56') && phoneNumber.length === 9) {
    phoneNumber = '56' + phoneNumber
  }

  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    const message = await client.messages.create({
      body: templateFn(data),
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:+${phoneNumber}`,
    })

    return NextResponse.json({ success: true, sid: message.sid })
  } catch (error) {
    console.error('Error al enviar WhatsApp:', error)
    return NextResponse.json(
      { error: 'Error al enviar mensaje' },
      { status: 500 }
    )
  }
}
