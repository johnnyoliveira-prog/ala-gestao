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
              <TableHead className="font-semibold w-[100px]">Código</TableHead>
              <TableHead className="font-semibold min-w-[250px]">Descrição</TableHead>
              <TableHead className="font-semibold w-[180px]">Resumo</TableHead>
              <TableHead className="font-semibold w-[100px] text-center">Situação</TableHead>
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

              const desc = row.descricao || ''
              let resumo = ''
              if (desc.toUpperCase().includes('NAO USAR')) {
                resumo = 'NAO USAR'
              } else if (desc.length > 0) {
                resumo = desc.substring(0, 20).trim()
              }

              return (
                <TableRow key={row.codigo || row.id || i} className="hover:bg-slate-50/80">
                  <TableCell className="font-medium text-slate-700">{row.codigo}</TableCell>
                  <TableCell className="text-slate-800 font-medium">{row.descricao}</TableCell>
                  <TableCell className="text-slate-500 text-sm truncate max-w-[180px]" title={desc}>
                    {resumo}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 tracking-wider">
                      ATIVO
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
              <TableCell colSpan={4} className="text-right text-slate-900 uppercase">
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

export function DataTables({ lineItems, currentDre }: DataTablesProps) {
  const uniqueLineItems = useMemo(() => {
    const excludedTerms = [
      'valor repassado aos investidores',
      'distribuição aos sócios',
      'fundo reserva',
      'total a repassar',
    ]

    const items = lineItems
      .filter((item) => {
        const descLower = (item.descricao || '').toLowerCase()
        return !excludedTerms.some((term) => descLower.includes(term))
      })
      .map((item) => ({
        ...item,
        codigo: (item.codigo || '').replace(/\.$/, '').trim(),
      }))

    const grouped = new Map<string, any>()
    const withoutCode: any[] = []

    const getParentItem = (code: string) => items.find((i) => i.codigo === code)

    // Regex to capture exactly X.XX (e.g., 1.02, 2.01, 3.03) from any valid subcode
    // Also allows X.X (e.g. 2.1) to be resilient to missing leading zeros.
    const level2Regex = /^(\d+\.\d{1,2})(?:\.|$)/

    for (const item of items) {
      if (!item.codigo) {
        withoutCode.push({ ...item })
        continue
      }

      const match = item.codigo.match(level2Regex)
      if (match) {
        const level2 = match[1]

        if (!grouped.has(level2)) {
          const parent = getParentItem(level2)
          grouped.set(level2, {
            codigo: level2,
            descricao: parent?.descricao || item.descricao,
            parentValor: parent?.valor,
            childrenSum: 0,
            tipo: parent?.tipo || item.tipo,
            id: parent?.id || item.id,
          })
        }

        const group = grouped.get(level2)!

        if (item.codigo === level2) {
          group.parentValor = item.valor
          group.descricao = item.descricao
        } else {
          group.childrenSum += item.valor
        }
      }
    }

    const result = Array.from(grouped.values()).map((g) => {
      const valor = g.parentValor !== undefined && g.parentValor > 0 ? g.parentValor : g.childrenSum
      return {
        id: g.id,
        codigo: g.codigo,
        descricao: g.descricao,
        valor,
        tipo: g.tipo,
      }
    })

    return [...result, ...withoutCode]
  }, [lineItems])

  const sortedItems = useMemo(() => {
    return [...uniqueLineItems].sort((a, b) => {
      const aCode = a.codigo || ''
      const bCode = b.codigo || ''
      return aCode.localeCompare(bCode, undefined, { numeric: true, sensitivity: 'base' })
    })
  }, [uniqueLineItems])

  const revs = sortedItems.filter((i) => {
    const t = i.tipo?.trim().toLowerCase()
    if (t === 'receita') return true
    if (t === 'despesa') return false
    const d = (i.descricao || '').toLowerCase()
    if (d.includes('receita')) return true
    if (d.includes('despesa') || d.includes('custo')) return false
    return i.codigo?.startsWith('1')
  })

  const exps = sortedItems.filter((i) => {
    const t = i.tipo?.trim().toLowerCase()
    if (t === 'despesa') return true
    if (t === 'receita') return false
    const d = (i.descricao || '').toLowerCase()
    if (d.includes('despesa') || d.includes('custo')) return true
    if (d.includes('receita')) return false
    return !i.codigo?.startsWith('1')
  })

  const totalRevenue = revs.reduce((sum, r) => sum + (r.valor || 0), 0)
  const totalExpenses = exps.reduce((sum, e) => sum + (e.valor || 0), 0)

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
