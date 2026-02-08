'use client'

import { Alumno } from '@/types'
import { formatDate, formatHorasRestantes } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Eye, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { UMBRAL_ALERTA_HORAS } from '@/lib/constants'

interface TablaAlumnosProps {
  alumnos: Alumno[]
  showVendedor?: boolean
  showProfesor?: boolean
  basePath?: string
}

export function TablaAlumnos({
  alumnos,
  showVendedor = false,
  showProfesor = false,
  basePath = '/admin/alumnos',
}: TablaAlumnosProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Alumno</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Nivel</TableHead>
            <TableHead>Horas</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alumnos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No hay alumnos para mostrar
              </TableCell>
            </TableRow>
          ) : (
            alumnos.map((alumno) => (
              <TableRow key={alumno.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {alumno.nombre} {alumno.apellido}
                    </p>
                    <p className="text-sm text-muted-foreground">{alumno.telefono}</p>
                  </div>
                </TableCell>
                <TableCell>{alumno.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{alumno.nivel_actual}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={alumno.horas_restantes <= UMBRAL_ALERTA_HORAS ? 'text-destructive font-medium' : ''}>
                      {formatHorasRestantes(alumno.horas_restantes)}
                    </span>
                    {alumno.horas_restantes <= UMBRAL_ALERTA_HORAS && alumno.horas_restantes > 0 && (
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    de {alumno.horas_contratadas}h contratadas
                  </p>
                </TableCell>
                <TableCell>
                  {alumno.bloqueado ? (
                    <Badge variant="destructive">Bloqueado</Badge>
                  ) : alumno.horas_restantes <= 0 ? (
                    <Badge variant="warning">Sin horas</Badge>
                  ) : (
                    <Badge variant="success">Activo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`${basePath}/${alumno.id}`}>
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
    </div>
  )
}
