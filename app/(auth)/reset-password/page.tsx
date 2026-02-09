'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Loader2, KeyRound, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    // Verificar si hay una sesión válida de recuperación
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      // Si hay sesión y viene del flujo de recuperación
      if (session) {
        setIsValidSession(true)
      } else {
        // Intentar obtener la sesión desde el hash de la URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const type = hashParams.get('type')

        if (accessToken && type === 'recovery') {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          })
          if (!error) {
            setIsValidSession(true)
            return
          }
        }
        setIsValidSession(false)
      }
    }

    checkSession()
  }, [searchParams])

  async function onSubmit(data: ResetPasswordInput) {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
    })

    if (updateError) {
      setError('Error al actualizar la contraseña. El enlace puede haber expirado.')
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setIsLoading(false)

    // Redirigir al login después de 3 segundos
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }

  // Estado de carga inicial
  if (isValidSession === null) {
    return (
      <Card className="shadow-xl border-t-4 border-t-primary">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  // Enlace inválido o expirado
  if (isValidSession === false) {
    return (
      <Card className="shadow-xl border-t-4 border-t-destructive">
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
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl text-destructive">Enlace Inválido</CardTitle>
          <CardDescription className="mt-2">
            El enlace de recuperación es inválido o ha expirado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password" className="block">
            <Button className="w-full">
              Solicitar nuevo enlace
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Éxito
  if (success) {
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
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-xl text-primary">Contraseña Actualizada</CardTitle>
          <CardDescription className="mt-2">
            Tu contraseña ha sido actualizada exitosamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Serás redirigido al inicio de sesión en unos segundos...
          </p>
          <Link href="/login" className="block">
            <Button className="w-full">
              Ir al inicio de sesión
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Formulario de nueva contraseña
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
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <KeyRound className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-xl text-primary">Nueva Contraseña</CardTitle>
        <CardDescription>
          Ingresa tu nueva contraseña
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva contraseña</FormLabel>
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

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar contraseña</FormLabel>
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
                  Actualizando...
                </>
              ) : (
                'Actualizar contraseña'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
