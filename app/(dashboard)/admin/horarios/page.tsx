import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DIAS_SEMANA } from '@/lib/constants'
import { formatDate, formatTime } from '@/lib/utils'
import { Calendar, Clock } from 'lucide-react'
import { GenerarClasesButton } from '@/components/admin/GenerarClasesButton'

export default async function HorariosPage() {
  await requireRole(['admin'])
  const supabase = await createClient()

  const hoy = new Date()
  const fechaHoy = hoy.toISOString().split('T')[0]

  // Obtener clases de hoy
  const { data: clasesHoy } = await supabase
    .from('clases')
    .select(`
      *,
      alumno:alumnos(nombre, apellido, nivel_actual),
      profesor:profesores(nombre, apellido)
    `)
    .eq('fecha', fechaHoy)
    .order('hora_inicio')

  // Obtener próximos 7 días de clases
  const fechaFin = new Date(hoy)
  fechaFin.setDate(fechaFin.getDate() + 7)

  const { data: proximasClases } = await supabase
    .from('clases')
    .select(`
      *,
      alumno:alumnos(nombre, apellido, nivel_actual),
      profesor:profesores(nombre, apellido)
    `)
    .gt('fecha', fechaHoy)
    .lte('fecha', fechaFin.toISOString().split('T')[0])
    .order('fecha')
    .order('hora_inicio')
    .limit(20)

  // Agrupar por fecha
  type ClaseItem = NonNullable<typeof proximasClases>[number]
  const clasesPorFecha = proximasClases?.reduce((acc, clase) => {
    if (!acc[clase.fecha]) {
      acc[clase.fecha] = []
    }
    acc[clase.fecha].push(clase)
    return acc
  }, {} as Record<string, ClaseItem[]>) || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Horarios</h1>
          <p className="text-muted-foreground">
            Vista general de clases programadas
          </p>
        </div>
        <GenerarClasesButton />
      </div>

      {/* Clases de hoy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Clases de Hoy - {formatDate(fechaHoy, "EEEE d 'de' MMMM")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clasesHoy && clasesHoy.length > 0 ? (
            <div className="space-y-4">
              {clasesHoy.map((clase) => (
                <div
                  key={clase.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="font-mono">
                        {formatTime(clase.hora_inicio)} - {formatTime(clase.hora_fin)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {clase.alumno?.nombre} {clase.alumno?.apellido}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Prof. {clase.profesor?.nombre} {clase.profesor?.apellido} - Nivel {clase.alumno?.nivel_actual}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      clase.estado === 'completada'
                        ? 'success'
                        : clase.estado === 'cancelada'
                        ? 'secondary'
                        : clase.estado === 'no_asistio'
                        ? 'destructive'
                        : 'default'
                    }
                  >
                    {clase.estado}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No hay clases programadas para hoy
            </p>
          )}
        </CardContent>
      </Card>

      {/* Próximas clases */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos 7 días</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(clasesPorFecha).length > 0 ? (
            <div className="space-y-6">
              {(Object.entries(clasesPorFecha) as [string, ClaseItem[]][]).map(([fecha, clases]) => (
                <div key={fecha}>
                  <h3 className="font-medium text-muted-foreground mb-3">
                    {formatDate(fecha, "EEEE d 'de' MMMM")}
                  </h3>
                  <div className="space-y-2 pl-4 border-l-2">
                    {clases.map((clase) => (
                      <div
                        key={clase.id}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-sm text-muted-foreground">
                            {formatTime(clase.hora_inicio)}
                          </span>
                          <div>
                            <p className="font-medium">
                              {clase.alumno?.nombre} {clase.alumno?.apellido}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Prof. {clase.profesor?.nombre}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">{clase.alumno?.nivel_actual}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No hay clases programadas para los próximos días
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
