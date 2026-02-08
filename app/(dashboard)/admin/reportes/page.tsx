import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Users, Clock, TrendingUp } from 'lucide-react'

export default async function ReportesPage() {
  await requireRole(['admin'])
  const supabase = await createClient()

  // Estadísticas generales
  const { count: totalAlumnos } = await supabase
    .from('alumnos')
    .select('*', { count: 'exact', head: true })

  const { count: alumnosActivos } = await supabase
    .from('alumnos')
    .select('*', { count: 'exact', head: true })
    .eq('bloqueado', false)
    .gt('horas_restantes', 0)

  const { count: totalProfesores } = await supabase
    .from('profesores')
    .select('*', { count: 'exact', head: true })
    .eq('activo', true)

  // Clases del mes actual
  const inicioMes = new Date()
  inicioMes.setDate(1)
  const finMes = new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 0)

  const { data: clasesMes } = await supabase
    .from('clases')
    .select('estado')
    .gte('fecha', inicioMes.toISOString().split('T')[0])
    .lte('fecha', finMes.toISOString().split('T')[0])

  const clasesCompletadas = clasesMes?.filter(c => c.estado === 'completada').length || 0
  const clasesNoAsistio = clasesMes?.filter(c => c.estado === 'no_asistio').length || 0
  const clasesCanceladas = clasesMes?.filter(c => c.estado === 'cancelada').length || 0
  const totalClases = clasesMes?.length || 0

  // Alumnos por nivel
  const { data: alumnosPorNivel } = await supabase
    .from('alumnos')
    .select('nivel_actual')

  const distribucionNivel = alumnosPorNivel?.reduce((acc, curr) => {
    acc[curr.nivel_actual] = (acc[curr.nivel_actual] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  // Horas totales disponibles
  const { data: horasData } = await supabase
    .from('alumnos')
    .select('horas_restantes')
    .eq('bloqueado', false)

  const horasTotales = horasData?.reduce((sum, a) => sum + (a.horas_restantes || 0), 0) || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="text-muted-foreground">
          Estadísticas y métricas del sistema
        </p>
      </div>

      {/* Resumen general */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alumnos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAlumnos}</div>
            <p className="text-xs text-muted-foreground">
              {alumnosActivos} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profesores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProfesores}</div>
            <p className="text-xs text-muted-foreground">activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Disponibles</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{horasTotales}h</div>
            <p className="text-xs text-muted-foreground">
              en total de alumnos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clases este Mes</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClases}</div>
            <p className="text-xs text-muted-foreground">
              {clasesCompletadas} completadas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Distribución por nivel */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Nivel MCER</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((nivel) => {
                const cantidad = distribucionNivel[nivel] || 0
                const porcentaje = totalAlumnos ? Math.round((cantidad / totalAlumnos!) * 100) : 0
                return (
                  <div key={nivel} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{nivel}</span>
                      <span className="text-muted-foreground">
                        {cantidad} alumnos ({porcentaje}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Estado de clases del mes */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Clases - Mes Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="success">Completadas</Badge>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {clasesCompletadas}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">No asistió</Badge>
                </div>
                <span className="text-2xl font-bold text-red-600">
                  {clasesNoAsistio}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Canceladas</Badge>
                </div>
                <span className="text-2xl font-bold text-gray-600">
                  {clasesCanceladas}
                </span>
              </div>

              {totalClases > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Tasa de asistencia:{' '}
                    <span className="font-bold text-foreground">
                      {Math.round((clasesCompletadas / totalClases) * 100)}%
                    </span>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
