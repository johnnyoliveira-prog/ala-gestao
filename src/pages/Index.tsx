import { useState, useEffect, useMemo } from 'react'
import { getCompanies, getDreData, Company, DreData } from '@/services/dres'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { UploadCloud, FolderSearch, BarChart3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'

import { GlobalKpis } from '@/components/dashboard/GlobalKpis'
import { GlobalAlerts } from '@/components/dashboard/GlobalAlerts'
import { GlobalBarCharts } from '@/components/dashboard/GlobalBarCharts'
import { GlobalTrends } from '@/components/dashboard/GlobalTrends'
import { GlobalCompanyTable } from '@/components/dashboard/GlobalCompanyTable'
import { PerformanceRanking } from '@/components/dashboard/PerformanceRanking'

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
]

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

export default function Index() {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState<Company[]>([])
  const [allData, setAllData] = useState<DreData[]>([])
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([getCompanies(), getDreData()])
      .then(([comps, dres]) => {
        setCompanies(comps)
        setAllData(dres)
        if (dres.length > 0) {
          setMonth(dres[0].month)
          setYear(dres[0].year)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const currentData = useMemo(() => {
    return allData.filter((d) => d.month === month && d.year === year)
  }, [allData, month, year])

  const previousData = useMemo(() => {
    let prevMonth = month - 1
    let prevYear = year
    if (prevMonth === 0) {
      prevMonth = 12
      prevYear = year - 1
    }
    return allData.filter((d) => d.month === prevMonth && d.year === prevYear)
  }, [allData, month, year])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-[120px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-emerald-600" />
            Dashboard Grupo ALA
          </h1>
          <p className="text-slate-500 mt-1">
            Visão consolidada do desempenho financeiro de todas as empresas do grupo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="w-[130px] bg-slate-50">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-[100px] bg-slate-50">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => navigate('/upload')}
            className="bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all"
          >
            <UploadCloud className="w-4 h-4 mr-2" /> Novo DRE
          </Button>
        </div>
      </div>

      {allData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-dashed border-slate-300">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <FolderSearch className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-700 mb-2">Nenhum DRE encontrado</h2>
          <p className="text-slate-500 max-w-md text-center mb-8">
            O sistema ainda não possui dados financeiros registrados. Faça o upload do primeiro
            Demonstrativo para habilitar os gráficos e indicadores.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/upload')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <UploadCloud className="w-5 h-5 mr-2" /> Iniciar Upload
          </Button>
        </div>
      ) : (
        <>
          <GlobalKpis currentData={currentData} previousData={previousData} />

          <GlobalAlerts currentData={currentData} companies={companies} />

          {currentData.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <GlobalBarCharts currentData={currentData} companies={companies} />
                </div>
                <div>
                  <PerformanceRanking currentData={currentData} companies={companies} />
                </div>
              </div>
              <GlobalTrends
                currentData={currentData}
                allData={allData}
                companies={companies}
                month={month}
                year={year}
              />
            </div>
          ) : (
            <div className="py-16 text-center bg-slate-50 rounded-xl border border-slate-200">
              <FolderSearch className="w-10 h-10 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600">Sem dados para este período</h3>
              <p className="text-sm text-slate-500">Altere o mês/ano ou envie novos documentos.</p>
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4 px-1">Resumo por Empresa</h3>
            <GlobalCompanyTable currentData={currentData} companies={companies} />
          </div>
        </>
      )}
    </div>
  )
}
