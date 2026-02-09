import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exportToExcel } from '@/lib/excel-parser'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Verificar que es admin
  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!userData || userData.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    // Obtener todos los alumnos con sus relaciones
    const { data: alumnos, error } = await supabase
      .from('alumnos')
      .select(`
        id,
        nombre,
        apellido,
        email,
        telefono,
        rut,
        nivel_actual,
        horas_contratadas,
        horas_restantes,
        bloqueado,
        fecha_inicio,
        created_at,
        profesor:profesores(nombre, apellido),
        vendedor:usuarios!alumnos_vendedor_id_fkey(nombre, apellido)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Formatear datos para Excel
    const datosExcel = alumnos?.map((alumno) => {
      // Supabase puede retornar relaciones como array o como objeto
      const profesorData = Array.isArray(alumno.profesor) ? alumno.profesor[0] : alumno.profesor
      const vendedorData = Array.isArray(alumno.vendedor) ? alumno.vendedor[0] : alumno.vendedor
      const profesor = profesorData as { nombre: string; apellido: string } | null
      const vendedor = vendedorData as { nombre: string; apellido: string } | null
      return {
        Nombre: alumno.nombre,
        Apellido: alumno.apellido,
        Email: alumno.email,
        Telefono: alumno.telefono || '',
        RUT: alumno.rut || '',
        Nivel: alumno.nivel_actual,
        'Horas Contratadas': alumno.horas_contratadas,
        'Horas Restantes': alumno.horas_restantes,
        Estado: alumno.bloqueado ? 'Bloqueado' : 'Activo',
        'Fecha Inicio': alumno.fecha_inicio || '',
        Profesor: profesor ? `${profesor.nombre} ${profesor.apellido}` : 'Sin asignar',
        Vendedor: vendedor ? `${vendedor.nombre} ${vendedor.apellido}` : '',
        'Fecha Registro': alumno.created_at?.split('T')[0] || '',
      }
    }) || []

    const buffer = exportToExcel(datosExcel, 'alumnos')

    const fecha = new Date().toISOString().split('T')[0]

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="alumnos_${fecha}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error al exportar:', error)
    return NextResponse.json(
      { error: 'Error al exportar datos' },
      { status: 500 }
    )
  }
}
