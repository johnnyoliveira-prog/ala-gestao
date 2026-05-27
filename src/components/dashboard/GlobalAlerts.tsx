import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Company, DreData } from '@/services/dres'
import { AlertTriangle, TrendingDown, FileWarning, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

interface GlobalAlertsProps {
  currentData: DreData[]
  companies: Company[]
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function GlobalAlerts({ currentData, companies }: GlobalAlertsProps) {
  const missing = companies.filter((c) => !currentData.some((d) => d.company === c.id))
  const negative = currentData.filter((d) => d.resultado < 0)

  const compsWithData = currentData.filter((d) => d.total_despesas > 0)
  const avgExpense =
    compsWithData.length > 0
      ? compsWithData.reduce((acc, d) => acc + d.total_despesas, 0) / compsWithData.length
      : 0

  const abnormal = currentData.filter((d) => d.total_despesas > avgExpense * 1.2)

  const hasAlerts = missing.length > 0 || negative.length > 0 || abnormal.length > 0

  if (!hasAlerts) {
    return (
      <Card className="bg-emerald-50 border-emerald-200 shadow-sm">
        <CardContent className="flex items-center justify-center p-6 text-emerald-700">
          <CheckCircle2 className="w-5 h-5 mr-2" />
          <span className="font-medium">
            Tudo em dia! Sem alertas ou pendências para este período.
          </span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold text-amber-800">DREs Faltantes</CardTitle>
          <FileWarning className="w-4 h-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          {missing.length === 0 ? (
            <p className="text-xs text-amber-700/70">Todos enviados.</p>
          ) : (
            <ul className="space-y-1">
              {missing.map((c) => (
                <li key={c.id} className="text-xs font-medium text-amber-900">
                  • {c.name}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50/50">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold text-red-800">Resultados Negativos</CardTitle>
          <TrendingDown className="w-4 h-4 text-red-600" />
        </CardHeader>
        <CardContent>
          {negative.length === 0 ? (
            <p className="text-xs text-red-700/70">Nenhum resultado negativo.</p>
          ) : (
            <ul className="space-y-1">
              {negative.map((d) => (
                <li key={d.id} className="text-xs font-medium text-red-900 flex justify-between">
                  <Link to={`/dashboard/${d.expand?.company?.slug}`} className="hover:underline">
                    {d.expand?.company?.name}
                  </Link>
                  <span>{formatCurrency(d.resultado)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-indigo-200 bg-indigo-50/50">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold text-indigo-800">Despesas Anormais</CardTitle>
          <AlertTriangle className="w-4 h-4 text-indigo-600" />
        </CardHeader>
        <CardContent>
          {abnormal.length === 0 ? (
            <p className="text-xs text-indigo-700/70">Nenhuma variação alta identificada.</p>
          ) : (
            <ul className="space-y-1">
              {abnormal.map((d) => (
                <li key={d.id} className="text-xs font-medium text-indigo-900 flex justify-between">
                  <Link to={`/dashboard/${d.expand?.company?.slug}`} className="hover:underline">
                    {d.expand?.company?.name}
                  </Link>
                  <span>{formatCurrency(d.total_despesas)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
