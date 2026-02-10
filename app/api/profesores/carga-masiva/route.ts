import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseProfesoresExcel, ProfesorExcelRow } from '@/lib/excel-parser'
import { generateTempPassword } from '@/lib/auth-utils'

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
    const parseResult = parseProfesoresExcel(buffer)

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

    // Procesar cada profesor valido
    for (const profesor of parseResult.data) {
      resultado.totalProcesados++

      try {
        // Crear usuario en Supabase Auth
        const tempPassword = generateTempPassword()

        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email: profesor.email,
          password: tempPassword,
          email_confirm: true,
        })

        if (authError) {
          if (authError.message.includes('already')) {
            resultado.errores.push({
              email: profesor.email,
              error: 'Ya existe un usuario con este email',
            })
          } else {
            resultado.errores.push({
              email: profesor.email,
              error: authError.message,
            })
          }
          continue
        }

        const especialidades = profesor.especialidades || []

        // Crear entrada en tabla usuarios
        const { error: usuarioError } = await adminClient
          .from('usuarios')
          .insert({
            id: authData.user.id,
            email: profesor.email,
            rol: 'profesor',
            nombre: profesor.nombre,
            apellido: profesor.apellido,
            telefono: profesor.telefono || null,
          })

        if (usuarioError) {
          await adminClient.auth.admin.deleteUser(authData.user.id)
          resultado.errores.push({
            email: profesor.email,
            error: 'Error al crear usuario en base de datos',
          })
          continue
        }

        // Crear profesor
        const { error: profesorError } = await adminClient
          .from('profesores')
          .insert({
            user_id: authData.user.id,
            nombre: profesor.nombre,
            apellido: profesor.apellido,
            email: profesor.email,
            telefono: profesor.telefono || null,
            especialidades: especialidades.length > 0 ? especialidades : null,
            zoom_link: profesor.zoom_link || null,
            activo: true,
          })

        if (profesorError) {
          await adminClient.auth.admin.deleteUser(authData.user.id)
          resultado.errores.push({
            email: profesor.email,
            error: 'Error al crear profesor',
          })
          continue
        }

        resultado.exitosos.push({
          email: profesor.email,
          nombre: `${profesor.nombre} ${profesor.apellido}`,
        })
      } catch (error) {
        resultado.errores.push({
          email: profesor.email,
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
