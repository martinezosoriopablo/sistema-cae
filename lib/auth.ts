import { createClient } from '@/lib/supabase/server'
import { Rol } from '@/types'
import { redirect } from 'next/navigation'
import { RUTAS_POR_ROL } from './constants'

export interface UserSession {
  id: string
  email: string
  rol: Rol
  nombre: string
  apellido: string
}

export async function getSession(): Promise<UserSession | null> {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  // Obtener datos adicionales del usuario desde la tabla usuarios
  const { data: userData, error: userError } = await supabase
    .from('usuarios')
    .select('rol, nombre, apellido')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    return null
  }

  return {
    id: user.id,
    email: user.email!,
    rol: userData.rol as Rol,
    nombre: userData.nombre,
    apellido: userData.apellido,
  }
}

export async function requireAuth(): Promise<UserSession> {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return session
}

export async function requireRole(allowedRoles: Rol[]): Promise<UserSession> {
  const session = await requireAuth()

  if (!allowedRoles.includes(session.rol)) {
    redirect(RUTAS_POR_ROL[session.rol])
  }

  return session
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
