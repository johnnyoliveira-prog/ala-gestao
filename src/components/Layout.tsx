import { Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { UploadCloud, History, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Layout() {
  const { user, signOut, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  const navLinks = [
    { name: 'Upload DRE', path: '/', icon: UploadCloud },
    { name: 'Histórico', path: '/history', icon: History },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto max-w-[1200px] h-16 flex items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-black tracking-tighter text-slate-900 group-hover:text-slate-700 transition-colors">
                GRUPO<span className="text-slate-500">ALA</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                const isActive = location.pathname === link.path
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border border-slate-200">
                    <AvatarFallback className="bg-slate-900 text-white">
                      {user?.name?.charAt(0) || <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || 'Administrador'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair do sistema</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto max-w-[1200px] px-4 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="container mx-auto max-w-[1200px] px-4 flex flex-col md:flex-row items-center justify-between text-slate-500">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <span className="text-xl font-bold text-slate-800">ALA</span>
            <div className="h-6 w-px bg-slate-300"></div>
            <span className="text-xs font-semibold tracking-widest uppercase">
              Quem conhece, confia.
            </span>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Grupo ALA. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
