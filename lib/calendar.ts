// Generador de archivos ICS para calendarios

interface CalendarEvent {
  id: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  location?: string
  url?: string
}

function formatDateToICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

export function generateICSFile(events: CalendarEvent[], calendarName: string): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TalkChile//Sistema de Clases//ES',
    `X-WR-CALNAME:${escapeICSText(calendarName)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const event of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@talkchile.cl`,
      `DTSTAMP:${formatDateToICS(new Date())}`,
      `DTSTART:${formatDateToICS(event.startDate)}`,
      `DTEND:${formatDateToICS(event.endDate)}`,
      `SUMMARY:${escapeICSText(event.title)}`,
      `DESCRIPTION:${escapeICSText(event.description)}`,
    )

    if (event.location) {
      lines.push(`LOCATION:${escapeICSText(event.location)}`)
    }

    if (event.url) {
      lines.push(`URL:${event.url}`)
    }

    // Recordatorio 10 minutos antes
    lines.push(
      'BEGIN:VALARM',
      'TRIGGER:-PT10M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Tu clase de inglés comienza en 10 minutos',
      'END:VALARM',
    )

    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  return lines.join('\r\n')
}

export function generateClassEvents(clases: {
  id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  zoom_link?: string | null
  profesor?: { nombre: string; apellido: string } | null
}[]): CalendarEvent[] {
  return clases.map(clase => {
    const [year, month, day] = clase.fecha.split('-').map(Number)
    const [startHour, startMin] = clase.hora_inicio.split(':').map(Number)
    const [endHour, endMin] = clase.hora_fin.split(':').map(Number)

    const startDate = new Date(Date.UTC(year, month - 1, day, startHour, startMin))
    const endDate = new Date(Date.UTC(year, month - 1, day, endHour, endMin))

    const profesorNombre = clase.profesor
      ? `${clase.profesor.nombre} ${clase.profesor.apellido}`
      : 'Por asignar'

    let description = `Clase de inglés con ${profesorNombre}`
    if (clase.zoom_link) {
      description += `\\n\\nEnlace Zoom: ${clase.zoom_link}`
    }
    description += '\\n\\nRecuerda ingresar desde el portal para registrar tu asistencia.'

    return {
      id: clase.id,
      title: `Clase de Inglés - TalkChile`,
      description,
      startDate,
      endDate,
      url: clase.zoom_link || undefined,
    }
  })
}

// Generar link para agregar un solo evento a Google Calendar
export function generateGoogleCalendarLink(event: {
  title: string
  description: string
  startDate: Date
  endDate: Date
  location?: string
}): string {
  const formatForGoogle = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatForGoogle(event.startDate)}/${formatForGoogle(event.endDate)}`,
    details: event.description,
  })

  if (event.location) {
    params.set('location', event.location)
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
