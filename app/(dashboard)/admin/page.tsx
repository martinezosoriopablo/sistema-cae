import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, GraduationCap, Calendar, Bell, UserX } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AdminDashboard() {
  const session = await requireRole(['admin'])
  const supabase = await createClient()

  // Obtener estadísticas
  const { count: totalAlumnos } = await supabase
    .from('alumnos')
    .select('*', { count: 'exact', head: true })

  const { count: alumnosActivos } = await supabase
    .from('alumnos')
    .select('*', { count: 'exact', head: true })
    .eq('bloqueado', false)
    .gt('horas_restantes', 0)

  const { count: alumnosBloqueados } = await supabase
    .from('alumnos')
    .select('*', { count: 'exact', head: true })
    .eq('bloqueado', true)

  const { count: totalProfesores } = await supabase
    .from('profesores')
    .select('*', { count: 'exact', head: true })
    .eq('activo', true)

  const hoy = new Date().toISOString().split('T')[0]
  const { count: clasesHoy } = await supabase
    .from('clases')
    .select('*', { count: 'exact', head: true })
    .eq('fecha', hoy)

  const { count: alertasPendientes } = await supabase
    .from('alertas')
    .select('*', { count: 'exact', head: true })
    .eq('leida', false)

  // Obtener alumnos sin profesor
  const { data: alumnosSinProfesor } = await supabase
    .from('alumnos')
    .select('id, nombre, apellido, nivel_actual')
    .is('profesor_id', null)
    .eq('bloqueado', false)
    .limit(5)

  const stats = [
    {
      title: 'Total Alumnos',
      value: totalAlumnos || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/admin/alumnos',
    },
    {
      title: 'Alumnos Activos',
      value: alumnosActivos || 0,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: '/admin/alumnos',
    },
    {
      title: 'Alumnos Bloqueados',
      value: alumnosBloqueados || 0,
      icon: UserX,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      href: '/admin/alumnos',
    },
    {
      title: 'Profesores',
      value: totalProfesores || 0,
      icon: GraduationCap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      href: '/admin/profesores',
    },
    {
      title: 'Clases Hoy',
      value: clasesHoy || 0,
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      href: '/admin/horarios',
    },
    {
      title: 'Alertas',
      value: alertasPendientes || 0,
      icon: Bell,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      href: '/admin/alumnos',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Administrador</h1>
        <p className="text-muted-foreground">
          Bienvenido, {session.nombre}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
          </Link>
        ))}
      </div>

      {/* Alumnos sin profesor */}
      {alumnosSinProfesor && alumnosSinProfesor.length > 0 && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Bell className="h-5 w-5" />
              Alumnos sin profesor asignado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alumnosSinProfesor.map((alumno) => (
                <div
                  key={alumno.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {alumno.nombre} {alumno.apellido}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Nivel {alumno.nivel_actual}
                    </p>
                  </div>
                  <Link href={`/admin/alumnos/${alumno.id}`}>
                    <Button size="sm" variant="outline">
                      Asignar
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
