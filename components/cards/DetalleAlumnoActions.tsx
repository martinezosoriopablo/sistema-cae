'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Unlock, UserPlus, Loader2, Clock, PlusCircle, Edit } from 'lucide-react'
import { FormEditarHorarios } from '@/components/forms/FormEditarHorarios'
import { FormAgregarHoras } from '@/components/forms/FormAgregarHoras'
import { FormEditarAlumno } from '@/components/forms/FormEditarAlumno'
import { DeleteAlumnoButton } from '@/components/buttons/DeleteAlumnoButton'
import { toast } from 'sonner'
import { Alumno, Profesor } from '@/types'

interface DetalleAlumnoActionsProps {
  alumno: Alumno & { profesor?: Profesor | null }
  profesores: { id: string; nombre: string; apellido: string; especialidades?: string[] }[]
}

export function DetalleAlumnoActions({ alumno, profesores }: DetalleAlumnoActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedProfesor, setSelectedProfesor] = useState(alumno.profesor_id || '')
  const [motivoBloqueo, setMotivoBloqueo] = useState('')
  const [dialogOpen, setDialogOpen] = useState<'profesor' | 'bloquear' | 'horarios' | 'horas' | 'editar' | null>(null)

  async function handleAsignarProfesor() {
    if (!selectedProfesor) {
      toast.error('Selecciona un profesor')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/alumnos/${alumno.id}/asignar-profesor`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profesor_id: selectedProfesor }),
      })

      if (!response.ok) {
        throw new Error('Error al asignar profesor')
      }

      toast.success('Profesor asignado exitosamente')
      setDialogOpen(null)
      router.refresh()
    } catch (error) {
      toast.error('Error al asignar profesor')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleBloqueo() {
    setLoading(true)
    try {
      const response = await fetch(`/api/alumnos/${alumno.id}/bloquear`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bloqueado: !alumno.bloqueado,
          motivo_bloqueo: alumno.bloqueado ? null : motivoBloqueo,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar estado')
      }

      toast.success(alumno.bloqueado ? 'Alumno desbloqueado' : 'Alumno bloqueado')
      setDialogOpen(null)
      setMotivoBloqueo('')
      router.refresh()
    } catch (error) {
      toast.error('Error al actualizar estado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Editar Datos */}
      <Dialog open={dialogOpen === 'editar'} onOpenChange={(open) => setDialogOpen(open ? 'editar' : null)}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Editar Datos
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Alumno</DialogTitle>
            <DialogDescription>
              Modifica los datos de {alumno.nombre} {alumno.apellido}
            </DialogDescription>
          </DialogHeader>
          <FormEditarAlumno
            alumno={alumno}
            onSuccess={() => {
              setDialogOpen(null)
              router.refresh()
            }}
            onCancel={() => setDialogOpen(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Asignar profesor */}
      <Dialog open={dialogOpen === 'profesor'} onOpenChange={(open) => setDialogOpen(open ? 'profesor' : null)}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            {alumno.profesor ? 'Cambiar profesor' : 'Asignar profesor'}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Profesor</DialogTitle>
            <DialogDescription>
              Selecciona el profesor para {alumno.nombre} {alumno.apellido}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Profesor</Label>
            <Select value={selectedProfesor} onValueChange={setSelectedProfesor}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecciona un profesor" />
              </SelectTrigger>
              <SelectContent>
                {profesores.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.nombre} {prof.apellido}
                    {prof.especialidades && (
                      <span className="text-muted-foreground ml-2">
                        ({prof.especialidades.join(', ')})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>
              Cancelar
            </Button>
            <Button onClick={handleAsignarProfesor} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Asignar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editar Horarios */}
      <Dialog open={dialogOpen === 'horarios'} onOpenChange={(open) => setDialogOpen(open ? 'horarios' : null)}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Clock className="h-4 w-4 mr-2" />
            Editar Horarios
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Horarios</DialogTitle>
            <DialogDescription>
              Modifica los horarios de clase de {alumno.nombre} {alumno.apellido}
            </DialogDescription>
          </DialogHeader>
          <FormEditarHorarios
            alumnoId={alumno.id}
            onSuccess={() => {
              setDialogOpen(null)
              router.refresh()
            }}
            onCancel={() => setDialogOpen(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Agregar Horas */}
      <Dialog open={dialogOpen === 'horas'} onOpenChange={(open) => setDialogOpen(open ? 'horas' : null)}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <PlusCircle className="h-4 w-4 mr-2" />
            Agregar Horas
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Horas</DialogTitle>
            <DialogDescription>
              Agrega horas adicionales a {alumno.nombre} {alumno.apellido}
            </DialogDescription>
          </DialogHeader>
          <FormAgregarHoras
            alumnoId={alumno.id}
            horasActuales={alumno.horas_restantes}
            onSuccess={() => {
              setDialogOpen(null)
              router.refresh()
            }}
            onCancel={() => setDialogOpen(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Bloquear/Desbloquear */}
      <Dialog open={dialogOpen === 'bloquear'} onOpenChange={(open) => setDialogOpen(open ? 'bloquear' : null)}>
        <DialogTrigger asChild>
          <Button variant={alumno.bloqueado ? 'default' : 'destructive'}>
            {alumno.bloqueado ? (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                Desbloquear
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Bloquear
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {alumno.bloqueado ? 'Desbloquear Alumno' : 'Bloquear Alumno'}
            </DialogTitle>
            <DialogDescription>
              {alumno.bloqueado
                ? `¿Estás seguro de desbloquear a ${alumno.nombre} ${alumno.apellido}?`
                : `El alumno no podrá acceder a sus clases mientras esté bloqueado.`}
            </DialogDescription>
          </DialogHeader>
          {!alumno.bloqueado && (
            <div className="py-4">
              <Label>Motivo del bloqueo</Label>
              <Input
                className="mt-2"
                placeholder="Ej: Falta de pago"
                value={motivoBloqueo}
                onChange={(e) => setMotivoBloqueo(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>
              Cancelar
            </Button>
            <Button
              variant={alumno.bloqueado ? 'default' : 'destructive'}
              onClick={handleToggleBloqueo}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : alumno.bloqueado ? (
                'Desbloquear'
              ) : (
                'Bloquear'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Eliminar Alumno */}
      <DeleteAlumnoButton
        alumnoId={alumno.id}
        alumnoName={`${alumno.nombre} ${alumno.apellido}`}
      />
    </div>
  )
}
