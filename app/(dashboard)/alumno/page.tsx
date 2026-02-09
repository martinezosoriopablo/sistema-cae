import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime, formatHorasRestantes } from '@/lib/utils'
import { DIAS_SEMANA, UMBRAL_ALERTA_HORAS } from '@/lib/constants'
import { Clock, Calendar, Video, AlertTriangle, BookOpen, CalendarDays } from 'lucide-react'
import Link from 'next/link'

export default async function AlumnoDashboard() {
  const session = await requireRole(['alumno'])
  const supabase = await createClient()

  // Obtener datos del alumno
  const { data: alumno } = await supabase
    .from('alumnos')
    .select(`
      *,
      profesor:profesores(nombre, apellido, email, zoom_link),
      horarios:horarios_alumnos(*)
    `)
    .eq('user_id', session.id)
    .single()

  if (!alumno) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Error al cargar datos del alumno</p>
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

  // Si está bloqueado
  if (alumno.bloqueado) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mi Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido, {session.nombre}
          </p>
        </div>

        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-xl font-bold text-destructive mb-2">Cuenta Bloqueada</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Tu cuenta ha sido bloqueada temporalmente.
              {alumno.motivo_bloqueo && (
                <span className="block mt-2">
                  Motivo: {alumno.motivo_bloqueo}
                </span>
              )}
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Por favor contacta a administración para más información.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido, {session.nombre}
        </p>
      </div>

      {/* Horas restantes */}
      <Card className={alumno.horas_restantes <= UMBRAL_ALERTA_HORAS ? 'border-orange-500' : ''}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Horas Restantes</p>
                <p className={`text-4xl font-bold ${alumno.horas_restantes <= UMBRAL_ALERTA_HORAS ? 'text-orange-500' : 'text-primary'}`}>
                  {alumno.horas_restantes}h
                </p>
              </div>
            </div>
            {alumno.horas_restantes <= UMBRAL_ALERTA_HORAS && alumno.horas_restantes > 0 && (
              <div className="flex items-center gap-2 text-orange-500">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm font-medium">Pocas horas restantes</span>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              De {alumno.horas_contratadas} horas contratadas - Nivel {alumno.nivel_actual}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Próxima clase */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próxima Clase
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proximaClase ? (
              <div className="space-y-4">
                <div>
                  <p className="text-lg font-medium">
                    {formatDate(proximaClase.fecha, "EEEE d 'de' MMMM")}
                  </p>
                  <p className="text-muted-foreground">
                    {formatTime(proximaClase.hora_inicio)} - {formatTime(proximaClase.hora_fin)}
                  </p>
                </div>
                {alumno.profesor?.zoom_link && (
                  <a
                    href={alumno.profesor.zoom_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full">
                      <Video className="h-4 w-4 mr-2" />
                      Unirse a la Clase
                    </Button>
                  </a>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground py-4">
                No hay clases programadas próximamente
              </p>
            )}
          </CardContent>
        </Card>

        {/* Profesor */}
        <Card>
          <CardHeader>
            <CardTitle>Mi Profesor</CardTitle>
          </CardHeader>
          <CardContent>
            {alumno.profesor ? (
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {alumno.profesor.nombre} {alumno.profesor.apellido}
                </p>
                <p className="text-muted-foreground">{alumno.profesor.email}</p>
              </div>
            ) : (
              <p className="text-muted-foreground py-4">
                Aún no tienes profesor asignado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Horarios */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Horarios</CardTitle>
          </CardHeader>
          <CardContent>
            {alumno.horarios && alumno.horarios.length > 0 ? (
              <div className="space-y-2">
                {alumno.horarios
                  .filter((h: any) => h.activo)
                  .map((horario: any) => {
                    const dia = DIAS_SEMANA.find(d => d.value === horario.dia)
                    return (
                      <div
                        key={horario.id}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <span className="font-medium">{dia?.label}</span>
                        <span className="text-muted-foreground">
                          {formatTime(horario.hora_inicio)} - {formatTime(horario.hora_fin)}
                        </span>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <p className="text-muted-foreground">No hay horarios definidos</p>
            )}
          </CardContent>
        </Card>

        {/* Accesos rápidos */}
        <Card>
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/alumno/mi-clase">
              <Button variant="outline" className="w-full justify-start">
                <CalendarDays className="h-4 w-4 mr-2" />
                Ver Calendario de Clases
              </Button>
            </Link>
            <Link href="/alumno/historial">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Ver Historial de Clases
              </Button>
            </Link>
            <Link href="/alumno/material">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="h-4 w-4 mr-2" />
                Material de Estudio
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
