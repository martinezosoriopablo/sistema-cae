import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatHorasRestantes, formatTime } from '@/lib/utils'
import { DIAS_SEMANA, NIVELES_MCER } from '@/lib/constants'
import { DetalleAlumnoActions } from '@/components/cards/DetalleAlumnoActions'
import { Mail, Phone, Calendar, Clock, User, GraduationCap } from 'lucide-react'

export default async function DetalleAlumnoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole(['admin'])
  const { id } = await params
  const supabase = await createClient()

  const { data: alumno, error } = await supabase
    .from('alumnos')
    .select(`
      *,
      horarios:horarios_alumnos(*),
      profesor:profesores(id, nombre, apellido, email, zoom_link)
    `)
    .eq('id', id)
    .single()

  if (error || !alumno) {
    notFound()
  }

  // Obtener lista de profesores para asignar
  const { data: profesores } = await supabase
    .from('profesores')
    .select('id, nombre, apellido, especialidades')
    .eq('activo', true)
    .order('nombre')

  // Obtener historial de clases
  const { data: clases } = await supabase
    .from('clases')
    .select('*')
    .eq('alumno_id', id)
    .order('fecha', { ascending: false })
    .limit(10)

  const nivelInfo = NIVELES_MCER.find(n => n.value === alumno.nivel_actual)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {alumno.nombre} {alumno.apellido}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {alumno.bloqueado ? (
              <Badge variant="destructive">Bloqueado</Badge>
            ) : alumno.horas_restantes <= 0 ? (
              <Badge variant="warning">Sin horas</Badge>
            ) : (
              <Badge variant="success">Activo</Badge>
            )}
            <Badge variant="secondary">{alumno.nivel_actual}</Badge>
          </div>
        </div>
        <DetalleAlumnoActions
          alumno={alumno}
          profesores={profesores || []}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{alumno.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{alumno.telefono}</span>
            </div>
            {alumno.rut && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">RUT:</span>
                <span>{alumno.rut}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Inicio: {formatDate(alumno.fecha_inicio)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Información del curso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Información del Curso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nivel MCER</p>
              <p className="font-medium">{nivelInfo?.label}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Horas restantes</p>
                <p className="text-2xl font-bold text-primary">
                  {alumno.horas_restantes}h
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Horas contratadas</p>
                <p className="text-2xl font-bold">
                  {alumno.horas_contratadas}h
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Profesor asignado</p>
              {alumno.profesor ? (
                <p className="font-medium">
                  {alumno.profesor.nombre} {alumno.profesor.apellido}
                </p>
              ) : (
                <p className="text-orange-600">Sin profesor asignado</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Horarios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horarios de Clase
            </CardTitle>
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

        {/* Historial de clases */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas Clases</CardTitle>
          </CardHeader>
          <CardContent>
            {clases && clases.length > 0 ? (
              <div className="space-y-2">
                {clases.map((clase) => (
                  <div
                    key={clase.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{formatDate(clase.fecha)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(clase.hora_inicio)} - {formatTime(clase.hora_fin)}
                      </p>
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
              <p className="text-muted-foreground">No hay clases registradas</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notas */}
      {alumno.notas && (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{alumno.notas}</p>
          </CardContent>
        </Card>
      )}

      {/* Motivo bloqueo */}
      {alumno.bloqueado && alumno.motivo_bloqueo && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Motivo de Bloqueo</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{alumno.motivo_bloqueo}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
