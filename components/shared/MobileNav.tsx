'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { MENU_POR_ROL } from '@/lib/constants'
import { Rol } from '@/types'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Bell,
  Calendar,
  GraduationCap,
  BarChart,
  Video,
  History,
  BookOpen,
  X,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  UserPlus,
  Bell,
  Calendar,
  GraduationCap,
  BarChart,
  Video,
  History,
  BookOpen,
}

interface MobileNavProps {
  rol: Rol
  open: boolean
  onClose: () => void
}

export function MobileNav({ rol, open, onClose }: MobileNavProps) {
  const pathname = usePathname()
  const menuItems = MENU_POR_ROL[rol]

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 md:hidden',
        open ? 'block' : 'hidden'
      )}
    >
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-64 bg-[#1F428D] p-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-white">TalkChile</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = iconMap[item.icon]
            const isActive = pathname === item.href ||
              (item.href !== `/${rol}` && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-[#162f64] text-white'
                    : 'text-blue-100 hover:bg-[#2d5aa8] hover:text-white'
                )}
              >
                {Icon && <Icon className="mr-3 h-5 w-5 flex-shrink-0" />}
                {item.label}
              </Link>
            )
          })}

          {/* Separador y enlace a perfil */}
          <div className="pt-4 mt-4 border-t border-blue-400/30">
            <Link
              href="/perfil"
              onClick={onClose}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === '/perfil'
                  ? 'bg-[#162f64] text-white'
                  : 'text-blue-100 hover:bg-[#2d5aa8] hover:text-white'
              )}
            >
              <User className="mr-3 h-5 w-5 flex-shrink-0" />
              Mi Perfil
            </Link>
          </div>
        </nav>
      </div>
    </div>
  )
}
