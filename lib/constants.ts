import { DiaSemana, EstadoClase, ModalidadCurso, NivelMCER, Rol } from '@/types'

// Roles del sistema
export const ROLES: { value: Rol; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'profesor', label: 'Profesor' },
  { value: 'alumno', label: 'Alumno' },
]

// Niveles MCER
export const NIVELES_MCER: { value: NivelMCER; label: string; descripcion: string }[] = [
  { value: 'A1', label: 'A1 - Principiante', descripcion: 'Nivel básico de entrada' },
  { value: 'A2', label: 'A2 - Elemental', descripcion: 'Nivel elemental' },
  { value: 'B1', label: 'B1 - Intermedio', descripcion: 'Nivel intermedio' },
  { value: 'B2', label: 'B2 - Intermedio Alto', descripcion: 'Nivel intermedio alto' },
  { value: 'C1', label: 'C1 - Avanzado', descripcion: 'Nivel avanzado' },
  { value: 'C2', label: 'C2 - Maestría', descripcion: 'Nivel de dominio' },
]

// Estados de clase
export const ESTADOS_CLASE: { value: EstadoClase; label: string; color: string }[] = [
  { value: 'programada', label: 'Programada', color: 'bg-blue-500' },
  { value: 'completada', label: 'Completada', color: 'bg-green-500' },
  { value: 'cancelada', label: 'Cancelada', color: 'bg-gray-500' },
  { value: 'no_asistio', label: 'No asistió', color: 'bg-red-500' },
]

// Días de la semana
export const DIAS_SEMANA: { value: DiaSemana; label: string; abrev: string }[] = [
  { value: 'lunes', label: 'Lunes', abrev: 'Lun' },
  { value: 'martes', label: 'Martes', abrev: 'Mar' },
  { value: 'miercoles', label: 'Miércoles', abrev: 'Mié' },
  { value: 'jueves', label: 'Jueves', abrev: 'Jue' },
  { value: 'viernes', label: 'Viernes', abrev: 'Vie' },
  { value: 'sabado', label: 'Sábado', abrev: 'Sáb' },
  { value: 'domingo', label: 'Domingo', abrev: 'Dom' },
]

// Modalidades de curso
export const MODALIDADES_CURSO: { value: ModalidadCurso; label: string; tarifaSugerida: number | null }[] = [
  { value: 'privado', label: 'Privado', tarifaSugerida: null },
  { value: 'livemode', label: 'Livemode', tarifaSugerida: null },
  { value: 'kids', label: 'Kids', tarifaSugerida: null },
  { value: 'presencial', label: 'Presencial', tarifaSugerida: null },
  { value: 'espanol', label: 'Español', tarifaSugerida: null },
  { value: 'nativo', label: 'Nativo', tarifaSugerida: null },
]

// Horarios disponibles (cada 30 minutos)
export const HORARIOS_DISPONIBLES = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7 // Empezar a las 7:00
  const minutes = (i % 2) * 30
  const time = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  return { value: time, label: time }
})

// Duraciones de clase en minutos
export const DURACIONES_CLASE = [
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1 hora 30 minutos' },
  { value: 120, label: '2 horas' },
]

// Umbral de alerta de pocas horas
export const UMBRAL_ALERTA_HORAS = 5

// Horas mínimas de anticipación para cancelar una clase (12, 18 o 24)
export const HORAS_MINIMAS_CANCELACION = 24

// Rutas por rol
export const RUTAS_POR_ROL: Record<Rol, string> = {
  admin: '/admin',
  vendedor: '/vendedor',
  profesor: '/profesor',
  alumno: '/alumno',
}

// Menú de navegación por rol
export const MENU_POR_ROL: Record<Rol, { label: string; href: string; icon: string }[]> = {
  admin: [
    { label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
    { label: 'Alumnos', href: '/admin/alumnos', icon: 'Users' },
    { label: 'Profesores', href: '/admin/profesores', icon: 'GraduationCap' },
    { label: 'Vendedores', href: '/admin/vendedores', icon: 'UserPlus' },
    { label: 'Administradores', href: '/admin/administradores', icon: 'Shield' },
    { label: 'Horarios', href: '/admin/horarios', icon: 'Calendar' },
    { label: 'Reportes', href: '/admin/reportes', icon: 'BarChart' },
  ],
  vendedor: [
    { label: 'Dashboard', href: '/vendedor', icon: 'LayoutDashboard' },
    { label: 'Nuevo Alumno', href: '/vendedor/nuevo-alumno', icon: 'UserPlus' },
    { label: 'Mis Alumnos', href: '/vendedor/mis-alumnos', icon: 'Users' },
    { label: 'Alertas', href: '/vendedor/alertas', icon: 'Bell' },
  ],
  profesor: [
    { label: 'Dashboard', href: '/profesor', icon: 'LayoutDashboard' },
    { label: 'Clases Hoy', href: '/profesor/clases-hoy', icon: 'Calendar' },
    { label: 'Mis Alumnos', href: '/profesor/mis-alumnos', icon: 'Users' },
    { label: 'Materiales', href: '/profesor/materiales', icon: 'BookOpen' },
  ],
  alumno: [
    { label: 'Dashboard', href: '/alumno', icon: 'LayoutDashboard' },
    { label: 'Mi Clase', href: '/alumno/mi-clase', icon: 'Video' },
    { label: 'Historial', href: '/alumno/historial', icon: 'History' },
    { label: 'Material', href: '/alumno/material', icon: 'BookOpen' },
  ],
}
