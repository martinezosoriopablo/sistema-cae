import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const bodySchema = z.object({
  profesor_id: z.string().uuid('ID de profesor inválido'),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

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

  const body = await request.json()
  const validated = bodySchema.safeParse(body)

  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.issues[0].message },
      { status: 400 }
    )
  }

  const { profesor_id } = validated.data

  // Verificar que el profesor existe
  const { data: profesor } = await supabase
    .from('profesores')
    .select('id, nombre, apellido')
    .eq('id', profesor_id)
    .single()

  if (!profesor) {
    return NextResponse.json(
      { error: 'Profesor no encontrado' },
      { status: 404 }
    )
  }

  const { data: alumno, error } = await supabase
    .from('alumnos')
    .update({
      profesor_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    alumno,
    mensaje: `Profesor ${profesor.nombre} ${profesor.apellido} asignado exitosamente`,
  })
}
