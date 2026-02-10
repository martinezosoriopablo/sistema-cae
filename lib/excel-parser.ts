import * as XLSX from 'xlsx'
import { filaAlumnoExcelSchema, filaProfesorExcelSchema } from './validations'

export interface ParseResult<T> {
  data: T[]
  errors: { fila: number; errores: string[] }[]
  totalFilas: number
  filasValidas: number
  filasConError: number
}

export interface AlumnoExcelRow {
  nombre: string
  apellido: string
  email: string
  telefono: string
  rut?: string
  nivel_actual?: string
  modalidad?: string
  horas_contratadas?: number
}

export interface ProfesorExcelRow {
  nombre: string
  apellido: string
  email: string
  telefono?: string
  especialidades?: string[]
  zoom_link?: string
}

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .trim()
}

function mapHeaders(row: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeHeader(key)
    mapped[normalizedKey] = value
  }
  return mapped
}

export function parseExcelFile(buffer: ArrayBuffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const jsonData = XLSX.utils.sheet_to_json(worksheet)
  return jsonData.map((row) => mapHeaders(row as Record<string, unknown>))
}

export function parseAlumnosExcel(buffer: ArrayBuffer): ParseResult<AlumnoExcelRow> {
  const rows = parseExcelFile(buffer)
  const data: AlumnoExcelRow[] = []
  const errors: { fila: number; errores: string[] }[] = []

  rows.forEach((row, index) => {
    const filaNumero = index + 2 // +2 porque fila 1 es encabezado y arrays empiezan en 0

    // Normalizar campos
    const normalizedRow = {
      nombre: String(row.nombre || '').trim(),
      apellido: String(row.apellido || '').trim(),
      email: String(row.email || '').trim().toLowerCase(),
      telefono: String(row.telefono || '').trim(),
      rut: row.rut ? String(row.rut).trim() : undefined,
      nivel_actual: row.nivel_actual ? String(row.nivel_actual).toUpperCase().trim() : 'A1',
      modalidad: row.modalidad ? String(row.modalidad).toLowerCase().trim() : 'privado',
      horas_contratadas: row.horas_contratadas ? Number(row.horas_contratadas) : 10,
    }

    const validation = filaAlumnoExcelSchema.safeParse(normalizedRow)

    if (validation.success) {
      data.push(validation.data as AlumnoExcelRow)
    } else {
      errors.push({
        fila: filaNumero,
        errores: validation.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
      })
    }
  })

  return {
    data,
    errors,
    totalFilas: rows.length,
    filasValidas: data.length,
    filasConError: errors.length,
  }
}

export function parseProfesoresExcel(buffer: ArrayBuffer): ParseResult<ProfesorExcelRow> {
  const rows = parseExcelFile(buffer)
  const data: ProfesorExcelRow[] = []
  const errors: { fila: number; errores: string[] }[] = []

  rows.forEach((row, index) => {
    const filaNumero = index + 2

    // Convertir especialidades de string "A1,B1,C1" a array ["A1","B1","C1"]
    const especialidadesRaw = row.especialidades ? String(row.especialidades).trim() : undefined
    const especialidades = especialidadesRaw
      ? especialidadesRaw.split(',').map((e: string) => e.trim().toUpperCase())
      : undefined

    const normalizedRow = {
      nombre: String(row.nombre || '').trim(),
      apellido: String(row.apellido || '').trim(),
      email: String(row.email || '').trim().toLowerCase(),
      telefono: row.telefono ? String(row.telefono).trim() : undefined,
      especialidades,
      zoom_link: row.zoom_link ? String(row.zoom_link).trim() : undefined,
    }

    const validation = filaProfesorExcelSchema.safeParse(normalizedRow)

    if (validation.success) {
      data.push(validation.data as ProfesorExcelRow)
    } else {
      errors.push({
        fila: filaNumero,
        errores: validation.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
      })
    }
  })

  return {
    data,
    errors,
    totalFilas: rows.length,
    filasValidas: data.length,
    filasConError: errors.length,
  }
}

export function generateExcelTemplate(type: 'alumnos' | 'profesores'): ArrayBuffer {
  const wb = XLSX.utils.book_new()

  if (type === 'alumnos') {
    const headers = [
      ['nombre', 'apellido', 'email', 'telefono', 'rut', 'nivel_actual', 'modalidad', 'horas_contratadas'],
      ['Juan', 'Perez', 'juan@email.com', '+56912345678', '12.345.678-9', 'A1', 'privado', 10],
    ]
    const ws = XLSX.utils.aoa_to_sheet(headers)
    XLSX.utils.book_append_sheet(wb, ws, 'Alumnos')
  } else {
    const headers = [
      ['nombre', 'apellido', 'email', 'telefono', 'especialidades', 'zoom_link'],
      ['Maria', 'Garcia', 'maria@email.com', '+56987654321', 'A1,A2,B1', 'https://zoom.us/j/123456'],
    ]
    const ws = XLSX.utils.aoa_to_sheet(headers)
    XLSX.utils.book_append_sheet(wb, ws, 'Profesores')
  }

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string
): ArrayBuffer {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Datos')
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
}
