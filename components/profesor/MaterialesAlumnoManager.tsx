'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormMaterialAlumno } from '@/components/forms/FormMaterialAlumno'
import {
  Plus,
  FileText,
  Video,
  Headphones,
  PenTool,
  ExternalLink,
  Download,
  Trash2,
  Loader2,
  BookOpen,
} from 'lucide-react'
import { toast } from 'sonner'
import { MaterialAlumno } from '@/types'

interface Alumno {
  id: string
  nombre: string
  apellido: string
  nivel_actual: string
}

interface MaterialesAlumnoManagerProps {
  alumnos: Alumno[]
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  documento: FileText,
  video: Video,
  audio: Headphones,
  ejercicio: PenTool,
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MaterialesAlumnoManager({ alumnos }: MaterialesAlumnoManagerProps) {
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<string>('')
  const [materiales, setMateriales] = useState<MaterialAlumno[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [materialEliminar, setMaterialEliminar] = useState<MaterialAlumno | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const cargarMateriales = useCallback(async (alumnoId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/materiales-alumno?alumno_id=${alumnoId}`)
      if (!response.ok) {
        throw new Error('Error al cargar materiales')
      }
      const data = await response.json()
      setMateriales(data)
    } catch (error) {
      toast.error('Error al cargar materiales')
      setMateriales([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (alumnoSeleccionado) {
      cargarMateriales(alumnoSeleccionado)
    } else {
      setMateriales([])
    }
  }, [alumnoSeleccionado, cargarMateriales])

  async function handleDescargar(material: MaterialAlumno) {
    try {
      const response = await fetch(`/api/materiales-alumno/descargar/${material.id}`)
      if (!response.ok) {
        throw new Error('Error al generar enlace de descarga')
      }
      const { url } = await response.json()
      window.open(url, '_blank')
    } catch (error) {
      toast.error('Error al descargar archivo')
    }
  }

  async function handleEliminar() {
    if (!materialEliminar) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/materiales-alumno/${materialEliminar.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar material')
      }

      toast.success('Material eliminado')
      setMaterialEliminar(null)
      cargarMateriales(alumnoSeleccionado)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar material')
    } finally {
      setIsDeleting(false)
    }
  }

  const alumnoActual = alumnos.find(a => a.id === alumnoSeleccionado)

  return (
    <div className="space-y-6">
      {/* Selector de alumno */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Alumno</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={alumnoSeleccionado} onValueChange={setAlumnoSeleccionado}>
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue placeholder="Selecciona un alumno" />
            </SelectTrigger>
            <SelectContent>
              {alumnos.map((alumno) => (
                <SelectItem key={alumno.id} value={alumno.id}>
                  {alumno.nombre} {alumno.apellido} - Nivel {alumno.nivel_actual}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Materiales del alumno seleccionado */}
      {alumnoSeleccionado && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Materiales de {alumnoActual?.nombre} {alumnoActual?.apellido}
            </h2>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Material
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : materiales.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {materiales.map((material) => {
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
                          {material.es_archivo && (
                            <Badge variant="secondary">Archivo</Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setMaterialEliminar(material)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardTitle className="text-lg mt-2">
                        {material.titulo}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {material.descripcion && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {material.descripcion}
                        </p>
                      )}
                      {material.es_archivo && material.archivo_nombre && (
                        <p className="text-xs text-muted-foreground mb-3">
                          {material.archivo_nombre}
                          {material.archivo_tamano && ` (${formatFileSize(material.archivo_tamano)})`}
                        </p>
                      )}
                      {material.es_archivo ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleDescargar(material)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      ) : (
                        <a
                          href={material.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" className="w-full">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir enlace
                          </Button>
                        </a>
                      )}
                      <p className="text-xs text-muted-foreground mt-2 text-right">
                        {new Date(material.created_at).toLocaleDateString('es-CL')}
                      </p>
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
                  No hay materiales para este alumno
                </p>
                <Button className="mt-4" onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar primer material
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Dialog de agregar material */}
          <FormMaterialAlumno
            alumnoId={alumnoSeleccionado}
            open={showForm}
            onOpenChange={setShowForm}
            onSuccess={() => cargarMateriales(alumnoSeleccionado)}
          />

          {/* Dialog de confirmación de eliminación */}
          <Dialog open={!!materialEliminar} onOpenChange={(open) => !open && setMaterialEliminar(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Eliminar Material</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que quieres eliminar &quot;{materialEliminar?.titulo}&quot;?
                  {materialEliminar?.es_archivo && ' El archivo también será eliminado.'}
                  Esta acción no se puede deshacer.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setMaterialEliminar(null)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleEliminar}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
