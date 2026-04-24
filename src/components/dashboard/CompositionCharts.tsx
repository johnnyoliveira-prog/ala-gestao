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

function processPieData(items: DreLineItem[], typePrefix: string, tipoString: string) {
  const filtered = items.filter(
    (i) =>
      i.codigo?.startsWith(typePrefix) || i.tipo?.trim().toLowerCase() === tipoString.toLowerCase(),
  )

  const excludedTerms = [
    'valor repassado aos investidores',
    'distribuição aos sócios',
    'fundo reserva',
    'total a repassar',
  ]

  const aggregated = new Map<string, DreLineItem>()
  for (const item of filtered) {
    const descLower = (item.descricao || '').toLowerCase()
    if (excludedTerms.some((term) => descLower.includes(term))) continue

    const code = item.codigo?.trim()
    if (code) {
      if (aggregated.has(code)) {
        const existing = aggregated.get(code)!
        aggregated.set(code, { ...existing, valor: existing.valor + item.valor })
      } else {
        aggregated.set(code, { ...item })
      }
    }
  }

  const uniqueItems = Array.from(aggregated.values())
  const codes = new Set(uniqueItems.map((i) => i.codigo?.trim()).filter(Boolean))

  const leafItems = uniqueItems.filter((i) => {
    const code = i.codigo?.trim()
    if (!code) return false
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
      const prefix = parts.length >= 2 ? parts.slice(0, 2).join('.') : 'Outros'

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
    .filter((item) => item.value > 0)
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
  const revData = useMemo(() => processPieData(lineItems, '1', 'receita'), [lineItems])
  const expData = useMemo(() => processPieData(lineItems, '2', 'despesa'), [lineItems])

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
