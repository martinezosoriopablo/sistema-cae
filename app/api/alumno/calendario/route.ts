import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateICSFile, generateClassEvents } from '@/lib/calendar'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    // Obtener datos del alumno
    const { data: alumno, error: alumnoError } = await supabase
      .from('alumnos')
      .select(`
        id,
        nombre,
        apellido,
        profesor:profesores(nombre, apellido, zoom_link)
      `)
      .eq('user_id', user.id)
      .single()

    if (alumnoError || !alumno) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
    }

    // Obtener todas las clases programadas del alumno
    const hoy = new Date().toISOString().split('T')[0]
    const { data: clases, error: clasesError } = await supabase
      .from('clases')
      .select('id, fecha, hora_inicio, hora_fin, zoom_link')
      .eq('alumno_id', alumno.id)
      .eq('estado', 'programada')
      .gte('fecha', hoy)
      .order('fecha')
      .order('hora_inicio')

    if (clasesError) {
      throw clasesError
    }

    if (!clases || clases.length === 0) {
      return NextResponse.json({
        error: 'No hay clases programadas para exportar'
      }, { status: 404 })
    }

    // Agregar información del profesor a cada clase
    const clasesConProfesor = clases.map(clase => ({
      ...clase,
      profesor: alumno.profesor as { nombre: string; apellido: string } | null,
      zoom_link: clase.zoom_link || (alumno.profesor as any)?.zoom_link || null,
    }))

    // Generar eventos
    const events = generateClassEvents(clasesConProfesor)

    // Generar archivo ICS
    const icsContent = generateICSFile(
      events,
      `Clases de Inglés - ${alumno.nombre} ${alumno.apellido}`
    )

    // Retornar como archivo descargable
    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="clases-talkchile-${alumno.nombre.toLowerCase()}.ics"`,
      },
    })
  } catch (error) {
    console.error('Error al generar calendario:', error)
    return NextResponse.json(
      { error: 'Error al generar calendario' },
      { status: 500 }
    )
  }
}
