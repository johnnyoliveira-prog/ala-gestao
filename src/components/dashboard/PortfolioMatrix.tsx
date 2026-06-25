import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DreData, Company } from '@/services/dres'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'

export function PortfolioMatrix({
  currentData,
  companies,
}: {
  currentData: DreData[]
  companies: Company[]
}) {
  const data = useMemo(() => {
    return currentData.map((d) => {
      const comp = companies.find((c) => c.id === d.company)
      const revenue = d.total_receitas || 0
      const margin = revenue > 0 ? ((d.resultado || 0) / revenue) * 100 : 0
      return {
        id: d.company,
        name: comp?.name || 'Desconhecida',
        revenue,
        margin,
      }
    })
  }, [currentData, companies])

  if (data.length === 0) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Matriz de Portfólio</CardTitle>
          <CardDescription>Receita vs Margem de Lucro</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center text-slate-500">
          Nenhum dado disponível.
        </CardContent>
      </Card>
    )
  }

  const avgRevenue = data.reduce((sum, item) => sum + item.revenue, 0) / data.length
  const avgMargin = data.reduce((sum, item) => sum + item.margin, 0) / data.length

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val)
  const formatPercent = (val: number) => val.toFixed(1) + '%'

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-md text-sm">
          <p className="font-semibold text-slate-800 mb-2">{data.name}</p>
          <p className="text-slate-600">
            <span className="font-medium">Receita:</span> {formatCurrency(data.revenue)}
          </p>
          <p className="text-slate-600">
            <span className="font-medium">Margem:</span> {formatPercent(data.margin)}
          </p>
        </div>
      )
    }
    return null
  }

  const chartConfig = {
    revenue: { label: 'Receita', color: 'hsl(var(--primary))' },
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-800">Matriz de Portfólio</CardTitle>
        <CardDescription>Receita vs Margem de Lucro</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="revenue"
                  name="Receita"
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                />
                <YAxis
                  type="number"
                  dataKey="margin"
                  name="Margem"
                  tickFormatter={(val) => `${val.toFixed(0)}%`}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <ReferenceLine x={avgRevenue} stroke="#94a3b8" strokeDasharray="3 3" />
                <ReferenceLine y={avgMargin} stroke="#94a3b8" strokeDasharray="3 3" />
                <Scatter name="Empresas" data={data} fill="#6366f1">
                  {data.map((entry, index) => {
                    let fill = '#6366f1' // default
                    if (entry.revenue >= avgRevenue && entry.margin >= avgMargin)
                      fill = '#10b981' // Stars (Green)
                    else if (entry.revenue < avgRevenue && entry.margin < avgMargin)
                      fill = '#ef4444' // Adjustment (Red)
                    else if (entry.revenue >= avgRevenue && entry.margin < avgMargin)
                      fill = '#f59e0b' // High Rev, Low Margin (Yellow)
                    else fill = '#3b82f6' // Low Rev, High Margin (Blue)
                    return <Cell key={`cell-${index}`} fill={fill} />
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#10b981]"></div> Alta Rec / Alta Mar
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div> Baixa Rec / Alta Mar
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div> Alta Rec / Baixa Mar
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div> Baixa Rec / Baixa Mar
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
