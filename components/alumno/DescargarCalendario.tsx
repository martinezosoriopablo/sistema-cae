'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CalendarDays, Download, Loader2, CheckCircle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface DescargarCalendarioProps {
  totalClases: number
}

export function DescargarCalendario({ totalClases }: DescargarCalendarioProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  async function handleDownload() {
    setIsLoading(true)

    try {
      const response = await fetch('/api/alumno/calendario')

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al descargar')
      }

      // Obtener el archivo
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      // Crear link de descarga
      const a = document.createElement('a')
      a.href = url
      a.download = 'clases-talkchile.ics'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setDownloaded(true)
      toast.success('Calendario descargado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al descargar')
    } finally {
      setIsLoading(false)
    }
  }

  if (totalClases === 0) {
    return null
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <CalendarDays className="h-4 w-4 mr-2" />
          Agregar a mi Calendario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Exportar Clases al Calendario
          </DialogTitle>
          <DialogDescription>
            Descarga tus {totalClases} clases programadas y agrégalas a tu calendario.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {downloaded ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="font-medium">¡Archivo descargado!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ahora importa el archivo en tu calendario
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <p className="font-medium">¿Qué incluye?</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {totalClases} clases programadas</li>
                <li>• Horarios de cada clase</li>
                <li>• Link de Zoom incluido</li>
                <li>• Recordatorio 10 min antes</li>
              </ul>
            </div>
          )}

          <Button
            onClick={handleDownload}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : downloaded ? (
              <>
                <Download className="h-4 w-4 mr-2" />
                Descargar de nuevo
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Descargar Calendario (.ics)
              </>
            )}
          </Button>

          {downloaded && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium">Cómo importar:</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Google Calendar:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Abre Google Calendar</li>
                  <li>Click en ⚙️ → Configuración</li>
                  <li>Importar y exportar → Importar</li>
                  <li>Selecciona el archivo descargado</li>
                </ol>
              </div>
              <a
                href="https://calendar.google.com/calendar/r/settings/export"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-primary hover:underline"
              >
                Ir a Google Calendar
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
