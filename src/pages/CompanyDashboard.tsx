import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2, AlertCircle, PlusCircle, LayoutDashboard } from 'lucide-react'
import {
  getCompanyBySlug,
  getCompanyDreData,
  getDreLineItems,
  getDreInvestors,
  Company,
  DreData,
  DreLineItem,
  DreInvestor,
} from '@/services/dres'

import { KpiCards } from '@/components/dashboard/KpiCards'
import { TrendCharts } from '@/components/dashboard/TrendCharts'
import { CompositionCharts } from '@/components/dashboard/CompositionCharts'
import { DataTables } from '@/components/dashboard/DataTables'
import { FutureReceivables } from '@/components/dashboard/FutureReceivables'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function CompanyDashboard() {
  const { slug } = useParams<{ slug: string }>()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [company, setCompany] = useState<Company | null>(null)
  const [allDreData, setAllDreData] = useState<DreData[]>([])

  const [selectedId, setSelectedId] = useState<string>('')

  const [lineItems, setLineItems] = useState<DreLineItem[]>([])
  const [investors, setInvestors] = useState<DreInvestor[]>([])
  const [detailsLoading, setDetailsLoading] = useState(false)

  const fetchData = async () => {
    if (!slug) return
    try {
      setLoading(true)
      setError(false)
      const comp = await getCompanyBySlug(slug)
      setCompany(comp)
      const dres = await getCompanyDreData(comp.id)
      setAllDreData(dres)
      if (dres.length > 0) {
        setSelectedId(dres[0].id)
      }
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [slug])

  const fetchDetails = async () => {
    if (!selectedId) return
    try {
      setDetailsLoading(true)
      const [lines, invs] = await Promise.all([
        getDreLineItems(selectedId),
        getDreInvestors(selectedId),
      ])
      setLineItems(lines)
      setInvestors(invs)
    } catch (err) {
      console.error(err)
    } finally {
      setDetailsLoading(false)
    }
  }

  useEffect(() => {
    fetchDetails()
  }, [selectedId])

  const currentDre = useMemo(
    () => allDreData.find((d) => d.id === selectedId) || null,
    [allDreData, selectedId],
  )

  const previousDre = useMemo(() => {
    if (!currentDre) return null
    const currentIndex = allDreData.findIndex((d) => d.id === selectedId)
    // Array is sorted descending (-year,-month), so next item is the previous chronological record
    return allDreData[currentIndex + 1] || null
  }, [allDreData, selectedId])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[350px]" />
          <Skeleton className="h-[350px]" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold text-slate-800">Ocorreu um erro ao carregar os dados</h2>
        <Button onClick={fetchData} variant="outline">
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (allDreData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 bg-white border border-dashed border-slate-300 rounded-2xl">
        <LayoutDashboard className="w-16 h-16 text-slate-300 mb-2" />
        <h2 className="text-2xl font-bold text-slate-800">{company.name}</h2>
        <p className="text-slate-500 max-w-md">
          Nenhum DRE encontrado para esta empresa. Faça um upload para começar a visualizar o
          dashboard.
        </p>
        <Button asChild className="mt-4 bg-emerald-600 hover:bg-emerald-700">
          <Link to="/">
            <PlusCircle className="w-4 h-4 mr-2" />
            Novo Upload
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
            <p className="text-sm text-slate-500">Dashboard Financeiro DRE</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-full sm:w-[220px] bg-slate-50 border-slate-200">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              {allDreData.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {MONTHS[d.month - 1]} {d.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            asChild
            variant="default"
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800"
          >
            <Link to="/">
              <PlusCircle className="w-4 h-4 mr-2" />
              Novo Upload
            </Link>
          </Button>
        </div>
      </div>

      {detailsLoading || !currentDre ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[350px]" />
            <Skeleton className="h-[350px]" />
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in-up">
          <KpiCards current={currentDre} previous={previousDre} />
          <TrendCharts allData={allDreData} selectedId={selectedId} />
          <CompositionCharts lineItems={lineItems} />
          <DataTables lineItems={lineItems} investors={investors} />
          <FutureReceivables dreData={currentDre} onUpdated={() => fetchData()} />
        </div>
      )}
    </div>
  )
}
