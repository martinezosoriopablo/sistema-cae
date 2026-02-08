import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatTime } from '@/lib/utils'
import { Calendar, Clock, CheckCircle, XCircle, History } from 'lucide-react'

export default async function HistorialPage() {
  const session = await requireRole(['alumno'])
  const supabase = await createClient()

  const { data: alumno } = await supabase
    .from('alumnos')
    .select('id')
    .eq('user_id', session.id)
    .single()

  if (!alumno) {
    return <div>Error al cargar datos</div>
  }

  const { data: clases } = await supabase
    .from('clases')
    .select(`
      *,
      profesor:profesores(nombre, apellido)
    `)
    .eq('alumno_id', alumno.id)
    .order('fecha', { ascending: false })
    .limit(50)

  // Estadísticas
  const clasesCompletadas = clases?.filter(c => c.estado === 'completada').length || 0
  const clasesNoAsistio = clases?.filter(c => c.estado === 'no_asistio').length || 0
  const clasesCanceladas = clases?.filter(c => c.estado === 'cancelada').length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Historial de Clases</h1>
        <p className="text-muted-foreground">
          Tu registro de clases tomadas
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{clasesCompletadas}</p>
              <p className="text-sm text-muted-foreground">Clases completadas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-red-100 rounded-full">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{clasesNoAsistio}</p>
              <p className="text-sm text-muted-foreground">Inasistencias</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-gray-100 rounded-full">
              <History className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{clasesCanceladas}</p>
              <p className="text-sm text-muted-foreground">Canceladas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de clases */}
      <Card>
        <CardHeader>
          <CardTitle>Todas las Clases</CardTitle>
        </CardHeader>
        <CardContent>
          {clases && clases.length > 0 ? (
            <div className="space-y-4">
              {clases.map((clase) => (
                <div
                  key={clase.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-center p-2 bg-muted rounded-lg min-w-[60px]">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(clase.fecha, 'MMM')}
                      </span>
                      <span className="text-xl font-bold">
                        {formatDate(clase.fecha, 'd')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {formatDate(clase.fecha, "EEEE d 'de' MMMM")}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatTime(clase.hora_inicio)} - {formatTime(clase.hora_fin)}
                        {clase.profesor && (
                          <span className="ml-2">
                            - Prof. {clase.profesor.nombre}
                          </span>
                        )}
                      </div>
                      {clase.notas_profesor && (
                        <p className="text-sm text-muted-foreground mt-1 italic">
                          "{clase.notas_profesor}"
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      clase.estado === 'completada'
                        ? 'success'
                        : clase.estado === 'programada'
                        ? 'default'
                        : clase.estado === 'no_asistio'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {clase.estado === 'completada' && 'Completada'}
                    {clase.estado === 'programada' && 'Programada'}
                    {clase.estado === 'no_asistio' && 'No asistió'}
                    {clase.estado === 'cancelada' && 'Cancelada'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No hay clases registradas aún
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
