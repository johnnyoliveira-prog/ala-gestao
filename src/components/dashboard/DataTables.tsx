import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DreData, DreLineItem } from '@/services/dres'

interface DataTablesProps {
  lineItems: DreLineItem[]
  currentDre: DreData
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const getDepth = (codigo: string) => {
  if (!codigo) return 3
  const parts = codigo.split('.').filter((p) => p.trim().length > 0)
  return parts.length
}

function HierarchicalTable({ data, totalValue }: { data: any[]; totalValue: number }) {
  if (data.length === 0) {
    return <div className="p-8 text-center text-slate-500">Nenhum registro encontrado.</div>
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="rounded-md border max-h-[600px] overflow-y-auto overflow-x-auto relative scrollbar-thin">
        <Table>
          <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm outline outline-1 outline-slate-200">
            <TableRow>
              <TableHead className="font-semibold w-[120px]">Código</TableHead>
              <TableHead className="font-semibold min-w-[250px]">Descrição</TableHead>
              <TableHead className="font-semibold w-[180px]">Resumo</TableHead>
              <TableHead className="font-semibold w-[100px] text-center">Situação</TableHead>
              <TableHead className="text-right font-semibold w-[150px]">Valor (R$)</TableHead>
              <TableHead className="text-right font-semibold w-[100px]">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => {
              const depth = getDepth(row.codigo)
              let rowClass = ''
              let textClass = ''

              if (depth === 1) {
                rowClass = 'bg-slate-200 hover:bg-slate-200/90'
                textClass = 'font-bold text-slate-900'
              } else if (depth === 2) {
                rowClass = 'bg-slate-100 hover:bg-slate-100/90'
                textClass = 'font-semibold text-slate-800'
              } else {
                textClass = 'text-slate-600'
              }

              const pct = totalValue > 0 ? (row.valor / totalValue) * 100 : 0
              let pctDisplay = `${pct.toFixed(1)}%`
              if (pctDisplay === '0.0%' && row.valor === 0) pctDisplay = '-'
              else if (pct > 0 && pct < 0.1) pctDisplay = '< 0.1%'

              const desc = row.descricao || ''
              let resumo = ''
              if (desc.toUpperCase().includes('NAO USAR')) {
                resumo = 'NAO USAR'
              } else if (desc.length > 0) {
                resumo = desc.substring(0, 15).trim()
              }

              return (
                <TableRow key={row.id || i} className={rowClass}>
                  <TableCell className={`font-medium ${textClass}`}>{row.codigo}</TableCell>
                  <TableCell
                    className={textClass}
                    style={{ paddingLeft: depth > 1 ? `${(depth - 1) * 1.5}rem` : '1rem' }}
                  >
                    {row.descricao}
                  </TableCell>
                  <TableCell
                    className="text-slate-500 text-sm truncate max-w-[180px]"
                    title={resumo}
                  >
                    {resumo}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 tracking-wider">
                      ATIVO
                    </span>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${textClass}`}>
                    {formatCurrency(row.valor || 0)}
                  </TableCell>
                  <TableCell
                    className={`text-right ${depth <= 2 ? 'font-medium text-slate-700' : 'text-slate-500'}`}
                  >
                    {pctDisplay}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function DataTables({ lineItems, currentDre }: DataTablesProps) {
  const uniqueLineItems = useMemo(() => {
    const seen = new Set<string>()
    const excludedTerms = ['valor repassado aos investidores', 'distribuição aos sócios']

    return lineItems.filter((item) => {
      const descLower = (item.descricao || '').toLowerCase()
      if (excludedTerms.some((term) => descLower.includes(term))) return false

      const key = `${item.codigo}-${item.descricao}-${item.valor}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [lineItems])

  const sortedItems = useMemo(() => {
    return [...uniqueLineItems].sort((a, b) => {
      const aCode = a.codigo || ''
      const bCode = b.codigo || ''
      return aCode.localeCompare(bCode, undefined, { numeric: true, sensitivity: 'base' })
    })
  }, [uniqueLineItems])

  const revs = sortedItems.filter((i) => i.tipo?.trim().toLowerCase() === 'receita')
  const exps = sortedItems.filter((i) => i.tipo?.trim().toLowerCase() === 'despesa')

  const totalRevenue = currentDre?.total_receitas || 0
  const totalExpenses = currentDre?.total_despesas || 0

  return (
    <Card className="w-full">
      <CardContent className="p-0 sm:p-6 sm:pt-6">
        <Tabs defaultValue="despesas" className="w-full">
          <div className="px-4 pt-4 sm:p-0">
            <TabsList className="grid w-full grid-cols-2 max-w-[300px]">
              <TabsTrigger value="receitas">Receitas</TabsTrigger>
              <TabsTrigger value="despesas">Despesas</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-4 sm:p-0 sm:pt-6">
            <TabsContent value="receitas" className="m-0 animate-fade-in">
              <HierarchicalTable data={revs} totalValue={totalRevenue} />
            </TabsContent>

            <TabsContent value="despesas" className="m-0 animate-fade-in">
              <HierarchicalTable data={exps} totalValue={totalExpenses} />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
