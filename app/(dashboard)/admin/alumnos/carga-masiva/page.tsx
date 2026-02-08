import { requireRole } from '@/lib/auth'
import { FormCargaMasiva } from '@/components/forms/FormCargaMasiva'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function CargaMasivaAlumnosPage() {
  await requireRole(['admin'])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/alumnos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Carga Masiva de Alumnos</h1>
          <p className="text-muted-foreground">
            Importa multiples alumnos desde un archivo Excel
          </p>
        </div>
      </div>

      <FormCargaMasiva tipo="alumnos" />
    </div>
  )
}
