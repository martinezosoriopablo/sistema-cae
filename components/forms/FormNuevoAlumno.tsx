'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { nuevoAlumnoSchema, NuevoAlumnoInput } from '@/lib/validations'
import { NIVELES_MCER, MODALIDADES_CURSO, DIAS_SEMANA, HORARIOS_DISPONIBLES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Plus, Trash2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface FormNuevoAlumnoProps {
  redirectUrl?: string
  onSuccess?: () => void
}

interface CreatedStudentInfo {
  nombre: string
  apellido: string
  email: string
  tempPassword: string
}

export function FormNuevoAlumno({ redirectUrl = '/vendedor/mis-alumnos', onSuccess }: FormNuevoAlumnoProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [createdStudent, setCreatedStudent] = useState<CreatedStudentInfo | null>(null)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [copied, setCopied] = useState(false)

  const form = useForm<NuevoAlumnoInput>({
    resolver: zodResolver(nuevoAlumnoSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      rut: '',
      nivel_actual: 'A1',
      modalidad: 'privado',
      horas_contratadas: 10,
      horarios: [{ dia: 'lunes', hora_inicio: '09:00', hora_fin: '10:00' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'horarios',
  })

  async function onSubmit(data: NuevoAlumnoInput) {
    setIsLoading(true)

    try {
      const response = await fetch('/api/alumnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear alumno')
      }

      const result = await response.json()

      // Mostrar dialog con la contraseña temporal
      setCreatedStudent({
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        tempPassword: result.tempPassword,
      })
      setShowPasswordDialog(true)
      toast.success('Alumno registrado exitosamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear alumno')
    } finally {
      setIsLoading(false)
    }
  }

  function handleClosePasswordDialog() {
    setShowPasswordDialog(false)
    setCreatedStudent(null)
    setCopied(false)
    if (onSuccess) {
      onSuccess()
    } else {
      router.push(redirectUrl)
    }
    router.refresh()
  }

  function copyCredentials() {
    if (createdStudent) {
      const text = `Email: ${createdStudent.email}\nContraseña: ${createdStudent.tempPassword}`
      navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Credenciales copiadas al portapapeles')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Datos personales */}
        <Card>
          <CardHeader>
            <CardTitle>Datos Personales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan" {...field} />
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
                    <Input placeholder="Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="juan@email.com" {...field} />
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
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="+56912345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RUT (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="12.345.678-9" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Datos del curso */}
        <Card>
          <CardHeader>
            <CardTitle>Datos del Curso</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="nivel_actual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nivel MCER</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona nivel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {NIVELES_MCER.map((nivel) => (
                        <SelectItem key={nivel.value} value={nivel.value}>
                          {nivel.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modalidad"
              render={({ field }) => {
                const modalidadInfo = MODALIDADES_CURSO.find(m => m.value === field.value)
                return (
                  <FormItem>
                    <FormLabel>Modalidad</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona modalidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MODALIDADES_CURSO.map((modalidad) => (
                          <SelectItem key={modalidad.value} value={modalidad.value}>
                            {modalidad.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {modalidadInfo && (
                      <p className="text-xs text-muted-foreground">
                        Tarifa sugerida: ${modalidadInfo.tarifaSugerida.toLocaleString('es-CL')}/hora
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            <FormField
              control={form.control}
              name="horas_contratadas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horas Contratadas</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={500}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Horarios */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Horarios de Clase</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ dia: 'lunes', hora_inicio: '09:00', hora_fin: '10:00' })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar horario
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-wrap gap-4 items-end p-4 border rounded-lg">
                <FormField
                  control={form.control}
                  name={`horarios.${index}.dia`}
                  render={({ field }) => (
                    <FormItem className="flex-1 min-w-[150px]">
                      <FormLabel>Día</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DIAS_SEMANA.map((dia) => (
                            <SelectItem key={dia.value} value={dia.value}>
                              {dia.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`horarios.${index}.hora_inicio`}
                  render={({ field }) => (
                    <FormItem className="flex-1 min-w-[120px]">
                      <FormLabel>Hora inicio</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {HORARIOS_DISPONIBLES.map((hora) => (
                            <SelectItem key={hora.value} value={hora.value}>
                              {hora.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`horarios.${index}.hora_fin`}
                  render={({ field }) => (
                    <FormItem className="flex-1 min-w-[120px]">
                      <FormLabel>Hora fin</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {HORARIOS_DISPONIBLES.map((hora) => (
                            <SelectItem key={hora.value} value={hora.value}>
                              {hora.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Registrar Alumno'
            )}
          </Button>
        </div>
      </form>

      {/* Dialog con credenciales del alumno */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alumno Creado Exitosamente</DialogTitle>
            <DialogDescription>
              Guarda estas credenciales para compartirlas con el alumno. Esta contraseña no se puede recuperar después.
            </DialogDescription>
          </DialogHeader>
          {createdStudent && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Alumno</p>
                  <p className="font-medium">{createdStudent.nombre} {createdStudent.apellido}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium font-mono">{createdStudent.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contraseña temporal</p>
                  <p className="font-medium font-mono text-lg">{createdStudent.tempPassword}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                El alumno podrá cambiar su contraseña desde su perfil después de iniciar sesión.
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
    </Form>
  )
}
