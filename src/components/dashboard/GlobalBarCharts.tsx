import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Company, DreData } from '@/services/dres'

interface GlobalBarChartsProps {
  currentData: DreData[]
  companies: Company[]
}

const barConfig = { value: { label: 'Valor' } }

export function GlobalBarCharts({ currentData, companies }: GlobalBarChartsProps) {
  const revenueData = useMemo(() => {
    return companies
      .map((c) => {
        const d = currentData.find((x) => x.company === c.id)
        return { name: c.name, value: d ? d.total_receitas : 0 }
      })
      .sort((a, b) => b.value - a.value)
  }, [currentData, companies])

  const resultData = useMemo(() => {
    return companies
      .map((c) => {
        const d = currentData.find((x) => x.company === c.id)
        return { name: c.name, value: d ? d.resultado : 0 }
      })
      .sort((a, b) => b.value - a.value)
  }, [currentData, companies])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-800">
            Ranking de Receitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={revenueData} margin={{ left: 20, right: 20 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(val: number) => `R$ ${val.toLocaleString('pt-BR')}`}
                    />
                  }
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-800">
            Ranking de Resultados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={resultData} margin={{ left: 20, right: 20 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(val: number) => `R$ ${val.toLocaleString('pt-BR')}`}
                    />
                  }
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={30}>
                  {resultData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
