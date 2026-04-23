import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { Company, DreData } from '@/services/dres'

interface GlobalTrendsProps {
  currentData: DreData[]
  allData: DreData[]
  companies: Company[]
  month: number
  year: number
}

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#6366f1',
  '#f43f5e',
  '#64748b',
]
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-slate-800 mb-1">{payload[0].name}</p>
        <p className="text-sm text-slate-600">{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export function GlobalTrends({ currentData, allData, companies, month, year }: GlobalTrendsProps) {
  const pieData = useMemo(() => {
    return companies
      .map((c) => {
        const d = currentData.find((x) => x.company === c.id)
        return { name: c.name, value: d ? d.total_receitas : 0 }
      })
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [currentData, companies])

  const trendData = useMemo(() => {
    const result = []
    let curMonth = month
    let curYear = year
    for (let i = 0; i < 12; i++) {
      const monthData = allData.filter((d) => d.month === curMonth && d.year === curYear)
      const sumRes = monthData.reduce((acc, d) => acc + d.resultado, 0)
      result.unshift({
        name: `${MONTHS[curMonth - 1]}/${String(curYear).slice(2)}`,
        Acumulado: sumRes,
      })
      curMonth--
      if (curMonth === 0) {
        curMonth = 12
        curYear--
      }
    }
    return result
  }, [allData, month, year])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-800">
            Composição de Receitas
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400">Sem dados de receitas</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-800">
            Resultado Consolidado (12 Meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ Acumulado: { label: 'Resultado', color: '#10b981' } }}
            className="h-[300px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="Acumulado"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
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
