import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: alertas, error } = await supabase
    .from('alertas')
    .select(`
      *,
      alumnos:alumno_id (
        id,
        nombre,
        apellido,
        horas_restantes
      )
    `)
    .eq('destinatario_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(alertas)
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { alerta_ids } = await request.json()

  if (!alerta_ids || !Array.isArray(alerta_ids)) {
    return NextResponse.json(
      { error: 'IDs de alertas requeridos' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('alertas')
    .update({ leida: true })
    .in('id', alerta_ids)
    .eq('destinatario_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Alertas marcadas como leídas' })
}
