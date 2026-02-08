'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatHorasRestantes } from '@/lib/utils'
import { UMBRAL_ALERTA_HORAS } from '@/lib/constants'
import { Clock, AlertTriangle } from 'lucide-react'

interface CardHorasRestantesProps {
  horasRestantes: number
  horasContratadas: number
  nivel: string
}

export function CardHorasRestantes({
  horasRestantes,
  horasContratadas,
  nivel,
}: CardHorasRestantesProps) {
  const porcentaje = (horasRestantes / horasContratadas) * 100
  const pocasHoras = horasRestantes <= UMBRAL_ALERTA_HORAS && horasRestantes > 0

  return (
    <Card className={pocasHoras ? 'border-orange-500' : ''}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Horas Restantes</p>
              <p
                className={`text-4xl font-bold ${
                  pocasHoras ? 'text-orange-500' : 'text-primary'
                }`}
              >
                {horasRestantes}h
              </p>
            </div>
          </div>
          {pocasHoras && (
            <div className="flex items-center gap-2 text-orange-500">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium">Pocas horas</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progreso</span>
            <span className="text-muted-foreground">
              {horasRestantes} / {horasContratadas}h
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                pocasHoras ? 'bg-orange-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(porcentaje, 100)}%` }}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Nivel actual: <span className="font-medium">{nivel}</span>
        </p>
      </CardContent>
    </Card>
  )
}
