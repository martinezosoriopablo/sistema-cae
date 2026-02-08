'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2, CheckCircle, XCircle, UserX } from 'lucide-react'
import { toast } from 'sonner'

interface MarcarClaseFormProps {
  claseId: string
  duracion: number
}

export function MarcarClaseForm({ claseId, duracion }: MarcarClaseFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [estado, setEstado] = useState<string>('')
  const [notas, setNotas] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!estado) {
      toast.error('Selecciona el estado de la clase')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/clases/marcar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clase_id: claseId,
          estado,
          notas_profesor: notas || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al marcar clase')
      }

      toast.success('Clase registrada exitosamente')
      router.push('/profesor/clases-hoy')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al marcar clase')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <Label>Estado de la clase</Label>
        <RadioGroup value={estado} onValueChange={setEstado}>
          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted cursor-pointer">
            <RadioGroupItem value="completada" id="completada" />
            <Label
              htmlFor="completada"
              className="flex items-center gap-2 cursor-pointer flex-1"
            >
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Clase Completada</p>
                <p className="text-sm text-muted-foreground">
                  Se descuentan {Math.round(duracion / 60 * 10) / 10} horas al alumno
                </p>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted cursor-pointer">
            <RadioGroupItem value="no_asistio" id="no_asistio" />
            <Label
              htmlFor="no_asistio"
              className="flex items-center gap-2 cursor-pointer flex-1"
            >
              <UserX className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium">Alumno No Asistió</p>
                <p className="text-sm text-muted-foreground">
                  Se descuentan las horas (falta sin aviso)
                </p>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted cursor-pointer">
            <RadioGroupItem value="cancelada" id="cancelada" />
            <Label
              htmlFor="cancelada"
              className="flex items-center gap-2 cursor-pointer flex-1"
            >
              <XCircle className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">Clase Cancelada</p>
                <p className="text-sm text-muted-foreground">
                  No se descuentan horas (cancelación justificada)
                </p>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notas">Notas de la clase (opcional)</Label>
        <Textarea
          id="notas"
          placeholder="Ej: Trabajamos en pronunciación, revisar vocabulario de negocios..."
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !estado}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar'
          )}
        </Button>
      </div>
    </form>
  )
}
