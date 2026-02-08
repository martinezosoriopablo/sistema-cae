import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatHorasRestantes } from '@/lib/utils'
import { DIAS_SEMANA, UMBRAL_ALERTA_HORAS } from '@/lib/constants'
import { Mail, Phone, AlertTriangle } from 'lucide-react'

export default async function MisAlumnosProfesorPage() {
  const session = await requireRole(['profesor'])
  const supabase = await createClient()

  const { data: profesor } = await supabase
    .from('profesores')
    .select('id')
    .eq('user_id', session.id)
    .single()

  if (!profesor) {
    return <div>Error: Profesor no encontrado</div>
  }

  const { data: alumnos } = await supabase
    .from('alumnos')
    .select(`
      *,
      horarios:horarios_alumnos(*)
    `)
    .eq('profesor_id', profesor.id)
    .eq('bloqueado', false)
    .order('nombre')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis Alumnos</h1>
        <p className="text-muted-foreground">
          {alumnos?.length || 0} alumnos asignados
        </p>
      </div>

      {alumnos && alumnos.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {alumnos.map((alumno) => (
            <Card key={alumno.id}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-lg">
                        {alumno.nombre} {alumno.apellido}
                      </h3>
                      <Badge variant="secondary" className="mt-1">
                        Nivel {alumno.nivel_actual}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${alumno.horas_restantes <= UMBRAL_ALERTA_HORAS ? 'text-destructive' : 'text-primary'}`}>
                        {formatHorasRestantes(alumno.horas_restantes)}
                      </div>
                      {alumno.horas_restantes <= UMBRAL_ALERTA_HORAS && alumno.horas_restantes > 0 && (
                        <div className="flex items-center gap-1 text-orange-500 text-sm mt-1">
                          <AlertTriangle className="h-3 w-3" />
                          Pocas horas
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {alumno.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {alumno.telefono}
                    </div>
                  </div>

                  {alumno.horarios && alumno.horarios.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-sm font-medium mb-2">Horarios:</p>
                      <div className="flex flex-wrap gap-2">
                        {alumno.horarios
                          .filter((h: any) => h.activo)
                          .map((horario: any) => {
                            const dia = DIAS_SEMANA.find(d => d.value === horario.dia)
                            return (
                              <Badge key={horario.id} variant="outline">
                                {dia?.abrev} {horario.hora_inicio.slice(0, 5)}
                              </Badge>
                            )
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium">No tienes alumnos asignados</p>
            <p className="text-muted-foreground">
              Espera a que el administrador te asigne alumnos
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
