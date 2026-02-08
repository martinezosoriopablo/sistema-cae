import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { TablaAlumnos } from '@/components/tables/TablaAlumnos'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'

export default async function MisAlumnosPage() {
  const session = await requireRole(['vendedor'])
  const supabase = await createClient()

  const { data: alumnos } = await supabase
    .from('alumnos')
    .select('*')
    .eq('vendedor_id', session.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mis Alumnos</h1>
          <p className="text-muted-foreground">
            {alumnos?.length || 0} alumnos registrados
          </p>
        </div>
        <Link href="/vendedor/nuevo-alumno">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Alumno
          </Button>
        </Link>
      </div>

      <TablaAlumnos
        alumnos={alumnos || []}
        basePath="/vendedor/mis-alumnos"
      />
    </div>
  )
}
