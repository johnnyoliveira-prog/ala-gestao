import { useEffect, useState, ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { getCompanies } from '@/services/dres'
import { Skeleton } from '@/components/ui/skeleton'

export function GestorGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const [redirectSlug, setRedirectSlug] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (loading) return
    if (user?.role !== 'gestor') {
      setChecking(false)
      return
    }
    const allowed = Array.isArray(user.allowed_companies) ? user.allowed_companies : []
    if (allowed.length === 0) {
      setChecking(false)
      return
    }
    getCompanies()
      .then((companies) => {
        const first = companies.find((c) => allowed.includes(c.name))
        setRedirectSlug(first?.slug || null)
      })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [user, loading])

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    )
  }

  if (user?.role === 'gestor') {
    if (redirectSlug) {
      return <Navigate to={`/dashboard/${redirectSlug}`} replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
