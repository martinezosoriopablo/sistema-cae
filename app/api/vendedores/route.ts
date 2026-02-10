import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { nuevoVendedorSchema } from '@/lib/validations'
import { generateTempPassword } from '@/lib/auth-utils'
import { sendEmail, getWelcomeEmail } from '@/lib/email'

export async function GET() {
  const supabase = await createClient()

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

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('rol', 'vendedor')
    .order('nombre')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

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

  const body = await request.json()

  const validation = nuevoVendedorSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0].message },
      { status: 400 }
    )
  }

  const data = validation.data

  try {
    // Crear usuario en Supabase Auth
    const tempPassword = generateTempPassword()

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: tempPassword,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already')) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este email' },
          { status: 400 }
        )
      }
      throw authError
    }

    // Crear entrada en tabla usuarios (usando adminClient para bypass RLS)
    const { data: vendedor, error: usuarioError } = await adminClient
      .from('usuarios')
      .insert({
        id: authData.user.id,
        email: data.email,
        rol: 'vendedor',
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: data.telefono || null,
      })
      .select()
      .single()

    if (usuarioError) {
      await adminClient.auth.admin.deleteUser(authData.user.id)
      throw usuarioError
    }

    // Enviar email de bienvenida con credenciales
    const portalUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sistema-cae.onrender.com'
    sendEmail({
      to: data.email,
      subject: '¡Bienvenido a TalkChile! - Tus credenciales de acceso',
      html: getWelcomeEmail({
        nombre: data.nombre,
        email: data.email,
        password: tempPassword,
        rol: 'vendedor',
        portalUrl: `${portalUrl}/login`,
      }),
    }).catch(err => console.error('Error al enviar email de bienvenida:', err))

    return NextResponse.json({
      vendedor,
      tempPassword,
      message: 'Vendedor creado exitosamente',
    })
  } catch (error) {
    console.error('Error al crear vendedor:', error)
    return NextResponse.json(
      { error: 'Error al crear vendedor' },
      { status: 500 }
    )
  }
}
