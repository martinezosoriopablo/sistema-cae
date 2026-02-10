// Roles del sistema
export type Rol = 'admin' | 'vendedor' | 'profesor' | 'alumno'

// Niveles MCER
export type NivelMCER = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

// Estados de clase
export type EstadoClase = 'programada' | 'completada' | 'cancelada' | 'no_asistio'

// Días de la semana
export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'

// Modalidades de curso
export type ModalidadCurso = 'privado' | 'livemode' | 'kids' | 'presencial' | 'espanol' | 'nativo'

// Usuario base (de Supabase Auth)
export interface Usuario {
  id: string
  email: string
  rol: Rol
  nombre: string
  apellido: string
  telefono?: string
  created_at: string
  updated_at: string
}

// Vendedor
export interface Vendedor extends Usuario {
  rol: 'vendedor'
  comision_porcentaje?: number
}

// Profesor
export interface Profesor {
  id: string
  user_id: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  especialidades?: NivelMCER[]
  disponibilidad?: DisponibilidadProfesor[]
  zoom_link?: string
  activo: boolean
  created_at: string
  updated_at: string
}

// Disponibilidad del profesor
export interface DisponibilidadProfesor {
  dia: DiaSemana
  hora_inicio: string
  hora_fin: string
}

// Alumno
export interface Alumno {
  id: string
  user_id: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  rut?: string
  nivel_actual: NivelMCER
  modalidad: ModalidadCurso
  horas_contratadas: number
  horas_restantes: number
  profesor_id?: string
  vendedor_id: string
  bloqueado: boolean
  motivo_bloqueo?: string
  fecha_inicio: string
  fecha_fin_estimada?: string
  notas?: string
  created_at: string
  updated_at: string
}

// Horario regular del alumno
export interface HorarioAlumno {
  id: string
  alumno_id: string
  dia: DiaSemana
  hora_inicio: string
  hora_fin: string
  duracion_minutos: number
  activo: boolean
  created_at: string
}

// Cambio transitorio de horario
export interface CambioTransitorio {
  id: string
  alumno_id: string
  fecha_original: string
  fecha_nueva: string
  hora_nueva: string
  motivo?: string
  aprobado_por?: string
  created_at: string
}

// Clase individual
export interface Clase {
  id: string
  alumno_id: string
  profesor_id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  duracion_minutos: number
  estado: EstadoClase
  notas_profesor?: string
  zoom_link?: string
  created_at: string
  updated_at: string
}

// Clase con relaciones
export interface ClaseConRelaciones extends Clase {
  alumno?: Alumno
  profesor?: Profesor
}

// Alerta
export interface Alerta {
  id: string
  alumno_id: string
  tipo: 'pocas_horas' | 'sin_profesor' | 'clase_perdida'
  mensaje: string
  leida: boolean
  destinatario_id: string
  created_at: string
}

// Material de estudio
export interface Material {
  id: string
  titulo: string
  descripcion?: string
  nivel: NivelMCER
  tipo: 'documento' | 'video' | 'audio' | 'ejercicio'
  url: string
  created_at: string
}

// Pago
export interface Pago {
  id: string
  alumno_id: string
  monto: number
  horas_compradas: number
  fecha_pago: string
  metodo_pago: string
  comprobante_url?: string
  vendedor_id: string
  notas?: string
  created_at: string
}

// Form types
export interface NuevoAlumnoForm {
  nombre: string
  apellido: string
  email: string
  telefono: string
  rut?: string
  nivel_actual: NivelMCER
  modalidad: ModalidadCurso
  horas_contratadas: number
  horarios: {
    dia: DiaSemana
    hora_inicio: string
    hora_fin: string
  }[]
}

export interface MarcarClaseForm {
  clase_id: string
  estado: EstadoClase
  notas_profesor?: string
}

// Stats para dashboards
export interface EstadisticasAdmin {
  total_alumnos: number
  alumnos_activos: number
  alumnos_bloqueados: number
  total_profesores: number
  clases_hoy: number
  clases_semana: number
  alertas_pendientes: number
}

export interface EstadisticasVendedor {
  alumnos_registrados: number
  alumnos_activos: number
  alertas_pendientes: number
  comisiones_mes: number
}

export interface EstadisticasProfesor {
  alumnos_asignados: number
  clases_hoy: number
  clases_semana: number
  horas_semana: number
}
