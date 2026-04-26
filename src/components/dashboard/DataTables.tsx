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

function FlatTable({ data, totalValue }: { data: DreLineItem[]; totalValue: number }) {
  if (data.length === 0) {
    return <div className="p-8 text-center text-slate-500">Nenhum registro encontrado.</div>
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="rounded-md border max-h-[600px] overflow-y-auto overflow-x-auto relative scrollbar-thin">
        <Table>
          <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm outline outline-1 outline-slate-200">
            <TableRow>
              <TableHead className="font-semibold min-w-[250px]">Descrição</TableHead>
              <TableHead className="font-semibold w-[180px]">Resumo</TableHead>
              <TableHead className="font-semibold w-[120px] text-center">Situação</TableHead>
              <TableHead className="text-right font-semibold w-[150px]">Valor (R$)</TableHead>
              <TableHead className="text-right font-semibold w-[100px]">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => {
              const pct = totalValue > 0 ? (row.valor / totalValue) * 100 : 0
              let pctDisplay = `${pct.toFixed(1)}%`
              if (pctDisplay === '0.0%' && row.valor === 0) pctDisplay = '-'
              else if (pct > 0 && pct < 0.1) pctDisplay = '< 0.1%'

              const situacaoStr = (row.situacao || '').toString()
              const isNegative = situacaoStr.includes('-')

              return (
                <TableRow key={row.id || i} className="hover:bg-slate-50/80">
                  <TableCell className="text-slate-800 font-medium">
                    {row.codigo ? `${row.codigo} - ` : ''}
                    {row.descricao}
                  </TableCell>
                  <TableCell
                    className="text-slate-500 text-sm truncate max-w-[180px]"
                    title={row.resumo}
                  >
                    {row.resumo || '-'}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wider ${
                        isNegative ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {situacaoStr || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-900">
                    {formatCurrency(row.valor || 0)}
                  </TableCell>
                  <TableCell className="text-right text-slate-500 font-medium">
                    {pctDisplay}
                  </TableCell>
                </TableRow>
              )
            })}
            <TableRow className="bg-slate-100 hover:bg-slate-100 font-bold">
              <TableCell colSpan={3} className="text-right text-slate-900 uppercase">
                Total
              </TableCell>
              <TableCell className="text-right text-slate-900">
                {formatCurrency(totalValue)}
              </TableCell>
              <TableCell className="text-right text-slate-900">
                {totalValue > 0 ? '100.0%' : '-'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function DataTables({ lineItems }: DataTablesProps) {
  const dotItems = useMemo(() => {
    return lineItems.filter((item) => {
      const dots = (item.codigo || '').match(/\./g) || []
      return dots.length === 1
    })
  }, [lineItems])

  const { revs, exps, totalRevenue, totalExpenses } = useMemo(() => {
    const r = dotItems.filter((i) => i.tipo?.trim().toLowerCase() === 'receita')
    const e = dotItems.filter((i) => i.tipo?.trim().toLowerCase() === 'despesa')

    const sortFn = (a: DreLineItem, b: DreLineItem) => {
      const aCode = a.codigo || ''
      const bCode = b.codigo || ''
      return aCode.localeCompare(bCode, undefined, { numeric: true, sensitivity: 'base' })
    }

    r.sort(sortFn)
    e.sort(sortFn)

    return {
      revs: r,
      exps: e,
      totalRevenue: r.reduce((sum, item) => sum + (item.valor || 0), 0),
      totalExpenses: e.reduce((sum, item) => sum + (item.valor || 0), 0),
    }
  }, [dotItems])

  return (
    <Card className="w-full">
      <CardContent className="p-0 sm:p-6 sm:pt-6">
        <Tabs defaultValue="receitas" className="w-full">
          <div className="px-4 pt-4 sm:p-0">
            <TabsList className="grid w-full grid-cols-2 max-w-[300px]">
              <TabsTrigger value="receitas">Receitas</TabsTrigger>
              <TabsTrigger value="despesas">Despesas</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-4 sm:p-0 sm:pt-6">
            <TabsContent value="receitas" className="m-0 animate-fade-in">
              <FlatTable data={revs} totalValue={totalRevenue} />
            </TabsContent>

            <TabsContent value="despesas" className="m-0 animate-fade-in">
              <FlatTable data={exps} totalValue={totalExpenses} />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
