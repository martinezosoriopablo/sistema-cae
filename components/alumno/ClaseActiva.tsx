'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/utils'
import { Video, Clock, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Clase {
  id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: string
  zoom_link?: string
}

interface ClaseActivaProps {
  clase: Clase
  zoomLink: string | null
  profesorNombre: string | null
}

export function ClaseActiva({ clase, zoomLink, profesorNombre }: ClaseActivaProps) {
  const router = useRouter()
  const [isJoining, setIsJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [canJoin, setCanJoin] = useState(false)
  const [timeUntilClass, setTimeUntilClass] = useState('')

  useEffect(() => {
    const checkTime = () => {
      const ahora = new Date()
      const [hInicio, mInicio] = clase.hora_inicio.split(':').map(Number)
      const [hFin, mFin] = clase.hora_fin.split(':').map(Number)

      const fechaInicio = new Date(clase.fecha + 'T' + clase.hora_inicio)
      const fechaFin = new Date(clase.fecha + 'T' + clase.hora_fin)

      // 30 min antes puede unirse
      const fechaPermitida = new Date(fechaInicio)
      fechaPermitida.setMinutes(fechaPermitida.getMinutes() - 30)

      // 15 min después de terminar ya no puede
      const fechaLimite = new Date(fechaFin)
      fechaLimite.setMinutes(fechaLimite.getMinutes() + 15)

      const puedeUnirse = ahora >= fechaPermitida && ahora <= fechaLimite
      setCanJoin(puedeUnirse)

      // Calcular tiempo restante
      if (ahora < fechaPermitida) {
        const diff = fechaPermitida.getTime() - ahora.getTime()
        const mins = Math.floor(diff / 60000)
        const hours = Math.floor(mins / 60)
        if (hours > 0) {
          setTimeUntilClass(`Disponible en ${hours}h ${mins % 60}m`)
        } else {
          setTimeUntilClass(`Disponible en ${mins} minutos`)
        }
      } else if (ahora >= fechaPermitida && ahora < fechaInicio) {
        setTimeUntilClass('Ya puedes unirte')
      } else if (ahora >= fechaInicio && ahora <= fechaFin) {
        setTimeUntilClass('Clase en progreso')
      } else {
        setTimeUntilClass('Clase finalizada')
      }
    }

    checkTime()
    const interval = setInterval(checkTime, 30000) // Actualizar cada 30 segundos
    return () => clearInterval(interval)
  }, [clase])

  async function handleJoinClass() {
    setIsJoining(true)

    try {
      const response = await fetch(`/api/clases/${clase.id}/unirse`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.zoom_link) {
          // Aún así puede unirse, solo mostrar advertencia
          toast.warning(data.error)
          window.open(data.zoom_link || zoomLink, '_blank')
        } else {
          toast.error(data.error)
        }
        return
      }

      setJoined(true)
      toast.success('Clase marcada como completada')

      // Abrir Zoom
      const link = data.zoom_link || zoomLink
      if (link) {
        window.open(link, '_blank')
      }

      // Refrescar la página después de un momento
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (error) {
      toast.error('Error al unirse a la clase')
    } finally {
      setIsJoining(false)
    }
  }

  const isActive = canJoin && clase.estado === 'programada'

  return (
    <Card className={`border-2 ${isActive ? 'border-green-500 bg-green-50' : 'border-primary'}`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isActive ? 'text-green-700' : 'text-primary'}`}>
          <Video className="h-5 w-5" />
          {isActive ? 'Clase Disponible' : 'Clase de Hoy'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Clock className={`h-5 w-5 ${isActive ? 'text-green-600' : 'text-muted-foreground'}`} />
            <span className={isActive ? 'text-green-700 font-medium' : ''}>
              {formatTime(clase.hora_inicio)} - {formatTime(clase.hora_fin)}
            </span>
          </div>
          <span className={`text-sm ${isActive ? 'text-green-600' : 'text-muted-foreground'}`}>
            {timeUntilClass}
          </span>
        </div>

        {profesorNombre && (
          <p className="text-sm text-muted-foreground">
            Profesor: {profesorNombre}
          </p>
        )}

        {joined ? (
          <Button disabled className="w-full bg-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            Clase Completada
          </Button>
        ) : canJoin && zoomLink ? (
          <Button
            size="lg"
            className={`w-full ${isActive ? 'bg-green-600 hover:bg-green-700' : ''}`}
            onClick={handleJoinClass}
            disabled={isJoining}
          >
            {isJoining ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Video className="h-5 w-5 mr-2" />
                Unirse a la Clase
              </>
            )}
          </Button>
        ) : (
          <Button variant="outline" disabled className="w-full">
            <Video className="h-4 w-4 mr-2" />
            {!zoomLink ? 'Sin enlace de Zoom configurado' : 'Enlace disponible pronto'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
