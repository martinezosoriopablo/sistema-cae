import { requireRole } from '@/lib/auth'
import { FormNuevoAlumno } from '@/components/forms/FormNuevoAlumno'

export default async function NuevoAlumnoPage() {
  await requireRole(['vendedor'])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Registrar Nuevo Alumno</h1>
        <p className="text-muted-foreground">
          Complete el formulario para registrar un nuevo estudiante
        </p>
      </div>

      <FormNuevoAlumno />
    </div>
  )
}
