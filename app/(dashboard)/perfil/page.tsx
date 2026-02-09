'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Loader2, User, KeyRound, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type ChangePasswordInput = z.infer<typeof changePasswordSchema>

interface UserProfile {
  email: string
  nombre: string
  apellido: string
  rol: string
}

export default function PerfilPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [success, setSuccess] = useState(false)

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: userData } = await supabase
          .from('usuarios')
          .select('nombre, apellido, rol')
          .eq('id', user.id)
          .single()

        if (userData) {
          setProfile({
            email: user.email || '',
            nombre: userData.nombre,
            apellido: userData.apellido,
            rol: userData.rol,
          })
        }
      }
      setLoadingProfile(false)
    }

    loadProfile()
  }, [])

  async function onSubmit(data: ChangePasswordInput) {
    setIsLoading(true)
    setSuccess(false)

    const supabase = createClient()

    // Primero verificar la contraseña actual intentando hacer login
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      toast.error('Error al obtener usuario')
      setIsLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: data.currentPassword,
    })

    if (signInError) {
      toast.error('La contraseña actual es incorrecta')
      setIsLoading(false)
      return
    }

    // Actualizar la contraseña
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.newPassword,
    })

    if (updateError) {
      toast.error('Error al actualizar la contraseña')
      setIsLoading(false)
      return
    }

    setSuccess(true)
    toast.success('Contraseña actualizada exitosamente')
    form.reset()
    setIsLoading(false)

    // Ocultar el mensaje de éxito después de 3 segundos
    setTimeout(() => setSuccess(false), 3000)
  }

  const rolLabels: Record<string, string> = {
    admin: 'Administrador',
    vendedor: 'Vendedor',
    profesor: 'Profesor',
    alumno: 'Alumno',
  }

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información de cuenta
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información del perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Tu información de cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{profile.nombre} {profile.apellido}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{profile.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rol</p>
                  <p className="font-medium">{rolLabels[profile.rol] || profile.rol}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Cambiar contraseña */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Cambiar Contraseña
            </CardTitle>
            <CardDescription>
              Actualiza tu contraseña de acceso
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span>Contraseña actualizada exitosamente</span>
              </div>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña actual</FormLabel>
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
                  name="newPassword"
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
                      <FormLabel>Confirmar nueva contraseña</FormLabel>
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

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    'Cambiar contraseña'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
