import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { nuevoMaterialAlumnoSchema } from '@/lib/validations'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'audio/mpeg',
  'video/mp4',
]

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const alumno_id = searchParams.get('alumno_id')

  if (!alumno_id) {
    return NextResponse.json({ error: 'alumno_id es requerido' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Verificar acceso según rol
  if (userData.rol === 'profesor') {
    const { data: profesor } = await supabase
      .from('profesores')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profesor) {
      return NextResponse.json({ error: 'Profesor no encontrado' }, { status: 404 })
    }

    // Verificar que el alumno está asignado a este profesor
    const { data: alumno } = await adminClient
      .from('alumnos')
      .select('id')
      .eq('id', alumno_id)
      .eq('profesor_id', profesor.id)
      .single()

    if (!alumno) {
      return NextResponse.json({ error: 'Alumno no encontrado o no asignado' }, { status: 403 })
    }
  } else if (userData.rol === 'alumno') {
    // Alumno solo ve sus propios materiales
    const { data: alumno } = await supabase
      .from('alumnos')
      .select('id')
      .eq('id', alumno_id)
      .eq('user_id', user.id)
      .single()

    if (!alumno) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
  } else if (userData.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data, error } = await adminClient
    .from('materiales_alumno')
    .select('*')
    .eq('alumno_id', alumno_id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!userData || !['profesor', 'admin'].includes(userData.rol)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Obtener profesor_id
  let profesorId: string

  if (userData.rol === 'profesor') {
    const { data: profesor } = await supabase
      .from('profesores')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profesor) {
      return NextResponse.json({ error: 'Profesor no encontrado' }, { status: 404 })
    }
    profesorId = profesor.id
  } else {
    // Admin: necesita especificar profesor_id en el request
    // Por ahora, si es admin, se trata el flujo sin profesor_id obligatorio
    profesorId = '' // Se asignará abajo
  }

  const contentType = request.headers.get('content-type') || ''

  try {
    if (contentType.includes('multipart/form-data')) {
      // Subida de archivo
      const formData = await request.formData()
      const file = formData.get('archivo') as File | null
      const alumno_id = formData.get('alumno_id') as string
      const titulo = formData.get('titulo') as string
      const descripcion = formData.get('descripcion') as string | null
      const tipo = formData.get('tipo') as string

      if (!file) {
        return NextResponse.json({ error: 'Archivo es requerido' }, { status: 400 })
      }

      if (!alumno_id || !titulo || !tipo) {
        return NextResponse.json({ error: 'Campos requeridos: alumno_id, titulo, tipo' }, { status: 400 })
      }

      // Validar tamaño
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'El archivo excede el límite de 10MB' }, { status: 400 })
      }

      // Validar tipo de archivo
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: 'Tipo de archivo no permitido. Formatos aceptados: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, MP3, MP4' },
          { status: 400 }
        )
      }

      // Si es admin y envió profesor_id, usarlo
      if (userData.rol === 'admin') {
        const formProfesorId = formData.get('profesor_id') as string
        if (formProfesorId) {
          profesorId = formProfesorId
        } else {
          return NextResponse.json({ error: 'profesor_id es requerido para admin' }, { status: 400 })
        }
      }

      // Verificar que el alumno está asignado a este profesor
      if (userData.rol === 'profesor') {
        const { data: alumno } = await adminClient
          .from('alumnos')
          .select('id')
          .eq('id', alumno_id)
          .eq('profesor_id', profesorId)
          .single()

        if (!alumno) {
          return NextResponse.json({ error: 'Alumno no asignado a este profesor' }, { status: 403 })
        }
      }

      // Subir archivo a Storage
      const fileExt = file.name.split('.').pop()
      const uuid = crypto.randomUUID()
      const storagePath = `${profesorId}/${alumno_id}/${uuid}.${fileExt}`

      const arrayBuffer = await file.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)

      const { error: uploadError } = await adminClient.storage
        .from('materiales-alumnos')
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('Error al subir archivo:', uploadError)
        return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 })
      }

      // Crear registro en BD
      const { data: material, error: dbError } = await adminClient
        .from('materiales_alumno')
        .insert({
          alumno_id,
          profesor_id: profesorId,
          titulo,
          descripcion: descripcion || null,
          tipo,
          url: storagePath,
          es_archivo: true,
          archivo_nombre: file.name,
          archivo_tamano: file.size,
        })
        .select()
        .single()

      if (dbError) {
        // Rollback: eliminar archivo
        await adminClient.storage.from('materiales-alumnos').remove([storagePath])
        console.error('Error al crear material:', dbError)
        return NextResponse.json({ error: 'Error al crear material' }, { status: 500 })
      }

      return NextResponse.json(material)
    } else {
      // Link externo (JSON)
      const body = await request.json()

      const validation = nuevoMaterialAlumnoSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.issues[0].message },
          { status: 400 }
        )
      }

      const data = validation.data

      if (!data.url) {
        return NextResponse.json({ error: 'URL es requerida para enlaces' }, { status: 400 })
      }

      // Si es admin y envió profesor_id, usarlo
      if (userData.rol === 'admin') {
        if (body.profesor_id) {
          profesorId = body.profesor_id
        } else {
          return NextResponse.json({ error: 'profesor_id es requerido para admin' }, { status: 400 })
        }
      }

      // Verificar que el alumno está asignado a este profesor
      if (userData.rol === 'profesor') {
        const { data: alumno } = await adminClient
          .from('alumnos')
          .select('id')
          .eq('id', data.alumno_id)
          .eq('profesor_id', profesorId)
          .single()

        if (!alumno) {
          return NextResponse.json({ error: 'Alumno no asignado a este profesor' }, { status: 403 })
        }
      }

      const { data: material, error: dbError } = await adminClient
        .from('materiales_alumno')
        .insert({
          alumno_id: data.alumno_id,
          profesor_id: profesorId,
          titulo: data.titulo,
          descripcion: data.descripcion || null,
          tipo: data.tipo,
          url: data.url,
          es_archivo: false,
        })
        .select()
        .single()

      if (dbError) {
        console.error('Error al crear material:', dbError)
        return NextResponse.json({ error: 'Error al crear material' }, { status: 500 })
      }

      return NextResponse.json(material)
    }
  } catch (error) {
    console.error('Error en materiales-alumno POST:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
