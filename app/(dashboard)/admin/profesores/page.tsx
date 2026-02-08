import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Plus, Eye, Mail, Phone, Users } from 'lucide-react'
import { FormNuevoProfesor } from '@/components/forms/FormProfesor'

export default async function ProfesoresPage() {
  await requireRole(['admin'])
  const supabase = await createClient()

  const { data: profesores } = await supabase
    .from('profesores')
    .select('*')
    .order('nombre')

  // Contar alumnos por profesor
  const { data: conteoAlumnos } = await supabase
    .from('alumnos')
    .select('profesor_id')
    .not('profesor_id', 'is', null)

  const alumnosPorProfesor = conteoAlumnos?.reduce((acc, curr) => {
    acc[curr.profesor_id] = (acc[curr.profesor_id] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Profesores</h1>
          <p className="text-muted-foreground">
            {profesores?.filter(p => p.activo).length || 0} profesores activos
          </p>
        </div>
        <FormNuevoProfesor />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profesor</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Especialidades</TableHead>
                <TableHead>Alumnos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!profesores || profesores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay profesores registrados
                  </TableCell>
                </TableRow>
              ) : (
                profesores.map((profesor) => (
                  <TableRow key={profesor.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {profesor.nombre} {profesor.apellido}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {profesor.email}
                        </div>
                        {profesor.telefono && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {profesor.telefono}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {profesor.especialidades?.map((nivel: string) => (
                          <Badge key={nivel} variant="secondary" className="text-xs">
                            {nivel}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {alumnosPorProfesor[profesor.id] || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      {profesor.activo ? (
                        <Badge variant="success">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/profesores/${profesor.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
