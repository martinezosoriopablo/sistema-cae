import { randomBytes } from 'crypto'

// Generar contraseña temporal segura (server-only)
export function generateTempPassword(): string {
  return randomBytes(6).toString('base64url') + 'A1!'
}
