'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { toast } from 'sonner'

interface DeleteVendedorButtonProps {
  vendedorId: string
  vendedorName: string
}

export function DeleteVendedorButton({ vendedorId, vendedorName }: DeleteVendedorButtonProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)

  async function handleDelete() {
    const response = await fetch(`/api/vendedores/${vendedorId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      toast.error(error.error || 'Error al eliminar vendedor')
      throw new Error(error.error)
    }

    toast.success('Vendedor eliminado exitosamente')
    router.refresh()
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={() => setDialogOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <DeleteConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Eliminar Vendedor"
        description="Esta acción eliminará permanentemente al vendedor del sistema. Los alumnos creados por este vendedor no serán eliminados."
        itemName={vendedorName}
        onConfirm={handleDelete}
      />
    </>
  )
}
