'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TablaAlumnos } from '@/components/tables/TablaAlumnos'
import { FormNuevoAlumno } from '@/components/forms/FormNuevoAlumno'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { UserPlus, Loader2, Download, Upload } from 'lucide-react'
import Link from 'next/link'
import { Alumno } from '@/types'

export default function AlumnosPage() {
  const router = useRouter()
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  async function fetchAlumnos() {
    setLoading(true)
    try {
      const response = await fetch('/api/alumnos')
      if (response.ok) {
        const data = await response.json()
        setAlumnos(data)
      }
    } catch (error) {
      console.error('Error fetching alumnos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlumnos()
  }, [])

  const alumnosActivos = alumnos.filter(a => !a.bloqueado && a.horas_restantes > 0)
  const alumnosSinHoras = alumnos.filter(a => !a.bloqueado && a.horas_restantes <= 0)
  const alumnosBloqueados = alumnos.filter(a => a.bloqueado)

  function handleSuccess() {
    setDialogOpen(false)
    fetchAlumnos()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion de Alumnos</h1>
          <p className="text-muted-foreground">
            {alumnos.length} alumnos en total
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/alumnos/carga-masiva">
              <Upload className="h-4 w-4 mr-2" />
              Carga Masiva
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <a href="/api/alumnos/exportar" download>
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </a>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Alumno
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Alumno</DialogTitle>
              <DialogDescription>
                Complete los datos del nuevo alumno
              </DialogDescription>
            </DialogHeader>
            <FormNuevoAlumno onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Tabs defaultValue="todos">
        <TabsList>
          <TabsTrigger value="todos">
            Todos ({alumnos.length})
          </TabsTrigger>
          <TabsTrigger value="activos">
            Activos ({alumnosActivos.length})
          </TabsTrigger>
          <TabsTrigger value="sin-horas">
            Sin horas ({alumnosSinHoras.length})
          </TabsTrigger>
          <TabsTrigger value="bloqueados">
            Bloqueados ({alumnosBloqueados.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="mt-4">
          <TablaAlumnos alumnos={alumnos} />
        </TabsContent>

        <TabsContent value="activos" className="mt-4">
          <TablaAlumnos alumnos={alumnosActivos} />
        </TabsContent>

        <TabsContent value="sin-horas" className="mt-4">
          <TablaAlumnos alumnos={alumnosSinHoras} />
        </TabsContent>

        <TabsContent value="bloqueados" className="mt-4">
          <TablaAlumnos alumnos={alumnosBloqueados} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
