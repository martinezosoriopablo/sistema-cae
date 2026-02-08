import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, Video, Users, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DetalleProfesorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole(['admin'])
  const { id } = await params
  const supabase = await createClient()

  const { data: profesor, error } = await supabase
    .from('profesores')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !profesor) {
    notFound()
  }

  // Obtener alumnos asignados
  const { data: alumnos } = await supabase
    .from('alumnos')
    .select('id, nombre, apellido, nivel_actual, horas_restantes, bloqueado')
    .eq('profesor_id', id)
    .order('nombre')

  // Contar clases de hoy
  const hoy = new Date().toISOString().split('T')[0]
  const { count: clasesHoy } = await supabase
    .from('clases')
    .select('*', { count: 'exact', head: true })
    .eq('profesor_id', id)
    .eq('fecha', hoy)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {profesor.nombre} {profesor.apellido}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {profesor.activo ? (
              <Badge variant="success">Activo</Badge>
            ) : (
              <Badge variant="secondary">Inactivo</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información de contacto */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{profesor.email}</span>
            </div>
            {profesor.telefono && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{profesor.telefono}</span>
              </div>
            )}
            {profesor.zoom_link && (
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-muted-foreground" />
                <a
                  href={profesor.zoom_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Enlace de Zoom
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Especialidades y estadísticas */}
        <Card>
          <CardHeader>
            <CardTitle>Especialidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {profesor.especialidades && profesor.especialidades.length > 0 ? (
                profesor.especialidades.map((nivel: string) => (
                  <Badge key={nivel} variant="secondary">
                    {nivel}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground">Sin especialidades definidas</p>
              )}
            </div>
            <div className="pt-4 border-t grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{alumnos?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Alumnos</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{clasesHoy || 0}</p>
                  <p className="text-sm text-muted-foreground">Clases hoy</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alumnos asignados */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Alumnos Asignados</CardTitle>
          </CardHeader>
          <CardContent>
            {alumnos && alumnos.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {alumnos.map((alumno) => (
                  <Link
                    key={alumno.id}
                    href={`/admin/alumnos/${alumno.id}`}
                    className="block p-4 border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {alumno.nombre} {alumno.apellido}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Nivel {alumno.nivel_actual} - {alumno.horas_restantes}h
                        </p>
                      </div>
                      {alumno.bloqueado && (
                        <Badge variant="destructive" className="text-xs">
                          Bloqueado
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No hay alumnos asignados a este profesor
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
