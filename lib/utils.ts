import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, differenceInMinutes, addMinutes } from "date-fns"
import { es } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formateo de fechas
export function formatDate(date: string | Date, formatStr: string = "dd/MM/yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, formatStr, { locale: es })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "dd/MM/yyyy HH:mm", { locale: es })
}

export function formatTime(time: string): string {
  return time.slice(0, 5)
}

// Calcular duración en minutos entre dos horas
export function calcularDuracion(horaInicio: string, horaFin: string): number {
  const [hI, mI] = horaInicio.split(":").map(Number)
  const [hF, mF] = horaFin.split(":").map(Number)
  return (hF * 60 + mF) - (hI * 60 + mI)
}

// Convertir minutos a formato de horas legible
export function minutosAHoras(minutos: number): string {
  const horas = Math.floor(minutos / 60)
  const mins = minutos % 60
  if (horas === 0) return `${mins} min`
  if (mins === 0) return `${horas}h`
  return `${horas}h ${mins}min`
}

// Generar iniciales de un nombre
export function getInitials(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
}

// Formatear RUT chileno
export function formatRut(rut: string): string {
  const cleaned = rut.replace(/[^0-9kK]/g, "")
  if (cleaned.length < 2) return cleaned
  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1).toUpperCase()
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${formatted}-${dv}`
}

// Validar RUT chileno
export function validarRut(rut: string): boolean {
  const cleaned = rut.replace(/[^0-9kK]/g, "")
  if (cleaned.length < 2) return false

  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1).toLowerCase()

  let sum = 0
  let multiplier = 2

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const expectedDv = 11 - (sum % 11)
  const dvChar = expectedDv === 11 ? "0" : expectedDv === 10 ? "k" : expectedDv.toString()

  return dv === dvChar
}

// Obtener el día de la semana en español
export function getDiaSemana(date: Date): string {
  const dias = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]
  return dias[date.getDay()]
}

// Calcular horas restantes en formato legible
export function formatHorasRestantes(horas: number): string {
  if (horas <= 0) return "Sin horas"
  if (horas === 1) return "1 hora"
  return `${horas} horas`
}
