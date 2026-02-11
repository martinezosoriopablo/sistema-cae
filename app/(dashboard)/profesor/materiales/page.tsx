import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { MaterialesAlumnoManager } from '@/components/profesor/MaterialesAlumnoManager'

export default async function ProfesorMaterialesPage() {
  const session = await requireRole(['profesor'])
  const supabase = await createClient()

  // Obtener datos del profesor
  const { data: profesor } = await supabase
    .from('profesores')
    .select('id')
    .eq('user_id', session.id)
    .single()

  if (!profesor) {
    return <div>Error: Profesor no encontrado</div>
  }

  // Obtener alumnos asignados al profesor
  const { data: alumnos } = await supabase
    .from('alumnos')
    .select('id, nombre, apellido, nivel_actual')
    .eq('profesor_id', profesor.id)
    .eq('bloqueado', false)
    .order('nombre')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Materiales por Alumno</h1>
        <p className="text-muted-foreground">
          Sube archivos o comparte enlaces específicos para cada alumno
        </p>
      </div>

      {alumnos && alumnos.length > 0 ? (
        <MaterialesAlumnoManager alumnos={alumnos} />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No tienes alumnos asignados actualmente
        </div>
      )}
    </div>
  )
}
