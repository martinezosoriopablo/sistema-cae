'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { toast } from 'sonner'

interface DeleteProfesorButtonProps {
  profesorId: string
  profesorName: string
  alumnosCount?: number
  redirectUrl?: string
}

export function DeleteProfesorButton({
  profesorId,
  profesorName,
  alumnosCount = 0,
  redirectUrl = '/admin/profesores'
}: DeleteProfesorButtonProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)

  async function handleDelete() {
    const response = await fetch(`/api/profesores/${profesorId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      toast.error(error.error || 'Error al eliminar profesor')
      throw new Error(error.error)
    }

    toast.success('Profesor eliminado exitosamente')
    router.push(redirectUrl)
    router.refresh()
  }

  const description = alumnosCount > 0
    ? `Esta acción eliminará permanentemente al profesor del sistema. Los ${alumnosCount} alumno(s) asignados quedarán sin profesor.`
    : 'Esta acción eliminará permanentemente al profesor del sistema, incluyendo sus clases y datos asociados.'

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setDialogOpen(true)}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Eliminar Profesor
      </Button>

      <DeleteConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Eliminar Profesor"
        description={description}
        itemName={profesorName}
        onConfirm={handleDelete}
      />
    </>
  )
}
