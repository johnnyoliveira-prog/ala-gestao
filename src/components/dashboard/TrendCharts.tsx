import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DreData } from '@/services/dres'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function TrendCharts({ allData, selectedId }: { allData: DreData[]; selectedId: string }) {
  const chartData = [...allData].reverse().map((d) => ({
    name: `${MONTHS[d.month - 1]}/${d.year}`,
    Receitas: d.total_receitas || 0,
    Despesas: d.total_despesas || 0,
    Resultado: d.resultado || 0,
    isCurrent: d.id === selectedId,
  }))

  const config = {
    Receitas: { label: 'Receitas', color: 'hsl(142, 71%, 45%)' },
    Despesas: { label: 'Despesas', color: 'hsl(0, 84%, 60%)' },
    Resultado: { label: 'Resultado', color: 'hsl(217, 91%, 60%)' },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-800">Evolução Financeira</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ChartContainer config={config} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="Receitas" fill="var(--color-Receitas)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill="var(--color-Despesas)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Resultado" fill="var(--color-Resultado)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
