import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Eye, Search, FileText } from 'lucide-react'
import { getDres, getDreFileUrl, DreRecord } from '@/services/dres'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function History() {
  const [records, setRecords] = useState<DreRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const [viewRecord, setViewRecord] = useState<DreRecord | null>(null)

  const loadData = async () => {
    try {
      const data = await getDres()
      setRecords(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('dres', () => {
    loadData()
  })

  const filteredRecords = records.filter(
    (r) =>
      r.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.year.includes(searchTerm),
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Histórico de DREs</h1>
          <p className="text-slate-500 mt-1">
            Visualize e baixe os demonstrativos processados anteriormente.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar empresa ou ano..."
            className="pl-9 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700">Empresa</TableHead>
                <TableHead className="font-semibold text-slate-700">Período</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">
                  Receita Total
                </TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">Resultado</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                    <div className="animate-pulse flex items-center justify-center gap-2">
                      <div className="h-4 w-4 bg-slate-300 rounded-full"></div>
                      Carregando histórico...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-slate-900">
                      {record.company_name}
                    </TableCell>
                    <TableCell>
                      {record.month}/{record.year}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(record.total_revenue)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${record.net_result >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      {formatCurrency(record.net_result)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewRecord(record)}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4 text-slate-500" />
                        </Button>
                        {record.file_ref && (
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            title="Baixar Arquivo Original"
                          >
                            <a
                              href={getDreFileUrl(record)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="h-4 w-4 text-slate-500" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={!!viewRecord} onOpenChange={(open) => !open && setViewRecord(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-500" />
              Resumo do DRE
            </DialogTitle>
            <DialogDescription>
              {viewRecord?.company_name} - {viewRecord?.month}/{viewRecord?.year}
            </DialogDescription>
          </DialogHeader>

          {viewRecord && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Receita Total</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(viewRecord.total_revenue)}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Despesas</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatCurrency(viewRecord.total_expenses)}
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-6 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Valor Repassado aos Investidores</p>
                  <p className="text-xs mt-1 text-slate-500">
                    Descontadas as taxas ({viewRecord.admin_fee_pct}% adm,{' '}
                    {viewRecord.reserve_fee_pct}% reserva)
                  </p>
                </div>
                <p className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(viewRecord.total_transfer)}
                </p>
              </div>

              {viewRecord.investors_data && viewRecord.investors_data.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-2 uppercase">Distribuição</h4>
                  <div className="border rounded-md divide-y">
                    {viewRecord.investors_data.map((inv, idx) => (
                      <div key={idx} className="flex justify-between p-3 text-sm">
                        <span>
                          {inv.name} ({inv.pct}%)
                        </span>
                        <span className="font-semibold">{formatCurrency(inv.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewRecord.future_receivables && (
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-2 uppercase">
                    Observações / Recebíveis Futuros
                  </h4>
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-md text-sm text-amber-900 whitespace-pre-wrap">
                    {viewRecord.future_receivables}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
