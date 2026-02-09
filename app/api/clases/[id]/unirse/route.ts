import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Marca la clase como completada y descuenta horas al alumno
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
    // Obtener la clase
    const { data: clase, error: claseError } = await adminClient
      .from('clases')
      .select(`
        *,
        alumno:alumnos(id, user_id, horas_restantes)
      `)
      .eq('id', id)
      .single()

    if (claseError || !clase) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
    }

    const alumno = clase.alumno as { id: string; user_id: string; horas_restantes: number }

    // Verificar que el usuario es el alumno de esta clase
    if (alumno.user_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Verificar que la clase no está ya completada
    if (clase.estado === 'completada') {
      return NextResponse.json({
        success: true,
        mensaje: 'La clase ya fue marcada como completada',
        zoom_link: clase.zoom_link,
      })
    }

    // Verificar que es el día de la clase (con margen de 30 min antes)
    const ahora = new Date()
    const fechaClase = new Date(`${clase.fecha}T${clase.hora_inicio}`)
    const margenMinutos = 30
    fechaClase.setMinutes(fechaClase.getMinutes() - margenMinutos)

    const fechaFinClase = new Date(`${clase.fecha}T${clase.hora_fin}`)
    fechaFinClase.setMinutes(fechaFinClase.getMinutes() + 15) // 15 min después de terminar

    if (ahora < fechaClase) {
      return NextResponse.json({
        error: 'Aún no es hora de la clase',
        zoom_link: clase.zoom_link,
        puedeUnirse: false,
      }, { status: 400 })
    }

    if (ahora > fechaFinClase) {
      return NextResponse.json({
        error: 'La clase ya terminó',
        puedeUnirse: false,
      }, { status: 400 })
    }

    // Calcular horas a descontar
    const horasClase = clase.duracion_minutos / 60

    // Actualizar clase como completada
    const { error: updateClaseError } = await adminClient
      .from('clases')
      .update({
        estado: 'completada',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateClaseError) {
      throw updateClaseError
    }

    // Descontar horas al alumno
    const nuevasHoras = Math.max(0, alumno.horas_restantes - horasClase)
    const { error: updateAlumnoError } = await adminClient
      .from('alumnos')
      .update({
        horas_restantes: nuevasHoras,
        updated_at: new Date().toISOString(),
      })
      .eq('id', alumno.id)

    if (updateAlumnoError) {
      throw updateAlumnoError
    }

    return NextResponse.json({
      success: true,
      mensaje: 'Clase marcada como completada',
      zoom_link: clase.zoom_link,
      horasDescontadas: horasClase,
      horasRestantes: nuevasHoras,
    })
  } catch (error) {
    console.error('Error al unirse a clase:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
