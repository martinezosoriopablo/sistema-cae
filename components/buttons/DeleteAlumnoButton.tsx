'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { toast } from 'sonner'

interface DeleteAlumnoButtonProps {
  alumnoId: string
  alumnoName: string
  redirectUrl?: string
}

export function DeleteAlumnoButton({ alumnoId, alumnoName, redirectUrl = '/admin/alumnos' }: DeleteAlumnoButtonProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)

  async function handleDelete() {
    const response = await fetch(`/api/alumnos/${alumnoId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      toast.error(error.error || 'Error al eliminar alumno')
      throw new Error(error.error)
    }

    toast.success('Alumno eliminado exitosamente')
    router.push(redirectUrl)
    router.refresh()
  }

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setDialogOpen(true)}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Eliminar Alumno
      </Button>

      <DeleteConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Eliminar Alumno"
        description="Esta acción eliminará permanentemente al alumno del sistema, incluyendo todos sus horarios, clases y datos asociados."
        itemName={alumnoName}
        onConfirm={handleDelete}
      />
    </>
  )
}
