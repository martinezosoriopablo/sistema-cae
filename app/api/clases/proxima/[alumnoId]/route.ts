import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ alumnoId: string }> }
) {
  const supabase = await createClient()
  const { alumnoId } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const hoy = new Date().toISOString().split('T')[0]

  const { data: clase, error } = await supabase
    .from('clases')
    .select(`
      *,
      profesor:profesores(nombre, apellido, zoom_link)
    `)
    .eq('alumno_id', alumnoId)
    .eq('estado', 'programada')
    .gte('fecha', hoy)
    .order('fecha')
    .order('hora_inicio')
    .limit(1)
    .single()

  if (error) {
    return NextResponse.json({ clase: null })
  }

  return NextResponse.json({ clase })
}
