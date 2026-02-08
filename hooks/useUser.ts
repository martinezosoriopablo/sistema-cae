'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Rol } from '@/types'

interface User {
  id: string
  email: string
  rol: Rol
  nombre: string
  apellido: string
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function getUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        setUser(null)
        setLoading(false)
        return
      }

      const { data: userData } = await supabase
        .from('usuarios')
        .select('rol, nombre, apellido')
        .eq('id', authUser.id)
        .single()

      if (userData) {
        setUser({
          id: authUser.id,
          email: authUser.email!,
          rol: userData.rol as Rol,
          nombre: userData.nombre,
          apellido: userData.apellido,
        })
      }

      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        getUser()
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
