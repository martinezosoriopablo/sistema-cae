import { NextResponse } from 'next/server'
import { generateExcelTemplate } from '@/lib/excel-parser'

export async function GET() {
  const buffer = generateExcelTemplate('alumnos')

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla_alumnos.xlsx"',
    },
  })
}
