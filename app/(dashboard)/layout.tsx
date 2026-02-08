'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { Header } from '@/components/shared/Header'
import { MobileNav } from '@/components/shared/MobileNav'
import { PageLoading } from '@/components/shared/Loading'
import { Rol } from '@/types'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useUser()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const pathname = usePathname()

  if (loading) {
    return <PageLoading />
  }

  if (!user) {
    return null
  }

  // Determinar el rol basado en la ruta
  const rolFromPath = pathname.split('/')[1] as Rol

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar rol={rolFromPath} />
      <MobileNav
        rol={rolFromPath}
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <div className="md:pl-64">
        <Header
          nombre={user.nombre}
          apellido={user.apellido}
          email={user.email}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
