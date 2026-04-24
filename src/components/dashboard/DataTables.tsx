import { useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { DreLineItem } from '@/services/dres'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DataTablesProps {
  lineItems: DreLineItem[]
}

const ITEMS_PER_PAGE = 20

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function PaginatedTable({ data, type }: { data: any[]; type: 'receitas' | 'despesas' }) {
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE)
  const paginatedData = data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  if (data.length === 0) {
    return <div className="p-8 text-center text-slate-500">Nenhum registro encontrado.</div>
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold w-[100px]">Código</TableHead>
              <TableHead className="font-semibold">Descrição</TableHead>
              <TableHead className="font-semibold">Categoria</TableHead>
              <TableHead className="text-right font-semibold">Valor (R$)</TableHead>
              <TableHead className="text-right font-semibold w-[100px]">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, i) => (
              <TableRow key={row.id || i}>
                <TableCell className="font-medium text-slate-600">{row.codigo}</TableCell>
                <TableCell>{row.descricao}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                    {row.categoria || 'N/A'}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(row.valor)}
                </TableCell>
                <TableCell className="text-right text-slate-500">
                  {row.percentual?.toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Mostrando {(page - 1) * ITEMS_PER_PAGE + 1} a{' '}
            {Math.min(page * ITEMS_PER_PAGE, data.length)} de {data.length} registros
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próximo <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function DataTables({ lineItems }: DataTablesProps) {
  const revs = lineItems.filter((i) => i.tipo === 'receita')
  const exps = lineItems.filter((i) => i.tipo === 'despesa')

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
            <TabsContent value="receitas" className="m-0">
              <PaginatedTable data={revs} type="receitas" />
            </TabsContent>

            <TabsContent value="despesas" className="m-0">
              <PaginatedTable data={exps} type="despesas" />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
