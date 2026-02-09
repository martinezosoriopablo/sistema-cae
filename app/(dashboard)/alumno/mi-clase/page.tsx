import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatTime } from '@/lib/utils'
import { Calendar, AlertTriangle } from 'lucide-react'
import { ClaseActiva } from '@/components/alumno/ClaseActiva'
import { CalendarioClases } from '@/components/alumno/CalendarioClases'
import { DescargarCalendario } from '@/components/alumno/DescargarCalendario'

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

  // Obtener clases del mes actual y siguiente
  const hoy = new Date()
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const ultimoDiaProxMes = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0)

  const { data: clases } = await supabase
    .from('clases')
    .select('*')
    .eq('alumno_id', alumno.id)
    .gte('fecha', primerDiaMes.toISOString().split('T')[0])
    .lte('fecha', ultimoDiaProxMes.toISOString().split('T')[0])
    .order('fecha')
    .order('hora_inicio')

  // Clase de hoy
  const fechaHoy = hoy.toISOString().split('T')[0]
  const claseHoy = clases?.find(c => c.fecha === fechaHoy && c.estado === 'programada')

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

      {/* Clase de hoy */}
      {claseHoy && (
        <ClaseActiva
          clase={claseHoy}
          zoomLink={alumno.profesor?.zoom_link || null}
          profesorNombre={alumno.profesor ? `${alumno.profesor.nombre} ${alumno.profesor.apellido}` : null}
        />
      )}

      {/* Calendario de clases */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Mis Clases Programadas
          </CardTitle>
          <DescargarCalendario
            totalClases={clases?.filter(c => c.estado === 'programada').length || 0}
          />
        </CardHeader>
        <CardContent>
          <CalendarioClases
            clases={clases || []}
            zoomLink={alumno.profesor?.zoom_link || null}
          />
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
