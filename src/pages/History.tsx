import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
import { Download, Eye, Search, FileText, Trash2 } from 'lucide-react'
import {
  getDreData,
  getDreUploadFileUrl,
  DreData,
  getDreInvestors,
  deleteDreData,
} from '@/services/dres'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function History() {
  const [records, setRecords] = useState<DreData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const [viewRecord, setViewRecord] = useState<DreData | null>(null)
  const [viewInvestors, setViewInvestors] = useState<any[]>([])

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    try {
      const data = await getDreData()
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

  useRealtime('dre_data', () => {
    loadData()
  })

  useEffect(() => {
    if (viewRecord) {
      getDreInvestors(viewRecord.id).then(setViewInvestors).catch(console.error)
    } else {
      setViewInvestors([])
    }
  }, [viewRecord])

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      setRecords((prev) => prev.filter((r) => r.id !== deleteId))
      await deleteDreData(deleteId)
      toast({
        title: 'Sucesso',
        description: 'Registro e dados associados excluídos com sucesso.',
        className: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      })
      setDeleteId(null)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao excluir o registro.' })
      loadData()
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredRecords = records.filter(
    (r) =>
      (r.expand?.company?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.year.toString().includes(searchTerm),
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Histórico de DREs</h1>
          <p className="text-slate-500 mt-1">
            Visualize, baixe e gerencie os demonstrativos processados.
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
                      {record.expand?.company?.name || 'Desconhecida'}
                    </TableCell>
                    <TableCell>
                      {record.month}/{record.year}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(record.total_receitas)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${record.resultado >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      {formatCurrency(record.resultado)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewRecord(record)}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4 text-slate-500" />
                        </Button>
                        {record.expand?.upload?.file_ref && (
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            title="Baixar Arquivo Original"
                          >
                            <a
                              href={getDreUploadFileUrl(record.expand.upload)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="h-4 w-4 text-slate-500" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(record.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!viewRecord} onOpenChange={(open) => !open && setViewRecord(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-500" />
              Resumo do DRE
            </DialogTitle>
            <DialogDescription>
              {viewRecord?.expand?.company?.name} - {viewRecord?.month}/{viewRecord?.year}
            </DialogDescription>
          </DialogHeader>

          {viewRecord && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Receita Total</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(viewRecord.total_receitas)}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Despesas</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatCurrency(viewRecord.total_despesas)}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-6 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-slate-600 font-medium">Resultado</p>
                  <p className="text-xs text-slate-500">Receita Total - Despesas</p>
                </div>
                <p
                  className={`text-2xl font-bold ${viewRecord.resultado >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                >
                  {formatCurrency(viewRecord.resultado)}
                </p>
              </div>

              {viewRecord.recebiveis_futuros && (
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-2 uppercase">
                    Observações / Recebíveis Futuros
                  </h4>
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-md text-sm text-amber-900 whitespace-pre-wrap">
                    {viewRecord.recebiveis_futuros}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir DRE'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
