import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DreData } from '@/services/dres'
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardsProps {
  current: DreData
  previous: DreData | null
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const calcChange = (curr: number, prev: number | undefined) => {
  if (!prev) return null
  return ((curr - prev) / Math.abs(prev)) * 100
}

function TrendIndicator({
  value,
  invertColors = false,
}: {
  value: number | null
  invertColors?: boolean
}) {
  if (value === null)
    return <span className="text-xs text-slate-400 font-normal ml-2">S/ dados ant.</span>
  if (value === 0)
    return (
      <span className="text-xs text-slate-500 font-medium ml-2 flex items-center">
        <MinusIcon className="w-3 h-3 mr-1" />
        0%
      </span>
    )

  const isPositive = value > 0
  const isGood = invertColors ? !isPositive : isPositive

  return (
    <span
      className={cn(
        'text-xs font-medium ml-2 flex items-center',
        isGood ? 'text-emerald-600' : 'text-red-600',
      )}
    >
      {isPositive ? (
        <ArrowUpIcon className="w-3 h-3 mr-0.5" />
      ) : (
        <ArrowDownIcon className="w-3 h-3 mr-0.5" />
      )}
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}

export function KpiCards({ current, previous }: KpiCardsProps) {
  const revChange = calcChange(current.total_receitas, previous?.total_receitas)
  const expChange = calcChange(current.total_despesas, previous?.total_despesas)
  const resChange = calcChange(current.resultado, previous?.resultado)

  const transferPct =
    current.resultado > 0 ? ((current.total_repassar / current.resultado) * 100).toFixed(1) : '0.0'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Receita Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(current.total_receitas)}
          </div>
          <div className="flex mt-1 items-center">
            <span className="text-xs text-slate-500">vs mês ant.</span>
            <TrendIndicator value={revChange} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Despesa Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(current.total_despesas)}
          </div>
          <div className="flex mt-1 items-center">
            <span className="text-xs text-slate-500">vs mês ant.</span>
            <TrendIndicator value={expChange} invertColors />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Resultado Líquido</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'text-2xl font-bold',
              current.resultado >= 0 ? 'text-emerald-600' : 'text-red-600',
            )}
          >
            {formatCurrency(current.resultado)}
          </div>
          <div className="flex mt-1 items-center">
            <span className="text-xs text-slate-500">vs mês ant.</span>
            <TrendIndicator value={resChange} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Fundo Reserva</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(current.taxa_reserva_valor)}
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center">
            Taxa aplicada:{' '}
            <span className="font-medium text-slate-700 ml-1">
              {current.taxa_reserva_percentual}%
            </span>
          </p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 text-white border-none shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">Total a Repassar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(current.total_repassar)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            <span className="font-medium text-emerald-400">{transferPct}%</span> do resultado
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
