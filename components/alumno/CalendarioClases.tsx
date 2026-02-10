'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatTime } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Video, Clock, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { CancelarClaseDialog } from './CancelarClaseDialog'
import { HORAS_MINIMAS_CANCELACION } from '@/lib/constants'

interface Clase {
  id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: string
  zoom_link?: string
}

interface CalendarioClasesProps {
  clases: Clase[]
  zoomLink: string | null
}

export function CalendarioClases({ clases, zoomLink }: CalendarioClasesProps) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [joiningClass, setJoiningClass] = useState<string | null>(null)
  const [cancelClase, setCancelClase] = useState<Clase | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Primer día del mes y último día
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)

  // Día de la semana del primer día (0 = Domingo)
  const startingDayOfWeek = firstDayOfMonth.getDay()

  // Días del mes
  const daysInMonth = lastDayOfMonth.getDate()

  // Generar array de días
  const days: (number | null)[] = []

  // Días vacíos al inicio
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }

  // Días del mes
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  // Agrupar clases por fecha
  const clasesPorFecha: Record<string, Clase[]> = {}
  clases.forEach(clase => {
    if (!clasesPorFecha[clase.fecha]) {
      clasesPorFecha[clase.fecha] = []
    }
    clasesPorFecha[clase.fecha].push(clase)
  })

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  function getClasesDelDia(day: number): Clase[] {
    const fecha = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return clasesPorFecha[fecha] || []
  }

  function puedeUnirse(clase: Clase): boolean {
    const ahora = new Date()
    const fechaInicio = new Date(clase.fecha + 'T' + clase.hora_inicio)
    const fechaFin = new Date(clase.fecha + 'T' + clase.hora_fin)

    fechaInicio.setMinutes(fechaInicio.getMinutes() - 30)
    fechaFin.setMinutes(fechaFin.getMinutes() + 15)

    return ahora >= fechaInicio && ahora <= fechaFin && clase.estado === 'programada'
  }

  function puedeCancelar(clase: Clase): boolean {
    if (clase.estado !== 'programada') return false
    const ahora = new Date()
    const fechaInicio = new Date(clase.fecha + 'T' + clase.hora_inicio)
    const horasRestantes = (fechaInicio.getTime() - ahora.getTime()) / (1000 * 60 * 60)
    return horasRestantes >= HORAS_MINIMAS_CANCELACION
  }

  async function handleJoinClass(clase: Clase) {
    setJoiningClass(clase.id)

    try {
      const response = await fetch(`/api/clases/${clase.id}/unirse`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.zoom_link) {
          toast.warning(data.error)
          window.open(data.zoom_link || zoomLink, '_blank')
        } else {
          toast.error(data.error)
        }
        return
      }

      toast.success('Conectando a la clase')
      const link = data.zoom_link || zoomLink
      if (link) {
        window.open(link, '_blank')
      }

      setTimeout(() => router.refresh(), 2000)
    } catch (error) {
      toast.error('Error al unirse a la clase')
    } finally {
      setJoiningClass(null)
    }
  }

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  const hoy = new Date()
  const esHoy = (day: number) =>
    day === hoy.getDate() && month === hoy.getMonth() && year === hoy.getFullYear()

  return (
    <div className="space-y-4">
      {/* Header del calendario */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">
          {meses[month]} {year}
        </h3>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1">
        {diasSemana.map(dia => (
          <div key={dia} className="text-center text-sm font-medium text-muted-foreground py-2">
            {dia}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-24" />
          }

          const clasesDelDia = getClasesDelDia(day)
          const tieneClases = clasesDelDia.length > 0

          return (
            <div
              key={day}
              className={`min-h-24 p-1 border rounded-lg ${esHoy(day)
                  ? 'border-primary bg-primary/5'
                  : tieneClases
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-100'
                }`}
            >
              <div className={`text-sm font-medium mb-1 ${esHoy(day) ? 'text-primary' : ''}`}>
                {day}
              </div>
              <div className="space-y-1">
                {clasesDelDia.map(clase => (
                  <div
                    key={clase.id}
                    className={`text-xs p-1 rounded ${clase.estado === 'completada'
                        ? 'bg-green-200 text-green-800'
                        : clase.estado === 'cancelada' || clase.estado === 'no_asistio'
                          ? 'bg-red-200 text-red-800'
                          : 'bg-blue-200 text-blue-800'
                      }`}
                  >
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(clase.hora_inicio)}
                    </div>
                    {clase.estado === 'completada' && (
                      <CheckCircle className="h-3 w-3 inline" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Lista de próximas clases */}
      <div className="border-t pt-4 mt-4">
        <h4 className="font-medium mb-3">Próximas Clases</h4>
        <div className="space-y-2">
          {clases
            .filter(c => c.estado === 'programada' && new Date(c.fecha) >= new Date(new Date().toISOString().split('T')[0]))
            .slice(0, 5)
            .map(clase => (
              <div
                key={clase.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {formatDate(clase.fecha, "EEEE d 'de' MMMM")}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(clase.hora_inicio)} - {formatTime(clase.hora_fin)}
                  </p>
                </div>
                {puedeUnirse(clase) ? (
                  <Button
                    size="sm"
                    onClick={() => handleJoinClass(clase)}
                    disabled={joiningClass === clase.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Video className="h-4 w-4 mr-1" />
                    {joiningClass === clase.id ? 'Conectando...' : 'Unirse'}
                  </Button>
                ) : puedeCancelar(clase) ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/50 hover:bg-destructive/10"
                    onClick={() => setCancelClase(clase)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                ) : (
                  <Badge variant="secondary">Programada</Badge>
                )}
              </div>
            ))}
          {clases.filter(c => c.estado === 'programada').length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No hay clases programadas
            </p>
          )}
        </div>
      </div>

      {cancelClase && (
        <CancelarClaseDialog
          open={!!cancelClase}
          onOpenChange={(open) => { if (!open) setCancelClase(null) }}
          clase={cancelClase}
        />
      )}
    </div>
  )
}
