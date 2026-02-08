import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatTime, minutosAHoras } from '@/lib/utils'
import { Users, Calendar, Clock, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default async function ProfesorDashboard() {
  const session = await requireRole(['profesor'])
  const supabase = await createClient()

  // Obtener datos del profesor
  const { data: profesor } = await supabase
    .from('profesores')
    .select('*')
    .eq('user_id', session.id)
    .single()

  if (!profesor) {
    return <div>Error: Profesor no encontrado</div>
  }

  // Estadísticas
  const { count: alumnosAsignados } = await supabase
    .from('alumnos')
    .select('*', { count: 'exact', head: true })
    .eq('profesor_id', profesor.id)
    .eq('bloqueado', false)

  const hoy = new Date().toISOString().split('T')[0]

  const { data: clasesHoy } = await supabase
    .from('clases')
    .select(`
      *,
      alumno:alumnos(nombre, apellido, nivel_actual, horas_restantes)
    `)
    .eq('profesor_id', profesor.id)
    .eq('fecha', hoy)
    .order('hora_inicio')

  // Clases de la semana
  const inicioSemana = new Date()
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay() + 1)
  const finSemana = new Date(inicioSemana)
  finSemana.setDate(finSemana.getDate() + 6)

  const { data: clasesSemana } = await supabase
    .from('clases')
    .select('duracion_minutos')
    .eq('profesor_id', profesor.id)
    .gte('fecha', inicioSemana.toISOString().split('T')[0])
    .lte('fecha', finSemana.toISOString().split('T')[0])

  const minutosSemana = clasesSemana?.reduce((sum, c) => sum + (c.duracion_minutos || 60), 0) || 0

  const stats = [
    {
      title: 'Alumnos Asignados',
      value: alumnosAsignados || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Clases Hoy',
      value: clasesHoy?.length || 0,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Horas esta Semana',
      value: minutosAHoras(minutosSemana),
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  // Próxima clase
  const ahora = new Date()
  const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`
  const proximaClase = clasesHoy?.find(c => c.hora_inicio >= horaActual && c.estado === 'programada')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Profesor</h1>
        <p className="text-muted-foreground">
          Bienvenido, {session.nombre}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Próxima clase */}
      {proximaClase && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Próxima Clase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium">
                  {proximaClase.alumno?.nombre} {proximaClase.alumno?.apellido}
                </p>
                <p className="text-muted-foreground">
                  Nivel {proximaClase.alumno?.nivel_actual} - {proximaClase.alumno?.horas_restantes}h restantes
                </p>
                <p className="text-sm mt-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  {formatTime(proximaClase.hora_inicio)} - {formatTime(proximaClase.hora_fin)}
                </p>
              </div>
              <Link href={`/profesor/marcar-clase/${proximaClase.id}`}>
                <Button>Iniciar Clase</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clases de hoy */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Clases de Hoy</CardTitle>
          <Link href="/profesor/clases-hoy">
            <Button variant="outline" size="sm">Ver todas</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {clasesHoy && clasesHoy.length > 0 ? (
            <div className="space-y-4">
              {clasesHoy.map((clase) => (
                <div
                  key={clase.id}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-muted-foreground font-mono">
                      {formatTime(clase.hora_inicio)}
                    </div>
                    <div>
                      <p className="font-medium">
                        {clase.alumno?.nombre} {clase.alumno?.apellido}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Nivel {clase.alumno?.nivel_actual}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        clase.estado === 'completada'
                          ? 'success'
                          : clase.estado === 'programada'
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {clase.estado}
                    </Badge>
                    {clase.estado === 'programada' && (
                      <Link href={`/profesor/marcar-clase/${clase.id}`}>
                        <Button size="sm" variant="outline">
                          Marcar
                        </Button>
                      </Link>
                    )}
                  </div>
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
    </div>
  )
}
