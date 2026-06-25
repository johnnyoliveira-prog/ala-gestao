import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DreData } from '@/services/dres'
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GlobalKpisProps {
  currentData: DreData[]
  previousData: DreData[]
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const calcChange = (curr: number, prev: number) => {
  if (prev === 0) return curr === 0 ? 0 : null
  return ((curr - prev) / Math.abs(prev)) * 100
}

function TrendIndicator({ value, invert = false }: { value: number | null; invert?: boolean }) {
  if (value === null)
    return <span className="text-xs text-slate-400 font-normal ml-2">S/ dados</span>
  if (value === 0)
    return (
      <span className="text-xs text-slate-500 font-medium ml-2 flex items-center">
        <MinusIcon className="w-3 h-3 mr-1" />
        0%
      </span>
    )

  const isPositive = value > 0
  const isGood = invert ? !isPositive : isPositive

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

export function GlobalKpis({ currentData, previousData }: GlobalKpisProps) {
  const curRev = currentData.reduce((a, b) => a + b.total_receitas, 0)
  const prevRev = previousData.reduce((a, b) => a + b.total_receitas, 0)
  const revChange = calcChange(curRev, prevRev)

  const curExp = currentData.reduce((a, b) => a + b.total_despesas, 0)
  const prevExp = previousData.reduce((a, b) => a + b.total_despesas, 0)
  const expChange = calcChange(curExp, prevExp)

  const curRes = currentData.reduce((a, b) => a + b.resultado, 0)
  const prevRes = previousData.reduce((a, b) => a + b.resultado, 0)
  const resChange = calcChange(curRes, prevRes)

  const curMargin = curRev > 0 ? (curRes / curRev) * 100 : 0
  const prevMargin = prevRev > 0 ? (prevRes / prevRev) * 100 : 0
  const marginDiff = curRev > 0 && prevRev > 0 ? curMargin - prevMargin : null

  const curOpex = curRev > 0 ? (curExp / curRev) * 100 : 0
  const prevOpex = prevRev > 0 ? (prevExp / prevRev) * 100 : 0
  const opexDiff = curRev > 0 && prevRev > 0 ? curOpex - prevOpex : null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Receita Global</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(curRev)}</div>
          <div className="flex mt-1 items-center">
            <span className="text-xs text-slate-500">vs mês ant.</span>
            <TrendIndicator value={revChange} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Despesa Global</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(curExp)}</div>
          <div className="flex mt-1 items-center">
            <span className="text-xs text-slate-500">vs mês ant.</span>
            <TrendIndicator value={expChange} invert />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">
            Resultado Consolidado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn('text-2xl font-bold', curRes >= 0 ? 'text-emerald-600' : 'text-red-600')}
          >
            {formatCurrency(curRes)}
          </div>
          <div className="flex mt-1 items-center">
            <span className="text-xs text-slate-500">vs mês ant.</span>
            <TrendIndicator value={resChange} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Margem Global</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{curMargin.toFixed(1)}%</div>
          <div className="flex mt-1 items-center">
            <span className="text-xs text-slate-500">vs mês ant.</span>
            <TrendIndicator value={marginDiff} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Eficiência (OPEX %)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{curOpex.toFixed(1)}%</div>
          <div className="flex mt-1 items-center">
            <span className="text-xs text-slate-500">vs mês ant.</span>
            <TrendIndicator value={opexDiff} invert />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
