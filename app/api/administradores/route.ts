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
    .select('rol, super_admin')
    .eq('id', user.id)
    .single()

  if (!userData || userData.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('rol', 'admin')
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

  // Verificar que es super admin
  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol, super_admin')
    .eq('id', user.id)
    .single()

  if (!userData || userData.rol !== 'admin' || !userData.super_admin) {
    return NextResponse.json({ error: 'Solo el super administrador puede crear otros administradores' }, { status: 403 })
  }

  const body = await request.json()

  // Reusar validación de vendedor (mismos campos: nombre, apellido, email, telefono)
  const validation = nuevoVendedorSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0].message },
      { status: 400 }
    )
  }

  const data = validation.data

  try {
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

    const { data: admin, error: usuarioError } = await adminClient
      .from('usuarios')
      .insert({
        id: authData.user.id,
        email: data.email,
        rol: 'admin',
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

    // Enviar email de bienvenida
    const portalUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sistema-cae.onrender.com'
    sendEmail({
      to: data.email,
      subject: '¡Bienvenido a TalkChile! - Tus credenciales de administrador',
      html: getWelcomeEmail({
        nombre: data.nombre,
        email: data.email,
        password: tempPassword,
        rol: 'admin',
        portalUrl: `${portalUrl}/login`,
      }),
    }).catch(err => console.error('Error al enviar email de bienvenida:', err))

    return NextResponse.json({
      admin,
      tempPassword,
      message: 'Administrador creado exitosamente',
    })
  } catch (error) {
    console.error('Error al crear administrador:', error)
    return NextResponse.json(
      { error: 'Error al crear administrador' },
      { status: 500 }
    )
  }
}
