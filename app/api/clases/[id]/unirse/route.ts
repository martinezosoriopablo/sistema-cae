import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// El alumno se une a la clase: solo verifica acceso y devuelve el link de Zoom
// El descuento de horas lo hace el profesor al marcar la clase
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
    // Obtener la clase con datos del alumno
    const { data: clase, error: claseError } = await adminClient
      .from('clases')
      .select(`
        *,
        alumno:alumnos(id, user_id),
        profesor:profesores(nombre, apellido)
      `)
      .eq('id', id)
      .single()

    if (claseError || !clase) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
    }

    const alumno = clase.alumno as { id: string; user_id: string }

    // Verificar que el usuario es el alumno de esta clase
    if (alumno.user_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Verificar que la clase no fue cancelada
    if (clase.estado === 'cancelada') {
      return NextResponse.json({
        error: 'Esta clase fue cancelada',
        puedeUnirse: false,
      }, { status: 400 })
    }

    // Verificar ventana de tiempo (30 min antes a 15 min después de terminar)
    const ahora = new Date()
    const fechaClase = new Date(`${clase.fecha}T${clase.hora_inicio}`)
    fechaClase.setMinutes(fechaClase.getMinutes() - 30)

    const fechaFinClase = new Date(`${clase.fecha}T${clase.hora_fin}`)
    fechaFinClase.setMinutes(fechaFinClase.getMinutes() + 15)

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

    return NextResponse.json({
      success: true,
      zoom_link: clase.zoom_link,
      puedeUnirse: true,
      clase: {
        fecha: clase.fecha,
        hora_inicio: clase.hora_inicio,
        hora_fin: clase.hora_fin,
        estado: clase.estado,
      },
    })
  } catch (error) {
    console.error('Error al unirse a clase:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
