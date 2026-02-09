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

  // Verificar que es admin
  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!userData || userData.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    // Verificar que el usuario a eliminar es vendedor
    const { data: vendedor, error: vendedorError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .eq('rol', 'vendedor')
      .single()

    if (vendedorError || !vendedor) {
      return NextResponse.json({ error: 'Vendedor no encontrado' }, { status: 404 })
    }

    // Eliminar registro de usuarios
    const { error: deleteUsuarioError } = await adminClient
      .from('usuarios')
      .delete()
      .eq('id', id)

    if (deleteUsuarioError) {
      throw deleteUsuarioError
    }

    // Eliminar usuario de Supabase Auth
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(id)

    if (deleteAuthError) {
      console.error('Error al eliminar usuario de Auth:', deleteAuthError)
      // Continuamos aunque falle la eliminación de Auth
    }

    return NextResponse.json({ message: 'Vendedor eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar vendedor:', error)
    return NextResponse.json(
      { error: 'Error al eliminar vendedor' },
      { status: 500 }
    )
  }
}
