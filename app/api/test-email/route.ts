import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, getClassReminderEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }

    const html = getClassReminderEmail({
      alumnoNombre: 'Usuario de Prueba',
      profesorNombre: 'Prof. Demo',
      fecha: 'Lunes 10 de Febrero de 2026',
      horaInicio: '09:00',
      horaFin: '10:00',
      zoomLink: 'https://zoom.us/j/123456789',
      portalLink: 'http://localhost:3001/alumno/mi-clase',
    })

    const result = await sendEmail({
      to: email,
      subject: '[PRUEBA] Tu clase de inglés comienza en 10 minutos',
      html,
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Email enviado a ${email}`,
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error en test-email:', error)
    return NextResponse.json(
      { error: 'Error al enviar email' },
      { status: 500 }
    )
  }
}
