import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nivel: string }> }
) {
  const supabase = await createClient()
  const { nivel } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: materiales, error } = await supabase
    .from('materiales')
    .select('*')
    .eq('nivel', nivel.toUpperCase())
    .order('titulo')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(materiales)
}
