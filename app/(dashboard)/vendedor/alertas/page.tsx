import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import { AlertTriangle, Bell, CheckCircle } from 'lucide-react'

export default async function AlertasPage() {
  const session = await requireRole(['vendedor'])
  const supabase = await createClient()

  const { data: alertas } = await supabase
    .from('alertas')
    .select(`
      *,
      alumnos:alumno_id (
        nombre,
        apellido,
        horas_restantes
      )
    `)
    .eq('destinatario_id', session.id)
    .order('created_at', { ascending: false })

  const alertasNoLeidas = alertas?.filter(a => !a.leida) || []
  const alertasLeidas = alertas?.filter(a => a.leida) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alertas</h1>
        <p className="text-muted-foreground">
          {alertasNoLeidas.length} alertas sin leer
        </p>
      </div>

      {alertasNoLeidas.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            Sin leer
          </h2>
          {alertasNoLeidas.map((alerta) => (
            <Card key={alerta.id} className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium">
                        {alerta.alumnos?.nombre} {alerta.alumnos?.apellido}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {alerta.mensaje}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(alerta.created_at)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="warning">
                    {alerta.alumnos?.horas_restantes}h restantes
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {alertasNoLeidas.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium">No hay alertas pendientes</p>
            <p className="text-muted-foreground">
              Todos tus alumnos tienen suficientes horas
            </p>
          </CardContent>
        </Card>
      )}

      {alertasLeidas.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Alertas anteriores
          </h2>
          {alertasLeidas.slice(0, 10).map((alerta) => (
            <Card key={alerta.id} className="opacity-60">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {alerta.alumnos?.nombre} {alerta.alumnos?.apellido}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {alerta.mensaje}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(alerta.created_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
