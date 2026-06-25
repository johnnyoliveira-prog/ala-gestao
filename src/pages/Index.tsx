import { useEffect, useState, useMemo } from 'react'
import { getCompanies, getDreData, Company, DreData } from '@/services/dres'
import { useAuth } from '@/hooks/use-auth'
import { GlobalKpis } from '@/components/dashboard/GlobalKpis'
import { PerformanceRanking } from '@/components/dashboard/PerformanceRanking'
import { TrendCharts } from '@/components/dashboard/TrendCharts'
import { PortfolioMatrix } from '@/components/dashboard/PortfolioMatrix'
import { Building2, LayoutDashboard } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function Index() {
  const { user } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [allDreData, setAllDreData] = useState<DreData[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedPeriod, setSelectedPeriod] = useState<string>('')

  const fetchData = async () => {
    try {
      const [comps, dres] = await Promise.all([getCompanies(), getDreData()])

      let allowedComps = comps.filter((c) => c.slug !== 'cr-vinicola')
      if (user && user.collectionName === 'users') {
        if (user.allowed_companies && Array.isArray(user.allowed_companies)) {
          allowedComps = allowedComps.filter((c) => user.allowed_companies.includes(c.name))
        } else {
          allowedComps = []
        }
      }
      setCompanies(allowedComps)

      const allowedCompIds = new Set(allowedComps.map((c) => c.id))
      const allowedDres = dres.filter((d) => allowedCompIds.has(d.company))
      setAllDreData(allowedDres)

      if (allowedDres.length > 0) {
        setLoading(false)
        setSelectedPeriod((prev) => prev || `${allowedDres[0].year}-${allowedDres[0].month}`)
      } else {
        setLoading(false)
      }
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  useRealtime('dre_data', () => fetchData())
  useRealtime('dre_uploads', () => fetchData())

  const periods = useMemo(() => {
    const unique = new Set<string>()
    allDreData.forEach((d) => {
      unique.add(`${d.year}-${d.month}`)
    })
    return Array.from(unique).sort((a, b) => {
      const [yearA, monthA] = a.split('-').map(Number)
      const [yearB, monthB] = b.split('-').map(Number)
      if (yearA !== yearB) return yearB - yearA
      return monthB - monthA
    })
  }, [allDreData])

  const [selYear, selMonth] = useMemo(() => {
    if (!selectedPeriod) return [0, 0]
    return selectedPeriod.split('-').map(Number)
  }, [selectedPeriod])

  const currentData = useMemo(() => {
    return allDreData.filter((d) => d.year === selYear && d.month === selMonth)
  }, [allDreData, selYear, selMonth])

  const previousData = useMemo(() => {
    let pMonth = selMonth - 1
    let pYear = selYear
    if (pMonth === 0) {
      pMonth = 12
      pYear -= 1
    }
    return allDreData.filter((d) => d.year === pYear && d.month === pMonth)
  }, [allDreData, selYear, selMonth])

  const aggregatedTrendData = useMemo(() => {
    const grouped = new Map<string, DreData>()

    allDreData.forEach((d) => {
      const key = `${d.year}-${d.month}`
      if (!grouped.has(key)) {
        grouped.set(key, {
          ...d,
          id: key,
          total_receitas: 0,
          total_despesas: 0,
          resultado: 0,
        })
      }
      const agg = grouped.get(key)!
      agg.total_receitas += d.total_receitas || 0
      agg.total_despesas += d.total_despesas || 0
      agg.resultado += d.resultado || 0
    })

    return Array.from(grouped.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.month - a.month
    })
  }, [allDreData])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-[220px]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[350px]" />
          <Skeleton className="h-[350px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-lg">
            <LayoutDashboard className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Geral</h1>
            <p className="text-sm text-slate-500">Consolidado Grupo ALA</p>
          </div>
        </div>

        {periods.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-[220px] bg-slate-50 border-slate-200">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => {
                  const [y, m] = p.split('-').map(Number)
                  return (
                    <SelectItem key={p} value={p}>
                      {MONTHS[m - 1]} {y}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {allDreData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 bg-white border border-dashed border-slate-300 rounded-2xl p-8">
          <Building2 className="w-16 h-16 text-slate-300 mb-2" />
          <h2 className="text-2xl font-bold text-slate-800">Nenhum dado encontrado</h2>
          <p className="text-slate-500 max-w-md">
            Ainda não há dados de DRE carregados para as suas empresas. Faça o upload do primeiro
            DRE para começar.
          </p>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in-up">
          <GlobalKpis currentData={currentData} previousData={previousData} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrendCharts allData={aggregatedTrendData} selectedId={selectedPeriod} />
            <PerformanceRanking currentData={currentData} companies={companies} />
            <PortfolioMatrix currentData={currentData} companies={companies} />
          </div>
        </div>
      )}
    </div>
  )
}
