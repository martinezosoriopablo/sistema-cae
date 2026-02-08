import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatTime, formatHorasRestantes } from '@/lib/utils'
import { Clock, User, Video } from 'lucide-react'
import { MarcarClaseForm } from '@/components/forms/MarcarClaseForm'

export default async function MarcarClasePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireRole(['profesor'])
  const { id } = await params
  const supabase = await createClient()

  const { data: profesor } = await supabase
    .from('profesores')
    .select('id, zoom_link')
    .eq('user_id', session.id)
    .single()

  if (!profesor) {
    redirect('/profesor')
  }

  const { data: clase, error } = await supabase
    .from('clases')
    .select(`
      *,
      alumno:alumnos(nombre, apellido, nivel_actual, horas_restantes, email, telefono)
    `)
    .eq('id', id)
    .eq('profesor_id', profesor.id)
    .single()

  if (error || !clase) {
    notFound()
  }

  if (clase.estado !== 'programada') {
    redirect('/profesor/clases-hoy')
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Marcar Asistencia</h1>
        <p className="text-muted-foreground">
          {formatDate(clase.fecha, "EEEE d 'de' MMMM")}
        </p>
      </div>

      {/* Info de la clase */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información del Alumno
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium">
                {clase.alumno?.nombre} {clase.alumno?.apellido}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{clase.alumno?.nivel_actual}</Badge>
                <span className="text-muted-foreground">
                  {formatHorasRestantes(clase.alumno?.horas_restantes || 0)} restantes
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {formatTime(clase.hora_inicio)} - {formatTime(clase.hora_fin)}
            </div>
            <span>({clase.duracion_minutos} minutos)</span>
          </div>

          {profesor.zoom_link && (
            <a
              href={profesor.zoom_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <Video className="h-4 w-4" />
              Abrir sala de Zoom
            </a>
          )}
        </CardContent>
      </Card>

      {/* Formulario de marcado */}
      <Card>
        <CardHeader>
          <CardTitle>Registrar Asistencia</CardTitle>
        </CardHeader>
        <CardContent>
          <MarcarClaseForm claseId={clase.id} duracion={clase.duracion_minutos} />
        </CardContent>
      </Card>
    </div>
  )
}
