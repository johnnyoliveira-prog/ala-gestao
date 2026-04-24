import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DreLineItem } from '@/services/dres'

interface CompositionChartsProps {
  lineItems: DreLineItem[]
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function processPieData(items: DreLineItem[], tipo: string) {
  const filtered = items.filter((i) => i.tipo?.trim().toLowerCase() === tipo.toLowerCase())

  const seen = new Set<string>()
  const excludedTerms = ['valor repassado aos investidores', 'distribuição aos sócios']

  const uniqueItems = filtered.filter((item) => {
    const descLower = (item.descricao || '').toLowerCase()
    if (excludedTerms.some((term) => descLower.includes(term))) return false

    const code = item.codigo?.trim()
    const key = code ? `code-${code}` : `val-${item.descricao}-${item.valor}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const codes = new Set(uniqueItems.map((i) => i.codigo?.trim()).filter(Boolean))
  const leafItems = uniqueItems.filter((i) => {
    const code = i.codigo?.trim()
    if (!code) return true
    for (const c of codes) {
      if (c !== code && c.startsWith(code + '.')) {
        return false
      }
    }
    return true
  })

  const grouped = leafItems.reduce(
    (acc, curr) => {
      const code = curr.codigo?.trim() || ''
      const parts = code.split('.').filter((p) => p.length > 0)
      const prefix = parts.length > 0 ? parts.slice(0, 2).join('.') : 'Outros'

      acc[prefix] = (acc[prefix] || 0) + curr.valor
      return acc
    },
    {} as Record<string, number>,
  )

  return Object.entries(grouped)
    .map(([prefix, value]) => {
      if (prefix === 'Outros') return { name: 'Outros', value }
      const parentItem = uniqueItems.find((x) => x.codigo?.trim() === prefix)
      const name = parentItem?.descricao ? `${prefix} - ${parentItem.descricao}` : prefix
      return { name, value }
    })
    .sort((a, b) => b.value - a.value)
}

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

export function CompositionCharts({ lineItems }: CompositionChartsProps) {
  const revData = useMemo(() => processPieData(lineItems, 'receita'), [lineItems])
  const expData = useMemo(() => processPieData(lineItems, 'despesa'), [lineItems])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-800">
            Composição de Receitas
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          {revData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {revData.map((_, index) => (
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
            <p className="text-sm text-slate-400">Sem dados detalhados</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-800">
            Composição de Despesas
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          {expData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {expData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
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
            <p className="text-sm text-slate-400">Sem dados detalhados</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
