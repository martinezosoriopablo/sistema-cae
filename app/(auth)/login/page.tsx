'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, LoginInput } from '@/lib/validations'
import { RUTAS_POR_ROL } from '@/lib/constants'
import { Rol } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginInput) {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      setError('Credenciales inválidas')
      setIsLoading(false)
      return
    }

    if (authData.user) {
      // Obtener rol del usuario
      const { data: userData } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', authData.user.id)
        .single()

      if (userData) {
        const redirectUrl = RUTAS_POR_ROL[userData.rol as Rol]
        router.push(redirectUrl)
        router.refresh()
      } else {
        setError('Usuario no configurado correctamente')
        setIsLoading(false)
      }
    }
  }

  return (
    <Card className="shadow-xl border-t-4 border-t-primary">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <Image
            src="/logo-talkchile.png"
            alt="TalkChile Logo"
            width={180}
            height={60}
            className="mx-auto"
            priority
          />
        </div>
        <CardTitle className="text-2xl text-primary">Bienvenido</CardTitle>
        <CardDescription>Sistema de Gestión de Cursos de Inglés</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="tu@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-secondary hover:bg-secondary/90 text-white font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
