import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseAlumnosExcel, AlumnoExcelRow } from '@/lib/excel-parser'

interface ResultadoCarga {
  exitosos: { email: string; nombre: string }[]
  errores: { email: string; error: string }[]
  totalProcesados: number
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

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
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No se proporciono archivo' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const parseResult = parseAlumnosExcel(buffer)

    if (parseResult.errors.length > 0 && parseResult.filasValidas === 0) {
      return NextResponse.json({
        error: 'Todas las filas tienen errores',
        detalles: parseResult.errors,
      }, { status: 400 })
    }

    const resultado: ResultadoCarga = {
      exitosos: [],
      errores: [],
      totalProcesados: 0,
    }

    // Agregar errores de validacion
    parseResult.errors.forEach((e) => {
      resultado.errores.push({
        email: `Fila ${e.fila}`,
        error: e.errores.join(', '),
      })
    })

    // Procesar cada alumno valido
    for (const alumno of parseResult.data) {
      resultado.totalProcesados++

      try {
        // Crear usuario en Supabase Auth
        const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'

        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email: alumno.email,
          password: tempPassword,
          email_confirm: true,
        })

        if (authError) {
          if (authError.message.includes('already')) {
            resultado.errores.push({
              email: alumno.email,
              error: 'Ya existe un usuario con este email',
            })
          } else {
            resultado.errores.push({
              email: alumno.email,
              error: authError.message,
            })
          }
          continue
        }

        // Crear entrada en tabla usuarios
        const { error: usuarioError } = await adminClient
          .from('usuarios')
          .insert({
            id: authData.user.id,
            email: alumno.email,
            rol: 'alumno',
            nombre: alumno.nombre,
            apellido: alumno.apellido,
            telefono: alumno.telefono,
          })

        if (usuarioError) {
          await adminClient.auth.admin.deleteUser(authData.user.id)
          resultado.errores.push({
            email: alumno.email,
            error: 'Error al crear usuario en base de datos',
          })
          continue
        }

        // Crear alumno
        const { error: alumnoError } = await adminClient
          .from('alumnos')
          .insert({
            user_id: authData.user.id,
            nombre: alumno.nombre,
            apellido: alumno.apellido,
            email: alumno.email,
            telefono: alumno.telefono,
            rut: alumno.rut || null,
            nivel_actual: alumno.nivel_actual || 'A1',
            horas_contratadas: alumno.horas_contratadas || 10,
            horas_restantes: alumno.horas_contratadas || 10,
            vendedor_id: user.id,
            bloqueado: false,
            fecha_inicio: new Date().toISOString().split('T')[0],
          })

        if (alumnoError) {
          await adminClient.auth.admin.deleteUser(authData.user.id)
          resultado.errores.push({
            email: alumno.email,
            error: 'Error al crear alumno',
          })
          continue
        }

        resultado.exitosos.push({
          email: alumno.email,
          nombre: `${alumno.nombre} ${alumno.apellido}`,
        })
      } catch (error) {
        resultado.errores.push({
          email: alumno.email,
          error: 'Error inesperado al procesar',
        })
      }
    }

    return NextResponse.json({
      message: 'Carga masiva completada',
      resultado,
      validacionExcel: {
        totalFilas: parseResult.totalFilas,
        filasValidas: parseResult.filasValidas,
        filasConError: parseResult.filasConError,
      },
    })
  } catch (error) {
    console.error('Error en carga masiva:', error)
    return NextResponse.json(
      { error: 'Error al procesar archivo' },
      { status: 500 }
    )
  }
}
