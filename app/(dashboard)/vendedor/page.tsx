import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, Bell, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function VendedorDashboard() {
  const session = await requireRole(['vendedor'])
  const supabase = await createClient()

  // Obtener estadísticas
  const { count: totalAlumnos } = await supabase
    .from('alumnos')
    .select('*', { count: 'exact', head: true })
    .eq('vendedor_id', session.id)

  const { count: alumnosActivos } = await supabase
    .from('alumnos')
    .select('*', { count: 'exact', head: true })
    .eq('vendedor_id', session.id)
    .eq('bloqueado', false)
    .gt('horas_restantes', 0)

  const { count: alertasPendientes } = await supabase
    .from('alertas')
    .select('*', { count: 'exact', head: true })
    .eq('destinatario_id', session.id)
    .eq('leida', false)

  // Obtener últimos alumnos registrados
  const { data: ultimosAlumnos } = await supabase
    .from('alumnos')
    .select('id, nombre, apellido, nivel_actual, horas_restantes, created_at')
    .eq('vendedor_id', session.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    {
      title: 'Alumnos Registrados',
      value: totalAlumnos || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Alumnos Activos',
      value: alumnosActivos || 0,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Alertas Pendientes',
      value: alertasPendientes || 0,
      icon: Bell,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Vendedor</h1>
          <p className="text-muted-foreground">
            Bienvenido, {session.nombre}
          </p>
        </div>
        <Link href="/vendedor/nuevo-alumno">
          <Button>Registrar Nuevo Alumno</Button>
        </Link>
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

      {/* Últimos alumnos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Últimos Alumnos Registrados</CardTitle>
          <Link href="/vendedor/mis-alumnos">
            <Button variant="outline" size="sm">Ver todos</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {ultimosAlumnos && ultimosAlumnos.length > 0 ? (
            <div className="space-y-4">
              {ultimosAlumnos.map((alumno) => (
                <div
                  key={alumno.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {alumno.nombre} {alumno.apellido}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Nivel {alumno.nivel_actual} - {alumno.horas_restantes}h restantes
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No hay alumnos registrados aún
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
