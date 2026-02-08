'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, Upload, FileSpreadsheet, CheckCircle2, XCircle, Download, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface FormCargaMasivaProps {
  tipo: 'alumnos' | 'profesores'
  onSuccess?: () => void
}

interface ResultadoCarga {
  exitosos: { email: string; nombre: string }[]
  errores: { email: string; error: string }[]
  totalProcesados: number
}

interface RespuestaCarga {
  message: string
  resultado: ResultadoCarga
  validacionExcel: {
    totalFilas: number
    filasValidas: number
    filasConError: number
  }
}

export function FormCargaMasiva({ tipo, onSuccess }: FormCargaMasivaProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [resultado, setResultado] = useState<RespuestaCarga | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
        toast.error('Por favor selecciona un archivo Excel (.xlsx o .xls)')
        return
      }
      setFile(selectedFile)
      setResultado(null)
    }
  }

  async function handleUpload() {
    if (!file) {
      toast.error('Por favor selecciona un archivo')
      return
    }

    setIsLoading(true)
    setResultado(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/${tipo}/carga-masiva`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar archivo')
      }

      setResultado(data)

      if (data.resultado.exitosos.length > 0) {
        toast.success(`Se crearon ${data.resultado.exitosos.length} ${tipo} exitosamente`)
        onSuccess?.()
      }

      if (data.resultado.errores.length > 0) {
        toast.warning(`${data.resultado.errores.length} registros con errores`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al procesar archivo')
    } finally {
      setIsLoading(false)
    }
  }

  function handleDownloadTemplate() {
    const link = document.createElement('a')
    link.href = `/api/${tipo}/template`
    link.download = `plantilla_${tipo}.xlsx`
    link.click()
  }

  function resetForm() {
    setFile(null)
    setResultado(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cargar archivo Excel</CardTitle>
          <CardDescription>
            Sube un archivo Excel con los datos de los {tipo}.
            El archivo debe tener las columnas requeridas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Descargar plantilla
            </Button>
          </div>

          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              {file ? (
                <>
                  <FileSpreadsheet className="h-12 w-12 text-green-500" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <p className="font-medium">Haz clic para seleccionar archivo</p>
                  <p className="text-sm text-muted-foreground">
                    Archivos .xlsx o .xls
                  </p>
                </>
              )}
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            {file && (
              <Button variant="outline" onClick={resetForm} disabled={isLoading}>
                Cancelar
              </Button>
            )}
            <Button onClick={handleUpload} disabled={!file || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Procesar archivo
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {resultado && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de la carga</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{resultado.validacionExcel.totalFilas}</p>
                <p className="text-sm text-muted-foreground">Total filas</p>
              </div>
              <div className="text-center p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{resultado.resultado.exitosos.length}</p>
                <p className="text-sm text-muted-foreground">Exitosos</p>
              </div>
              <div className="text-center p-4 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{resultado.resultado.errores.length}</p>
                <p className="text-sm text-muted-foreground">Con errores</p>
              </div>
            </div>

            {resultado.resultado.exitosos.length > 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Registros creados exitosamente</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {resultado.resultado.exitosos.map((item, idx) => (
                      <li key={idx} className="text-sm">
                        {item.nombre} ({item.email})
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {resultado.resultado.errores.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Registros con errores</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {resultado.resultado.errores.map((item, idx) => (
                      <li key={idx} className="text-sm">
                        <strong>{item.email}:</strong> {item.error}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Formato del archivo</CardTitle>
        </CardHeader>
        <CardContent>
          {tipo === 'alumnos' ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                El archivo debe contener las siguientes columnas:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li><strong>nombre</strong> (requerido)</li>
                <li><strong>apellido</strong> (requerido)</li>
                <li><strong>email</strong> (requerido)</li>
                <li><strong>telefono</strong> (requerido)</li>
                <li><strong>rut</strong> (opcional)</li>
                <li><strong>nivel_actual</strong> (opcional, default: A1)</li>
                <li><strong>horas_contratadas</strong> (opcional, default: 10)</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                El archivo debe contener las siguientes columnas:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li><strong>nombre</strong> (requerido)</li>
                <li><strong>apellido</strong> (requerido)</li>
                <li><strong>email</strong> (requerido)</li>
                <li><strong>telefono</strong> (opcional)</li>
                <li><strong>especialidades</strong> (opcional, separadas por coma: A1,A2,B1)</li>
                <li><strong>zoom_link</strong> (opcional)</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
