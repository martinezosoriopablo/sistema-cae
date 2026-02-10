'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { actualizarHorariosSchema, ActualizarHorariosInput } from '@/lib/validations'
import { DIAS_SEMANA, HORARIOS_DISPONIBLES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
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
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface FormEditarHorariosProps {
  alumnoId: string
  onSuccess?: () => void
  onCancel?: () => void
}

interface Horario {
  id?: string
  dia: string
  hora_inicio: string
  hora_fin: string
}

export function FormEditarHorarios({ alumnoId, onSuccess, onCancel }: FormEditarHorariosProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const form = useForm<ActualizarHorariosInput>({
    resolver: zodResolver(actualizarHorariosSchema),
    defaultValues: {
      horarios: [{ dia: 'lunes', hora_inicio: '09:00', hora_fin: '10:00' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'horarios',
  })

  useEffect(() => {
    async function fetchHorarios() {
      try {
        const response = await fetch(`/api/alumnos/${alumnoId}/horarios`)
        if (response.ok) {
          const data: Horario[] = await response.json()
          if (data.length > 0) {
            form.reset({
              horarios: data.map(h => ({
                id: h.id,
                dia: h.dia as ActualizarHorariosInput['horarios'][number]['dia'],
                hora_inicio: h.hora_inicio,
                hora_fin: h.hora_fin,
              })),
            })
          }
        }
      } catch (error) {
        toast.error('Error al cargar los horarios')
      } finally {
        setInitialLoading(false)
      }
    }
    fetchHorarios()
  }, [alumnoId, form])

  async function onSubmit(data: ActualizarHorariosInput) {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/alumnos/${alumnoId}/horarios`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar horarios')
      }

      toast.success('Horarios actualizados exitosamente')
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar horarios')
    } finally {
      setIsLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Horarios de Clase</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ dia: 'lunes', hora_inicio: '09:00', hora_fin: '10:00' })}
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex flex-wrap gap-3 items-end p-3 border rounded-lg">
              <FormField
                control={form.control}
                name={`horarios.${index}.dia`}
                render={({ field }) => (
                  <FormItem className="flex-1 min-w-[120px]">
                    <FormLabel className="text-xs">Dia</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
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
                  <FormItem className="flex-1 min-w-[100px]">
                    <FormLabel className="text-xs">Inicio</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
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
                  <FormItem className="flex-1 min-w-[100px]">
                    <FormLabel className="text-xs">Fin</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
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
                  className="text-destructive hover:text-destructive h-9 w-9"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Horarios'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
