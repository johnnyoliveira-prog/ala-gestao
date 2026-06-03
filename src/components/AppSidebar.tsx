import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Building2, Users } from 'lucide-react'
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

export function AppSidebar() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  const { user } = useAuth()

  useEffect(() => {
    async function loadCompanies() {
      try {
        const data = await getCompanies()

        // Filter by allowed companies for the user, if the rule applies
        let filtered = data
        if (user && user.collectionName === 'users') {
          if (user.allowed_companies && Array.isArray(user.allowed_companies)) {
            filtered = data.filter((c) => user.allowed_companies.includes(c.name))
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
    }
    loadCompanies()
  }, [user])

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
              ) : companies.length > 0 ? (
                companies.map((company) => {
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
                  <span>
                    Nenhuma empresa
                    <br />
                    encontrada
                  </span>
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
