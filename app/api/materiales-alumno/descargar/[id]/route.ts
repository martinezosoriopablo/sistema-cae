import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Obtener el material
  const { data: material, error: fetchError } = await adminClient
    .from('materiales_alumno')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !material) {
    return NextResponse.json({ error: 'Material no encontrado' }, { status: 404 })
  }

  if (!material.es_archivo) {
    return NextResponse.json({ error: 'Este material no es un archivo' }, { status: 400 })
  }

  // Verificar permisos
  if (userData.rol === 'profesor') {
    const { data: profesor } = await supabase
      .from('profesores')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profesor || profesor.id !== material.profesor_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
  } else if (userData.rol === 'alumno') {
    const { data: alumno } = await supabase
      .from('alumnos')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!alumno || alumno.id !== material.alumno_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
  } else if (userData.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Generar signed URL (1 hora)
  const { data: signedUrl, error: signError } = await adminClient.storage
    .from('materiales-alumnos')
    .createSignedUrl(material.url, 3600)

  if (signError || !signedUrl) {
    console.error('Error al generar signed URL:', signError)
    return NextResponse.json({ error: 'Error al generar enlace de descarga' }, { status: 500 })
  }

  return NextResponse.json({ url: signedUrl.signedUrl })
}
