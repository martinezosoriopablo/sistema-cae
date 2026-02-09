'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CalendarPlus, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export function GenerarClasesButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [dias, setDias] = useState(14)
  const [result, setResult] = useState<{ clasesCreadas: number } | null>(null)

  async function handleGenerar() {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/clases/generar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dias }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar clases')
      }

      setResult({ clasesCreadas: data.clasesCreadas })
      toast.success(`Se crearon ${data.clasesCreadas} clases`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al generar clases')
    } finally {
      setIsLoading(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <CalendarPlus className="h-4 w-4 mr-2" />
          Generar Clases
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generar Clases Automáticamente</DialogTitle>
          <DialogDescription>
            Esto creará clases para todos los alumnos activos según sus horarios configurados.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col items-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <p className="text-lg font-medium">
              {result.clasesCreadas === 0
                ? 'No se crearon clases nuevas'
                : `Se crearon ${result.clasesCreadas} clases`}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {result.clasesCreadas === 0
                ? 'Las clases para este período ya existen o no hay alumnos con horarios configurados.'
                : 'Las clases han sido programadas según los horarios de cada alumno.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dias">Días a generar</Label>
              <Input
                id="dias"
                type="number"
                min={7}
                max={30}
                value={dias}
                onChange={(e) => setDias(Number(e.target.value))}
              />
              <p className="text-sm text-muted-foreground">
                Se generarán clases para los próximos {dias} días basándose en los horarios de cada alumno.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
              <p><strong>Requisitos para generar clases:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>Alumno no bloqueado</li>
                <li>Alumno con horas restantes {`>`} 0</li>
                <li>Alumno con profesor asignado</li>
                <li>Alumno con horarios activos</li>
              </ul>
            </div>
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={handleClose}>Cerrar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGenerar} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  'Generar Clases'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
