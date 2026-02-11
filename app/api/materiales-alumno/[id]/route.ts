import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(
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

  if (!userData || !['profesor', 'admin'].includes(userData.rol)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
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

  // Verificar permisos: profesor solo puede eliminar los suyos
  if (userData.rol === 'profesor') {
    const { data: profesor } = await supabase
      .from('profesores')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profesor || profesor.id !== material.profesor_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
  }

  try {
    // Si es archivo, eliminar de Storage
    if (material.es_archivo && material.url) {
      const { error: storageError } = await adminClient.storage
        .from('materiales-alumnos')
        .remove([material.url])

      if (storageError) {
        console.error('Error al eliminar archivo de Storage:', storageError)
      }
    }

    // Eliminar registro de BD
    const { error: deleteError } = await adminClient
      .from('materiales_alumno')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ message: 'Material eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar material:', error)
    return NextResponse.json({ error: 'Error al eliminar material' }, { status: 500 })
  }
}
