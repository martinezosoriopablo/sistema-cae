import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, FileText, Video, Headphones, PenTool, ExternalLink } from 'lucide-react'
import { MaterialAlumnoSection } from './MaterialAlumnoSection'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  documento: FileText,
  video: Video,
  audio: Headphones,
  ejercicio: PenTool,
}

export default async function MaterialPage() {
  const session = await requireRole(['alumno'])
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: alumno } = await supabase
    .from('alumnos')
    .select('id, nivel_actual')
    .eq('user_id', session.id)
    .single()

  if (!alumno) {
    return <div>Error al cargar datos</div>
  }

  // Obtener materiales del nivel actual y anteriores
  const nivelesOrden = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const indiceNivel = nivelesOrden.indexOf(alumno.nivel_actual)
  const nivelesPermitidos = nivelesOrden.slice(0, indiceNivel + 1)

  const { data: materiales } = await supabase
    .from('materiales')
    .select('*')
    .in('nivel', nivelesPermitidos)
    .order('nivel')
    .order('titulo')

  // Obtener materiales personalizados del profesor
  const { data: materialesProfesor } = await adminClient
    .from('materiales_alumno')
    .select('*')
    .eq('alumno_id', alumno.id)
    .order('created_at', { ascending: false })

  // Agrupar por nivel
  type MaterialItem = NonNullable<typeof materiales>[number]
  const materialesPorNivel = materiales?.reduce((acc, mat) => {
    if (!acc[mat.nivel]) {
      acc[mat.nivel] = []
    }
    acc[mat.nivel].push(mat)
    return acc
  }, {} as Record<string, MaterialItem[]>) || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Material de Estudio</h1>
        <p className="text-muted-foreground">
          Recursos disponibles para tu nivel ({alumno.nivel_actual})
        </p>
      </div>

      {/* Material personalizado del profesor */}
      {materialesProfesor && materialesProfesor.length > 0 && (
        <MaterialAlumnoSection materiales={materialesProfesor} />
      )}

      {/* Material global por nivel */}
      {Object.keys(materialesPorNivel).length > 0 ? (
        <Tabs defaultValue={alumno.nivel_actual}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {nivelesPermitidos.map((nivel) => (
              <TabsTrigger
                key={nivel}
                value={nivel}
                disabled={!materialesPorNivel[nivel]}
              >
                {nivel}
                {materialesPorNivel[nivel] && (
                  <Badge variant="secondary" className="ml-2">
                    {materialesPorNivel[nivel].length}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {nivelesPermitidos.map((nivel) => {
            const materialesNivel = materialesPorNivel[nivel]
            return (
            <TabsContent key={nivel} value={nivel} className="mt-6">
              {materialesNivel ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {materialesNivel.map((material: MaterialItem) => {
                    const Icon = iconMap[material.tipo] || FileText
                    return (
                      <Card key={material.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-muted rounded-lg">
                                <Icon className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <Badge variant="outline" className="capitalize">
                                {material.tipo}
                              </Badge>
                            </div>
                          </div>
                          <CardTitle className="text-lg mt-2">
                            {material.titulo}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {material.descripcion && (
                            <p className="text-sm text-muted-foreground mb-4">
                              {material.descripcion}
                            </p>
                          )}
                          <a
                            href={material.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" className="w-full">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Abrir
                            </Button>
                          </a>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No hay material disponible para este nivel
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )})}

        </Tabs>
      ) : (
        !materialesProfesor?.length && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No hay material disponible</p>
              <p className="text-muted-foreground">
                El material de estudio se agregará próximamente
              </p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
