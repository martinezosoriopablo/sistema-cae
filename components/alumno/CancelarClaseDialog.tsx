'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime } from '@/lib/utils'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CancelarClaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clase: {
    id: string
    fecha: string
    hora_inicio: string
    hora_fin: string
  }
  profesorNombre?: string
}

export function CancelarClaseDialog({
  open,
  onOpenChange,
  clase,
  profesorNombre,
}: CancelarClaseDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleCancelar() {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/clases/${clase.id}/cancelar`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error)
        return
      }

      toast.success('Clase cancelada exitosamente')
      onOpenChange(false)
      router.refresh()
    } catch {
      toast.error('Error al cancelar la clase')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Cancelar Clase
          </DialogTitle>
          <DialogDescription>
            Esta accion no se puede deshacer. La clase quedara marcada como cancelada.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20 space-y-2">
          <p className="text-sm">
            <strong>Fecha:</strong> {formatDate(clase.fecha, "EEEE d 'de' MMMM")}
          </p>
          <p className="text-sm">
            <strong>Horario:</strong> {formatTime(clase.hora_inicio)} - {formatTime(clase.hora_fin)}
          </p>
          {profesorNombre && (
            <p className="text-sm">
              <strong>Profesor:</strong> {profesorNombre}
            </p>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Se notificara al profesor y al administrador sobre la cancelacion.
          No se descontaran horas de tu cuenta.
        </p>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Volver
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancelar}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelando...
              </>
            ) : (
              'Cancelar Clase'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
