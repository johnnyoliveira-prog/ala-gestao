import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  DollarSign,
  TrendingDown,
  Activity,
  Percent,
} from 'lucide-react'
import { DreData } from '@/services/dres'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function KpiCards({ current, previous }: { current: DreData; previous: DreData | null }) {
  const rev = current.total_receitas || 0
  const exp = current.total_despesas || 0
  const res = current.resultado || 0

  const prevRev = previous?.total_receitas || 0
  const prevExp = previous?.total_despesas || 0
  const prevRes = previous?.resultado || 0

  const calcTrend = (curr: number, prev: number) => {
    if (!prev) return { value: 0, isPositive: curr >= 0 }
    const diff = curr - prev
    const pct = (diff / Math.abs(prev)) * 100
    return { value: pct, isPositive: diff >= 0 }
  }

  const revTrend = calcTrend(rev, prevRev)
  const expTrend = calcTrend(exp, prevExp)
  const resTrend = calcTrend(res, prevRes)

  const grossMargin = rev > 0 ? ((rev - exp) / rev) * 100 : null
  const prevGrossMargin = prevRev > 0 ? ((prevRev - prevExp) / prevRev) * 100 : null
  const grossMarginTrend =
    grossMargin !== null && prevGrossMargin !== null
      ? { value: grossMargin - prevGrossMargin, isPositive: grossMargin - prevGrossMargin >= 0 }
      : null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Receita Total</CardTitle>
          <DollarSign className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(rev)}</div>
          {previous && (
            <p
              className={`text-xs flex items-center mt-1 ${revTrend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {revTrend.isPositive ? (
                <ArrowUpIcon className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownIcon className="h-3 w-3 mr-1" />
              )}
              {Math.abs(revTrend.value).toFixed(1)}% em relação ao mês anterior
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Despesa Total</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(exp)}</div>
          {previous && (
            <p
              className={`text-xs flex items-center mt-1 ${!expTrend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {!expTrend.isPositive ? (
                <ArrowDownIcon className="h-3 w-3 mr-1" />
              ) : (
                <ArrowUpIcon className="h-3 w-3 mr-1" />
              )}
              {Math.abs(expTrend.value).toFixed(1)}% em relação ao mês anterior
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Resultado Líquido</CardTitle>
          <Activity className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${res >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(res)}
          </div>
          {previous && (
            <p
              className={`text-xs flex items-center mt-1 ${resTrend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {resTrend.isPositive ? (
                <ArrowUpIcon className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownIcon className="h-3 w-3 mr-1" />
              )}
              {Math.abs(resTrend.value).toFixed(1)}% em relação ao mês anterior
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Margem Bruta %</CardTitle>
          <Percent className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${grossMargin !== null && grossMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
          >
            {grossMargin !== null ? `${grossMargin.toFixed(1)}%` : 'N/A'}
          </div>
          {previous && grossMarginTrend && (
            <p
              className={`text-xs flex items-center mt-1 ${grossMarginTrend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {grossMarginTrend.isPositive ? (
                <ArrowUpIcon className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownIcon className="h-3 w-3 mr-1" />
              )}
              {Math.abs(grossMarginTrend.value).toFixed(1)} p.p. em relação ao mês anterior
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
