import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime } from '@/lib/utils'
import { Video, Calendar, Clock, AlertTriangle } from 'lucide-react'

export default async function MiClasePage() {
  const session = await requireRole(['alumno'])
  const supabase = await createClient()

  const { data: alumno } = await supabase
    .from('alumnos')
    .select(`
      *,
      profesor:profesores(nombre, apellido, zoom_link)
    `)
    .eq('user_id', session.id)
    .single()

  if (!alumno) {
    return <div>Error al cargar datos</div>
  }

  // Si está bloqueado
  if (alumno.bloqueado) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Mi Clase</h1>
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-lg font-bold text-destructive">Acceso Bloqueado</h2>
            <p className="text-muted-foreground text-center mt-2">
              No puedes acceder a clases mientras tu cuenta esté bloqueada.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Obtener próxima clase
  const hoy = new Date().toISOString().split('T')[0]
  const { data: proximaClase } = await supabase
    .from('clases')
    .select('*')
    .eq('alumno_id', alumno.id)
    .eq('estado', 'programada')
    .gte('fecha', hoy)
    .order('fecha')
    .order('hora_inicio')
    .limit(1)
    .single()

  // Clase de hoy
  const ahora = new Date()
  const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`

  const { data: claseHoy } = await supabase
    .from('clases')
    .select('*')
    .eq('alumno_id', alumno.id)
    .eq('fecha', hoy)
    .eq('estado', 'programada')
    .single()

  // Verificar si la clase está próxima (30 min antes hasta fin)
  const claseActiva = claseHoy && (() => {
    const [hInicio, mInicio] = claseHoy.hora_inicio.split(':').map(Number)
    const [hFin, mFin] = claseHoy.hora_fin.split(':').map(Number)
    const minutosActual = ahora.getHours() * 60 + ahora.getMinutes()
    const minutosInicio = hInicio * 60 + mInicio - 30 // 30 min antes
    const minutosFin = hFin * 60 + mFin
    return minutosActual >= minutosInicio && minutosActual <= minutosFin
  })()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi Clase</h1>
        <p className="text-muted-foreground">
          Accede a tu sala de clases virtual
        </p>
      </div>

      {/* Alerta de sin horas */}
      {alumno.horas_restantes <= 0 && (
        <Card className="border-orange-500 bg-orange-50">
          <CardContent className="p-4 flex items-center gap-4">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            <div>
              <p className="font-medium text-orange-700">Sin horas disponibles</p>
              <p className="text-sm text-orange-600">
                Contacta a tu vendedor para renovar tus horas de clase.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clase activa */}
      {claseActiva && alumno.profesor?.zoom_link && (
        <Card className="border-2 border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Video className="h-5 w-5" />
              Clase en Progreso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 text-green-700">
              <Clock className="h-5 w-5" />
              <span>
                {formatTime(claseHoy!.hora_inicio)} - {formatTime(claseHoy!.hora_fin)}
              </span>
            </div>
            <a
              href={alumno.profesor.zoom_link}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button size="lg" className="w-full bg-green-600 hover:bg-green-700">
                <Video className="h-5 w-5 mr-2" />
                Unirse Ahora
              </Button>
            </a>
          </CardContent>
        </Card>
      )}

      {/* Próxima clase */}
      <Card>
        <CardHeader>
          <CardTitle>Próxima Clase Programada</CardTitle>
        </CardHeader>
        <CardContent>
          {proximaClase ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-muted rounded-full">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-medium">
                    {formatDate(proximaClase.fecha, "EEEE d 'de' MMMM")}
                  </p>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatTime(proximaClase.hora_inicio)} - {formatTime(proximaClase.hora_fin)}
                  </p>
                </div>
              </div>

              {alumno.profesor && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Profesor</p>
                  <p className="font-medium">
                    {alumno.profesor.nombre} {alumno.profesor.apellido}
                  </p>
                </div>
              )}

              {!claseActiva && alumno.profesor?.zoom_link && (
                <div className="pt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    El enlace estará disponible 30 minutos antes de la clase
                  </p>
                  <Button variant="outline" disabled className="w-full">
                    <Video className="h-4 w-4 mr-2" />
                    Unirse a la Clase
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No hay clases programadas próximamente
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info profesor */}
      {alumno.profesor && (
        <Card>
          <CardHeader>
            <CardTitle>Mi Profesor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {alumno.profesor.nombre} {alumno.profesor.apellido}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
