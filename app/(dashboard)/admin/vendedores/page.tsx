import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Mail, Phone, Users } from 'lucide-react'
import { FormNuevoVendedor } from '@/components/forms/FormVendedor'
import { DeleteVendedorButton } from '@/components/buttons/DeleteVendedorButton'

export default async function VendedoresPage() {
  await requireRole(['admin'])
  const supabase = await createClient()

  const { data: vendedores } = await supabase
    .from('usuarios')
    .select('*')
    .eq('rol', 'vendedor')
    .order('nombre')

  // Contar alumnos creados por cada vendedor
  const { data: conteoAlumnos } = await supabase
    .from('alumnos')
    .select('vendedor_id')
    .not('vendedor_id', 'is', null)

  const alumnosPorVendedor = conteoAlumnos?.reduce((acc, curr) => {
    acc[curr.vendedor_id] = (acc[curr.vendedor_id] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Vendedores</h1>
          <p className="text-muted-foreground">
            {vendedores?.length || 0} vendedores registrados
          </p>
        </div>
        <FormNuevoVendedor />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Alumnos Creados</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!vendedores || vendedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No hay vendedores registrados
                  </TableCell>
                </TableRow>
              ) : (
                vendedores.map((vendedor) => (
                  <TableRow key={vendedor.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {vendedor.nombre} {vendedor.apellido}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {vendedor.email}
                        </div>
                        {vendedor.telefono && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {vendedor.telefono}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {alumnosPorVendedor[vendedor.id] || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteVendedorButton
                        vendedorId={vendedor.id}
                        vendedorName={`${vendedor.nombre} ${vendedor.apellido}`}
                      />
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
