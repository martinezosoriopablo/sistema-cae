import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime } from '@/lib/utils'
import { Calendar, Clock, Video } from 'lucide-react'
import Link from 'next/link'

export default async function ClasesHoyPage() {
  const session = await requireRole(['profesor'])
  const supabase = await createClient()

  const { data: profesor } = await supabase
    .from('profesores')
    .select('id, zoom_link')
    .eq('user_id', session.id)
    .single()

  if (!profesor) {
    return <div>Error: Profesor no encontrado</div>
  }

  const hoy = new Date().toISOString().split('T')[0]

  const { data: clases } = await supabase
    .from('clases')
    .select(`
      *,
      alumno:alumnos(nombre, apellido, nivel_actual, horas_restantes, telefono, email)
    `)
    .eq('profesor_id', profesor.id)
    .eq('fecha', hoy)
    .order('hora_inicio')

  const clasesProgramadas = clases?.filter(c => c.estado === 'programada') || []
  const clasesCompletadas = clases?.filter(c => c.estado !== 'programada') || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clases de Hoy</h1>
        <p className="text-muted-foreground">
          {formatDate(hoy, "EEEE d 'de' MMMM 'de' yyyy")}
        </p>
      </div>

      {profesor.zoom_link && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Tu sala de Zoom</span>
            </div>
            <a href={profesor.zoom_link} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                Abrir Zoom
              </Button>
            </a>
          </CardContent>
        </Card>
      )}

      {/* Clases pendientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Clases Pendientes ({clasesProgramadas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clasesProgramadas.length > 0 ? (
            <div className="space-y-4">
              {clasesProgramadas.map((clase) => (
                <div
                  key={clase.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-medium">
                        {clase.alumno?.nombre} {clase.alumno?.apellido}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatTime(clase.hora_inicio)} - {formatTime(clase.hora_fin)}
                        </span>
                        <Badge variant="secondary">{clase.alumno?.nivel_actual}</Badge>
                        <span>{clase.alumno?.horas_restantes}h restantes</span>
                      </div>
                    </div>
                    <Link href={`/profesor/marcar-clase/${clase.id}`}>
                      <Button>Marcar Asistencia</Button>
                    </Link>
                  </div>
                  {clase.alumno?.telefono && (
                    <p className="text-sm text-muted-foreground">
                      Tel: {clase.alumno.telefono}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No hay clases pendientes
            </p>
          )}
        </CardContent>
      </Card>

      {/* Clases completadas */}
      {clasesCompletadas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">
              Clases Completadas ({clasesCompletadas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {clasesCompletadas.map((clase) => (
                <div
                  key={clase.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground font-mono">
                      {formatTime(clase.hora_inicio)}
                    </span>
                    <span>
                      {clase.alumno?.nombre} {clase.alumno?.apellido}
                    </span>
                  </div>
                  <Badge
                    variant={
                      clase.estado === 'completada'
                        ? 'success'
                        : clase.estado === 'no_asistio'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {clase.estado}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
