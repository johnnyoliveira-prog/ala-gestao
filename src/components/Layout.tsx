import { Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LayoutDashboard,
  UploadCloud,
  History,
  LogOut,
  Building2,
  Menu,
  ChevronLeft,
  ChevronRight,
  X,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { getCompanies, Company, getDreData, DreData } from '@/services/dres'
import { toast } from 'sonner'
import { useRealtime } from '@/hooks/use-realtime'

function NavLink({ to, icon: Icon, label, collapsed, indicator }: any) {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative group',
        isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white',
        collapsed ? 'justify-center' : 'justify-start',
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
      {indicator && (
        <span
          className={cn(
            'absolute rounded-full',
            collapsed ? 'top-1 right-1 w-2 h-2' : 'right-3 w-2 h-2 top-1/2 -translate-y-1/2',
            indicator === 'green' ? 'bg-emerald-500' : 'bg-red-500',
          )}
        />
      )}
    </Link>
  )
}

export default function Layout() {
  const { user, signOut, loading } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [currentMonthData, setCurrentMonthData] = useState<DreData[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const loadData = () => {
    if (user) {
      getCompanies()
        .then((allComps) => {
          if (user.role === 'admin') {
            setCompanies(allComps)
          } else if (user.allowed_companies && Array.isArray(user.allowed_companies)) {
            setCompanies(allComps.filter((c) => user.allowed_companies.includes(c.name)))
          } else {
            setCompanies([])
          }
        })
        .catch(console.error)

      getDreData()
        .then((dres) => {
          let filteredDres = dres
          if (user.role !== 'admin') {
            const allowed = Array.isArray(user.allowed_companies) ? user.allowed_companies : []
            filteredDres = dres.filter((d) => allowed.includes(d.expand?.company?.name))
          }
          const current = filteredDres.filter(
            (d) => d.month === currentMonth && d.year === currentYear,
          )
          setCurrentMonthData(current)
        })
        .catch(console.error)
    }
  }

  useEffect(() => {
    loadData()
  }, [user, currentMonth, currentYear])

  useRealtime('dre_data', () => loadData())
  useRealtime('dre_uploads', () => loadData())

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  const handleLogout = () => {
    signOut()
    toast.success('Você saiu do sistema com sucesso.')
  }

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:static inset-y-0 left-0 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 z-50',
          sidebarOpen ? 'w-72 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20',
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 bg-slate-950 shrink-0">
          {sidebarOpen ? (
            <span className="text-xl font-black tracking-tighter text-white">
              GRUPO<span className="text-slate-500">ALA</span>
            </span>
          ) : (
            <span className="text-xl font-black tracking-tighter text-white mx-auto">ALA</span>
          )}
          {sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-400"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-2 px-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-900 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Main Links */}
          {user?.can_view_global_dashboard && (
            <NavLink
              to="/dashboard"
              icon={LayoutDashboard}
              label="Dashboard Geral (Grupo ALA)"
              collapsed={!sidebarOpen}
            />
          )}
          {user?.role !== 'gestor' && (
            <NavLink to="/upload" icon={UploadCloud} label="Upload DRE" collapsed={!sidebarOpen} />
          )}
          {user?.role !== 'gestor' && (
            <NavLink to="/history" icon={History} label="Histórico" collapsed={!sidebarOpen} />
          )}
          {user?.role === 'admin' && (
            <div className="mt-4 mb-2">
              {sidebarOpen && (
                <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Administração
                </div>
              )}
              <NavLink to="/admin/users" icon={Users} label="Usuários" collapsed={!sidebarOpen} />
            </div>
          )}
          {/* SPEs */}
          <div className="mt-4 mb-2 flex-1">
            {sidebarOpen && (
              <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Empresas (SPEs)
              </div>
            )}
            <div className="flex flex-col gap-1">
              {companies.map((c) => {
                const hasDre = currentMonthData.some((d) => d.company === c.id)
                return (
                  <NavLink
                    key={c.id}
                    to={`/dashboard/${c.slug}`}
                    icon={Building2}
                    label={c.name}
                    collapsed={!sidebarOpen}
                    indicator={hasDre ? 'green' : 'red'}
                  />
                )
              })}
              {sidebarOpen && companies.length === 0 && (
                <p className="text-sm text-slate-500 px-3 py-2">Nenhuma empresa encontrada.</p>
              )}
            </div>
          </div>{' '}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          {sidebarOpen && (
            <div className="flex items-center gap-3 overflow-hidden">
              <Avatar className="h-8 w-8 bg-slate-800 text-slate-300">
                <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate">
                <span className="text-sm font-medium text-slate-200 truncate">{user?.name}</span>
                <span
                  className="text-xs text-slate-500 truncate cursor-pointer hover:underline"
                  onClick={handleLogout}
                >
                  Sair do sistema
                </span>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hidden md:flex"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </Button>
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="text-red-400 hover:text-red-300 w-full"
              onClick={handleLogout}
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top header for mobile */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <span className="text-xl font-black tracking-tighter text-slate-900">
            GRUPO<span className="text-slate-500">ALA</span>
          </span>
          <div className="w-9" /> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
