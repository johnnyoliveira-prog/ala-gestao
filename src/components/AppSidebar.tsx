import { useEffect, useState, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Building2, Users, Package } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from '@/components/ui/sidebar'
import { getCompanies, type Company } from '@/services/companies'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'

export function AppSidebar() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  const { user } = useAuth()

  const loadCompanies = useCallback(async () => {
    try {
      const data = await getCompanies()

      let filtered = data
      // Filter by allowed companies for non-admin users
      if (user?.role !== 'admin') {
        const allowed = user?.allowed_companies || []
        if (Array.isArray(allowed)) {
          filtered = data.filter((c) => allowed.includes(c.name))
        } else {
          filtered = []
        }
      }

      setCompanies(filtered)
    } catch (err) {
      console.error('Failed to load companies:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  useRealtime('companies', () => {
    loadCompanies()
  })

  return (
    <Sidebar className="bg-white">
      <SidebarContent>
        {user?.role === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel className="mb-2 px-3">Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/admin/users'}>
                    <Link to="/admin/users">
                      <Users className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>Usuários</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {companies.some((c) => c.slug === 'cr-vinicola') && (
          <SidebarGroup>
            <SidebarGroupLabel className="mb-2 px-3">Estoque CR Vinícola</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === '/dashboard/cr-vinicola/estoque'}
                  >
                    <Link to="/dashboard/cr-vinicola/estoque">
                      <Package className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>Estoque Vinícola</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 px-3">Empresas (SPEs)</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton />
                  </SidebarMenuItem>
                ))
              ) : companies.filter((c) => c.slug !== 'cr-vinicola').length > 0 ? (
                companies
                  .filter((c) => c.slug !== 'cr-vinicola')
                  .map((company) => {
                    const path = `/dashboard/${company.slug}`
                    const isActive = location.pathname === path

                    return (
                      <SidebarMenuItem key={company.id}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link to={path}>
                            <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="truncate">{company.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })
              ) : (
                <div className="px-3 py-6 text-sm text-slate-500 text-center flex flex-col items-center gap-2">
                  <Building2 className="h-6 w-6 text-slate-300" />
                  <span>Nenhuma empresa vinculada</span>
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
