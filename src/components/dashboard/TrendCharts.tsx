import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  LineChart,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { DreData } from '@/services/dres'

interface TrendChartsProps {
  allData: DreData[]
  selectedId: string
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const barChartConfig = {
  Receitas: { label: 'Receitas', color: '#3b82f6' },
  Despesas: { label: 'Despesas', color: '#ef4444' },
}

const lineChartConfig = {
  Acumulado: { label: 'Result. Acumulado', color: '#10b981' },
}

export function TrendCharts({ allData, selectedId }: TrendChartsProps) {
  const trendData = useMemo(() => {
    const selectedIndex = allData.findIndex((d) => d.id === selectedId)
    if (selectedIndex === -1) return []

    return allData
      .slice(selectedIndex, selectedIndex + 12)
      .reverse()
      .map((d) => ({
        name: `${MONTHS[d.month - 1]}/${d.year.toString().slice(2)}`,
        Receitas: d.total_receitas,
        Despesas: d.total_despesas,
        Acumulado: d.resultado_acumulado,
      }))
  }, [allData, selectedId])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-800">
            Receitas vs Despesas (12 Meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barChartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis
                  tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(val: number) =>
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(val)
                      }
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="Receitas"
                  fill="var(--color-Receitas)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="Despesas"
                  fill="var(--color-Despesas)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-800">
            Resultado Acumulado (12 Meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis
                  tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(val: number) =>
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(val)
                      }
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="Acumulado"
                  stroke="var(--color-Acumulado)"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
