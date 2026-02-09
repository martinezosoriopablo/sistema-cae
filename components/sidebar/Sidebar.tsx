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
} from 'lucide-react'

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

interface SidebarProps {
  rol: Rol
}

export function Sidebar({ rol }: SidebarProps) {
  const pathname = usePathname()
  const menuItems = MENU_POR_ROL[rol]

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-[#1F428D]">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-[#162f64]">
          <Link href={`/${rol}`} className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-white">TalkChile</span>
          </Link>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = iconMap[item.icon]
            const isActive = pathname === item.href ||
              (item.href !== `/${rol}` && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
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
        </nav>
      </div>
    </aside>
  )
}
