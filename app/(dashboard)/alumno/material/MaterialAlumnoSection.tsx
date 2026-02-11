'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Video, Headphones, PenTool, ExternalLink, Download } from 'lucide-react'
import { toast } from 'sonner'
import { MaterialAlumno } from '@/types'

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

interface MaterialAlumnoSectionProps {
  materiales: MaterialAlumno[]
}

export function MaterialAlumnoSection({ materiales }: MaterialAlumnoSectionProps) {
  async function handleDescargar(material: MaterialAlumno) {
    try {
      const response = await fetch(`/api/materiales-alumno/descargar/${material.id}`)
      if (!response.ok) {
        throw new Error('Error al generar enlace de descarga')
      }
      const { url } = await response.json()
      window.open(url, '_blank')
    } catch {
      toast.error('Error al descargar archivo')
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Material de mi Profesor</h2>
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
    </div>
  )
}
