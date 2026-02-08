import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Obtener profesor
  const { data: profesor } = await supabase
    .from('profesores')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profesor) {
    return NextResponse.json({ error: 'Profesor no encontrado' }, { status: 404 })
  }

  const hoy = new Date().toISOString().split('T')[0]

  const { data: clases, error } = await supabase
    .from('clases')
    .select(`
      *,
      alumno:alumnos(nombre, apellido, nivel_actual, horas_restantes, telefono)
    `)
    .eq('profesor_id', profesor.id)
    .eq('fecha', hoy)
    .order('hora_inicio')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(clases)
}
