'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { nuevoMaterialAlumnoSchema, NuevoMaterialAlumnoInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Upload, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'

interface FormMaterialAlumnoProps {
  alumnoId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const TIPOS_MATERIAL = [
  { value: 'documento', label: 'Documento' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'ejercicio', label: 'Ejercicio' },
]

export function FormMaterialAlumno({ alumnoId, open, onOpenChange, onSuccess }: FormMaterialAlumnoProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [modoArchivo, setModoArchivo] = useState(false)
  const [archivo, setArchivo] = useState<File | null>(null)

  const form = useForm<NuevoMaterialAlumnoInput>({
    resolver: zodResolver(nuevoMaterialAlumnoSchema),
    defaultValues: {
      alumno_id: alumnoId,
      titulo: '',
      descripcion: '',
      tipo: 'documento',
      url: '',
    },
  })

  // Actualizar alumno_id cuando cambia el alumno seleccionado
  useEffect(() => {
    form.setValue('alumno_id', alumnoId)
  }, [alumnoId, form])

  function handleReset() {
    form.reset({
      alumno_id: alumnoId,
      titulo: '',
      descripcion: '',
      tipo: 'documento',
      url: '',
    })
    setArchivo(null)
    setModoArchivo(false)
  }

  function handleClose(open: boolean) {
    if (!open) {
      handleReset()
    }
    onOpenChange(open)
  }

  async function onSubmit(data: NuevoMaterialAlumnoInput) {
    setIsLoading(true)

    try {
      if (modoArchivo) {
        if (!archivo) {
          toast.error('Selecciona un archivo')
          setIsLoading(false)
          return
        }

        const formData = new FormData()
        formData.append('archivo', archivo)
        formData.append('alumno_id', alumnoId)
        formData.append('titulo', data.titulo)
        formData.append('tipo', data.tipo)
        if (data.descripcion) {
          formData.append('descripcion', data.descripcion)
        }

        const response = await fetch('/api/materiales-alumno', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Error al subir archivo')
        }
      } else {
        if (!data.url) {
          toast.error('Ingresa una URL')
          setIsLoading(false)
          return
        }

        const response = await fetch('/api/materiales-alumno', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Error al crear material')
        }
      }

      toast.success('Material agregado exitosamente')
      handleClose(false)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear material')
    } finally {
      setIsLoading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo excede el límite de 10MB')
      return
    }

    setArchivo(file)
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Material</DialogTitle>
          <DialogDescription>
            Sube un archivo o comparte un enlace con tu alumno.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Toggle archivo / enlace */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={!modoArchivo ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setModoArchivo(false)}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Enlace URL
            </Button>
            <Button
              type="button"
              variant={modoArchivo ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setModoArchivo(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Subir Archivo
            </Button>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              placeholder="Ej: Ejercicios de vocabulario"
              {...form.register('titulo')}
            />
            {form.formState.errors.titulo && (
              <p className="text-sm text-destructive">{form.formState.errors.titulo.message}</p>
            )}
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo de material</Label>
            <Select
              value={form.watch('tipo')}
              onValueChange={(value) => form.setValue('tipo', value as NuevoMaterialAlumnoInput['tipo'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_MATERIAL.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Textarea
              id="descripcion"
              placeholder="Descripción del material..."
              rows={3}
              {...form.register('descripcion')}
            />
            {form.formState.errors.descripcion && (
              <p className="text-sm text-destructive">{form.formState.errors.descripcion.message}</p>
            )}
          </div>

          {/* Archivo o URL */}
          {modoArchivo ? (
            <div className="space-y-2">
              <Label htmlFor="archivo">Archivo</Label>
              <Input
                id="archivo"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.mp3,.mp4"
                onChange={handleFileChange}
              />
              {archivo && (
                <p className="text-sm text-muted-foreground">
                  {archivo.name} ({formatFileSize(archivo.size)})
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Máximo 10MB. Formatos: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, MP3, MP4
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="url">URL del enlace</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://..."
                {...form.register('url')}
              />
              {form.formState.errors.url && (
                <p className="text-sm text-destructive">{form.formState.errors.url.message}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {modoArchivo ? 'Subiendo...' : 'Guardando...'}
                </>
              ) : (
                'Agregar Material'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
