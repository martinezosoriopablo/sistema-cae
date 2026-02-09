import { z } from 'zod'

// Validación de login
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

// Validación de nuevo alumno
export const nuevoAlumnoSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(9, 'El teléfono debe tener al menos 9 dígitos'),
  rut: z.string().optional(),
  nivel_actual: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  horas_contratadas: z.number().min(1, 'Debe contratar al menos 1 hora').max(500, 'Máximo 500 horas'),
  horarios: z.array(z.object({
    dia: z.enum(['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']),
    hora_inicio: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora inválida'),
    hora_fin: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora inválida'),
  })).min(1, 'Debe definir al menos un horario'),
})

// Validación de actualización de alumno
export const actualizarAlumnoSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').optional(),
  telefono: z.string().min(9, 'El teléfono debe tener al menos 9 dígitos').optional(),
  nivel_actual: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
  horas_contratadas: z.number().min(1).max(500).optional(),
  horas_restantes: z.number().min(0).optional(),
  notas: z.string().optional(),
})

// Validación de nuevo profesor
export const nuevoProfesorSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(9, 'El teléfono debe tener al menos 9 dígitos').optional(),
  especialidades: z.array(z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])).optional(),
  zoom_link: z.string().url('URL de Zoom inválida').optional(),
})

// Validación de nuevo vendedor
export const nuevoVendedorSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(9, 'El teléfono debe tener al menos 9 dígitos').optional(),
})

// Validación de marcar clase
export const marcarClaseSchema = z.object({
  clase_id: z.string().uuid('ID de clase inválido'),
  estado: z.enum(['completada', 'cancelada', 'no_asistio']),
  notas_profesor: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
})

// Validación de cambio transitorio
export const cambioTransitorioSchema = z.object({
  alumno_id: z.string().uuid('ID de alumno inválido'),
  fecha_original: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  fecha_nueva: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  hora_nueva: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora inválida'),
  motivo: z.string().max(200, 'El motivo no puede exceder 200 caracteres').optional(),
})

// Validación de asignar profesor
export const asignarProfesorSchema = z.object({
  alumno_id: z.string().uuid('ID de alumno inválido'),
  profesor_id: z.string().uuid('ID de profesor inválido'),
})

// Validación de bloquear alumno
export const bloquearAlumnoSchema = z.object({
  bloqueado: z.boolean(),
  motivo_bloqueo: z.string().max(200, 'El motivo no puede exceder 200 caracteres').optional(),
})

// Validación de actualizar horarios
export const actualizarHorariosSchema = z.object({
  horarios: z.array(z.object({
    id: z.string().uuid().optional(),
    dia: z.enum(['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']),
    hora_inicio: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora invalida'),
    hora_fin: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora invalida'),
  })).min(1, 'Debe definir al menos un horario'),
})

// Validación de agregar horas
export const agregarHorasSchema = z.object({
  horas: z.number().min(1, 'Debe agregar al menos 1 hora').max(500, 'Maximo 500 horas'),
  motivo: z.string().max(200, 'El motivo no puede exceder 200 caracteres').optional(),
})

// Validación de fila de Excel para alumnos
export const filaAlumnoExcelSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  apellido: z.string().min(2, 'Apellido requerido'),
  email: z.string().email('Email invalido'),
  telefono: z.string().min(9, 'Telefono requerido'),
  rut: z.string().optional(),
  nivel_actual: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional().default('A1'),
  horas_contratadas: z.number().min(1).max(500).optional().default(10),
})

// Validación de fila de Excel para profesores
export const filaProfesorExcelSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  apellido: z.string().min(2, 'Apellido requerido'),
  email: z.string().email('Email invalido'),
  telefono: z.string().optional(),
  especialidades: z.string().optional(),
  zoom_link: z.string().url().optional(),
})

// Tipos inferidos
export type LoginInput = z.infer<typeof loginSchema>
export type NuevoAlumnoInput = z.infer<typeof nuevoAlumnoSchema>
export type ActualizarAlumnoInput = z.infer<typeof actualizarAlumnoSchema>
export type NuevoProfesorInput = z.infer<typeof nuevoProfesorSchema>
export type NuevoVendedorInput = z.infer<typeof nuevoVendedorSchema>
export type MarcarClaseInput = z.infer<typeof marcarClaseSchema>
export type CambioTransitorioInput = z.infer<typeof cambioTransitorioSchema>
export type AsignarProfesorInput = z.infer<typeof asignarProfesorSchema>
export type BloquearAlumnoInput = z.infer<typeof bloquearAlumnoSchema>
export type ActualizarHorariosInput = z.infer<typeof actualizarHorariosSchema>
export type AgregarHorasInput = z.infer<typeof agregarHorasSchema>
export type FilaAlumnoExcelInput = z.infer<typeof filaAlumnoExcelSchema>
export type FilaProfesorExcelInput = z.infer<typeof filaProfesorExcelSchema>
