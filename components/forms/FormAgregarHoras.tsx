'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { agregarHorasSchema, AgregarHorasInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface FormAgregarHorasProps {
  alumnoId: string
  horasActuales: number
  onSuccess?: () => void
  onCancel?: () => void
}

export function FormAgregarHoras({
  alumnoId,
  horasActuales,
  onSuccess,
  onCancel,
}: FormAgregarHorasProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<AgregarHorasInput>({
    resolver: zodResolver(agregarHorasSchema),
    defaultValues: {
      horas: 10,
      motivo: '',
    },
  })

  async function onSubmit(data: AgregarHorasInput) {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/alumnos/${alumnoId}/agregar-horas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al agregar horas')
      }

      toast.success(`Se agregaron ${data.horas} horas exitosamente`)
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al agregar horas')
    } finally {
      setIsLoading(false)
    }
  }

  const horasNuevas = form.watch('horas') || 0

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex justify-between text-sm">
            <span>Horas actuales:</span>
            <span className="font-medium">{horasActuales}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span>Horas a agregar:</span>
            <span className="font-medium text-green-600">+{horasNuevas}</span>
          </div>
          <div className="flex justify-between text-sm mt-1 pt-2 border-t">
            <span>Nuevo total:</span>
            <span className="font-bold">{horasActuales + horasNuevas}</span>
          </div>
        </div>

        <FormField
          control={form.control}
          name="horas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad de horas</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Ingresa la cantidad de horas a agregar
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="motivo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ej: Renovacion de contrato"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                Agregando...
              </>
            ) : (
              'Agregar Horas'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
