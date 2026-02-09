'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { nuevoVendedorSchema, NuevoVendedorInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Loader2, Plus, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface CreatedVendedorInfo {
  nombre: string
  apellido: string
  email: string
  tempPassword: string
}

export function FormNuevoVendedor() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [createdVendedor, setCreatedVendedor] = useState<CreatedVendedorInfo | null>(null)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [copied, setCopied] = useState(false)

  const form = useForm<NuevoVendedorInput>({
    resolver: zodResolver(nuevoVendedorSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
    },
  })

  async function onSubmit(data: NuevoVendedorInput) {
    setIsLoading(true)

    try {
      const response = await fetch('/api/vendedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear vendedor')
      }

      const result = await response.json()

      // Mostrar dialog con la contraseña temporal
      setCreatedVendedor({
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        tempPassword: result.tempPassword,
      })
      setOpen(false)
      setShowPasswordDialog(true)
      form.reset()
      toast.success('Vendedor creado exitosamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear vendedor')
    } finally {
      setIsLoading(false)
    }
  }

  function handleClosePasswordDialog() {
    setShowPasswordDialog(false)
    setCreatedVendedor(null)
    setCopied(false)
    router.refresh()
  }

  function copyCredentials() {
    if (createdVendedor) {
      const text = `Email: ${createdVendedor.email}\nContraseña: ${createdVendedor.tempPassword}`
      navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Credenciales copiadas al portapapeles')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Vendedor
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Vendedor</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Carlos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apellido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input placeholder="López" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="carlos@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+56912345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Crear Vendedor'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog con credenciales del vendedor */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vendedor Creado Exitosamente</DialogTitle>
            <DialogDescription>
              Guarda estas credenciales para compartirlas con el vendedor. Esta contraseña no se puede recuperar después.
            </DialogDescription>
          </DialogHeader>
          {createdVendedor && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Vendedor</p>
                  <p className="font-medium">{createdVendedor.nombre} {createdVendedor.apellido}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium font-mono">{createdVendedor.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contraseña temporal</p>
                  <p className="font-medium font-mono text-lg">{createdVendedor.tempPassword}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                El vendedor podrá cambiar su contraseña desde su perfil después de iniciar sesión.
              </p>
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={copyCredentials}
              className="flex-1 sm:flex-none"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar credenciales
                </>
              )}
            </Button>
            <Button onClick={handleClosePasswordDialog} className="flex-1 sm:flex-none">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
