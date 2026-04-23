import { useState, useRef, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Settings2,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getCompanies, Company, checkDuplicateDreData, saveDreFull, DreData } from '@/services/dres'

const MONTHS = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
]

const YEARS = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i))

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function Index() {
  const { user } = useAuth()
  const [dbCompanies, setDbCompanies] = useState<Company[]>([])
  const [company, setCompany] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [rawSpreadsheetData, setRawSpreadsheetData] = useState<any[] | null>(null)
  const [isMapping, setIsMapping] = useState(false)
  const [mapping, setMapping] = useState({
    total_receitas: '',
    total_despesas: '',
    resultado: '',
    codigo: '',
    descricao: '',
    valor: '',
    categoria: '',
  })

  const [extractedData, setExtractedData] = useState<any>(null)
  const [futureReceivables, setFutureReceivables] = useState('')
  const [duplicateRecord, setDuplicateRecord] = useState<DreData | null>(null)
  const [showOverwriteModal, setShowOverwriteModal] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getCompanies().then(setDbCompanies).catch(console.error)
  }, [])

  const totalTransfer = useMemo(() => {
    if (!extractedData) return 0
    const net = Number(extractedData.net_result) || 0
    const totalFeePct =
      (Number(extractedData.admin_fee_pct) || 0) + (Number(extractedData.reserve_fee_pct) || 0)
    return net - net * (totalFeePct / 100)
  }, [extractedData?.net_result, extractedData?.admin_fee_pct, extractedData?.reserve_fee_pct])

  useEffect(() => {
    if (extractedData) {
      setExtractedData((prev: any) => ({
        ...prev,
        investors_data: prev.investors_data.map((inv: any) => ({
          ...inv,
          value: totalTransfer * (inv.pct / 100),
        })),
      }))
    }
  }, [totalTransfer])

  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = ['application/pdf', 'text/csv']
    if (!validTypes.includes(selectedFile.type) && !/\.(pdf|csv)$/i.test(selectedFile.name)) {
      toast({
        variant: 'destructive',
        title: 'Arquivo inválido',
        description: 'Por favor, envie apenas arquivos PDF ou CSV.',
      })
      return
    }
    setFile(selectedFile)
    extractFromFile(selectedFile)
  }

  const extractFromFile = async (uploadedFile: File) => {
    setIsExtracting(true)
    setExtractedData(null)
    setRawSpreadsheetData(null)
    setIsMapping(false)

    try {
      if (uploadedFile.name.endsWith('.pdf')) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(uploadedFile)
        })
        const base64 = dataUrl.split(',')[1]

        const response = await pb.send('/backend/v1/parse-dre', {
          method: 'POST',
          body: JSON.stringify({ content: base64 }),
          headers: { 'Content-Type': 'application/json' },
        })
        setExtractedData(response)
        toast({ title: 'Extração concluída' })
      } else {
        const textContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsText(uploadedFile)
        })

        const response = await pb.send('/backend/v1/parse-spreadsheet', {
          method: 'POST',
          body: JSON.stringify({ content: textContent }),
          headers: { 'Content-Type': 'application/json' },
        })
        if (response.data && response.data.length > 0) {
          setRawSpreadsheetData(response.data)
          setIsMapping(true)
          toast({
            title: 'Planilha Lida',
            description: 'Por favor, mapeie as colunas para o sistema.',
          })
        } else {
          throw new Error('A planilha está vazia ou não pôde ser lida.')
        }
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro na Extração',
        description: getErrorMessage(error) || 'Estrutura inválida.',
      })
      removeFile()
    } finally {
      setIsExtracting(false)
    }
  }

  const handleApplyMapping = () => {
    if (!mapping.total_receitas || !mapping.total_despesas || !mapping.resultado) {
      toast({
        variant: 'destructive',
        title: 'Erro de Mapeamento',
        description: 'Os campos de totais são obrigatórios.',
      })
      return
    }
    if (!rawSpreadsheetData || rawSpreadsheetData.length === 0) return

    const firstRow = rawSpreadsheetData[0]
    const line_items = rawSpreadsheetData
      .map((row) => ({
        tipo: row[mapping.categoria]?.toString().toLowerCase().includes('receita')
          ? 'receita'
          : 'despesa',
        codigo: row[mapping.codigo] || '',
        descricao: row[mapping.descricao] || '',
        valor: Number(row[mapping.valor]) || 0,
        categoria: row[mapping.categoria] || '',
      }))
      .filter((item) => item.descricao || item.valor > 0)

    setExtractedData({
      total_revenue: Number(firstRow[mapping.total_receitas]) || 0,
      total_expenses: Number(firstRow[mapping.total_despesas]) || 0,
      net_result: Number(firstRow[mapping.resultado]) || 0,
      admin_fee_pct: 10,
      reserve_fee_pct: 5,
      investors_data: [
        { name: 'Sócio Majoritário', pct: 70, value: 0 },
        { name: 'Sócio Minoritário', pct: 30, value: 0 },
      ],
      line_items,
    })
    setIsMapping(false)
    toast({ title: 'Mapeamento Concluído', description: 'Dados extraídos com sucesso.' })
  }

  const removeFile = () => {
    setFile(null)
    setExtractedData(null)
    setRawSpreadsheetData(null)
    setIsMapping(false)
    setFutureReceivables('')
  }

  const handleSaveAttempt = async () => {
    if (!company || !month || !year || !extractedData) {
      toast({
        variant: 'destructive',
        title: 'Atenção',
        description: 'Preencha todos os campos e aguarde a extração.',
      })
      return
    }
    setIsSaving(true)
    const duplicate = await checkDuplicateDreData(company, Number(month), Number(year))
    if (duplicate) {
      setDuplicateRecord(duplicate)
      setShowOverwriteModal(true)
      setIsSaving(false)
    } else {
      await performSave()
    }
  }

  const performSave = async (idToUpdate?: string) => {
    if (!user) return
    try {
      setIsSaving(true)
      const fileType = file ? (file.name.endsWith('.pdf') ? 'pdf' : 'csv') : ''
      const taxa_adm_val =
        (Number(extractedData.net_result) || 0) * ((Number(extractedData.admin_fee_pct) || 0) / 100)
      const taxa_res_val =
        (Number(extractedData.net_result) || 0) *
        ((Number(extractedData.reserve_fee_pct) || 0) / 100)

      await saveDreFull({
        userId: user.id,
        companyId: company,
        month: Number(month),
        year: Number(year),
        file,
        fileType,
        data: {
          total_receitas: Number(extractedData.total_revenue) || 0,
          total_despesas: Number(extractedData.total_expenses) || 0,
          resultado: Number(extractedData.net_result) || 0,
          saldo_anterior: 0,
          resultado_acumulado: Number(extractedData.net_result) || 0,
          taxa_administracao_percentual: Number(extractedData.admin_fee_pct) || 0,
          taxa_administracao_valor: taxa_adm_val,
          taxa_reserva_percentual: Number(extractedData.reserve_fee_pct) || 0,
          taxa_reserva_valor: taxa_res_val,
          outras_deducoes: 0,
          total_repassar: totalTransfer,
          recebiveis_futuros: futureReceivables,
        },
        investors: extractedData.investors_data,
        lineItems: extractedData.line_items,
        overwriteId: idToUpdate,
      })

      toast({
        title: 'Sucesso',
        description: 'DRE salvo com sucesso.',
        className: 'bg-emerald-50 text-emerald-900',
      })
      setCompany('')
      setMonth('')
      setYear('')
      removeFile()
      setShowOverwriteModal(false)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Ocorreu um erro inesperado.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const headers =
    rawSpreadsheetData && rawSpreadsheetData.length > 0 ? Object.keys(rawSpreadsheetData[0]) : []
  const previewData = rawSpreadsheetData ? rawSpreadsheetData.slice(0, 3) : []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <UploadCloud className="w-8 h-8 text-slate-700" /> Processamento de DRE
          </h1>
          <p className="text-slate-500 mt-1">
            Faça o upload do documento para extração automática e validação.
          </p>
        </div>
        <Button
          onClick={handleSaveAttempt}
          disabled={!extractedData || isExtracting || isSaving || isMapping}
          size="lg"
          className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[150px]"
        >
          {isSaving ? 'Salvando...' : 'Salvar DRE'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Configuração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Empresa <span className="text-red-500">*</span>
                </Label>
                <Select value={company} onValueChange={setCompany}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {dbCompanies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Mês <span className="text-red-500">*</span>
                  </Label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Ano <span className="text-red-500">*</span>
                  </Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Upload do Documento</CardTitle>
            </CardHeader>
            <CardContent>
              {!file ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragActive(true)
                  }}
                  onDragLeave={() => setIsDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragActive(false)
                    if (e.dataTransfer.files?.length) validateAndSetFile(e.dataTransfer.files[0])
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-slate-500 bg-slate-50 scale-[1.02]' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.csv"
                    onChange={(e) => e.target.files && validateAndSetFile(e.target.files[0])}
                  />
                  <div className="flex justify-center gap-4 mb-4 text-slate-400">
                    <FileText className="w-8 h-8" />
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Clique ou arraste o arquivo aqui
                  </p>
                  <p className="text-xs text-slate-500 mt-2">Suporta PDF, CSV</p>
                </div>
              ) : (
                <div className="border rounded-xl p-4 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {file.name.endsWith('.pdf') ? (
                      <FileText className="w-8 h-8 text-red-500 shrink-0" />
                    ) : (
                      <FileSpreadsheet className="w-8 h-8 text-emerald-600 shrink-0" />
                    )}
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                    className="text-slate-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-slate-200 overflow-hidden h-full flex flex-col">
            <CardHeader className="bg-slate-50 border-b pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {isMapping ? (
                    <Settings2 className="w-5 h-5 text-slate-600" />
                  ) : (
                    <Calculator className="w-5 h-5 text-slate-600" />
                  )}
                  {isMapping ? 'Mapear Campos' : 'Dados Extraídos'}
                </CardTitle>
                <CardDescription>
                  {isMapping
                    ? 'Vincule as colunas da planilha aos campos do sistema'
                    : 'Valores extraídos. Ajuste se necessário.'}
                </CardDescription>
              </div>
              {extractedData && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Verificado
                </span>
              )}
            </CardHeader>
            <CardContent className="p-0 flex-1 bg-white">
              {!file ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <UploadCloud className="w-12 h-12 mb-4 opacity-20" />
                  <p>Aguardando upload do arquivo...</p>
                </div>
              ) : isExtracting ? (
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 text-slate-600 mb-6">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900"></div>
                    <span className="font-medium animate-pulse">Analisando documento...</span>
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : isMapping ? (
                <div className="p-6 space-y-6 animate-fade-in-up">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    {[
                      { label: 'Receitas Totais', field: 'total_receitas', req: true },
                      { label: 'Despesas Totais', field: 'total_despesas', req: true },
                      { label: 'Resultado Líquido', field: 'resultado', req: true },
                      { label: 'Código do Item', field: 'codigo' },
                      { label: 'Descrição / Conta', field: 'descricao' },
                      { label: 'Valor do Item', field: 'valor' },
                      { label: 'Categoria', field: 'categoria' },
                    ].map((m) => (
                      <div key={m.field} className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-slate-500">
                          {m.label} {m.req && <span className="text-red-500">*</span>}
                        </Label>
                        <Select
                          value={mapping[m.field as keyof typeof mapping]}
                          onValueChange={(val) => setMapping((p) => ({ ...p, [m.field]: val }))}
                        >
                          <SelectTrigger className="bg-white h-9">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {headers.map((h) => (
                              <SelectItem key={h} value={h}>
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                    <div className="sm:col-span-2 lg:col-span-3 pt-2">
                      <Button onClick={handleApplyMapping} className="w-full sm:w-auto">
                        Confirmar Mapeamento
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase">
                      Pré-visualização (Primeiras Linhas)
                    </h4>
                    <div className="border rounded-md overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            {headers.map((h) => (
                              <TableHead key={h} className="whitespace-nowrap">
                                {h}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewData.map((row, i) => (
                            <TableRow key={i}>
                              {headers.map((h) => (
                                <TableCell key={h} className="whitespace-nowrap text-slate-600">
                                  {row[h]}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              ) : extractedData ? (
                <div className="p-6 space-y-8 animate-fade-in-up">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-1.5">
                      <Label>Receitas Totais</Label>
                      <Input
                        type="number"
                        value={extractedData.total_revenue}
                        onChange={(e) =>
                          setExtractedData((p) => ({ ...p, total_revenue: Number(e.target.value) }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Despesas Totais</Label>
                      <Input
                        type="number"
                        value={extractedData.total_expenses}
                        onChange={(e) =>
                          setExtractedData((p) => ({
                            ...p,
                            total_expenses: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Resultado Líquido</Label>
                      <Input
                        type="number"
                        className={cn(
                          (extractedData.net_result ?? 0) >= 0
                            ? 'text-emerald-600'
                            : 'text-red-600',
                        )}
                        value={extractedData.net_result}
                        onChange={(e) =>
                          setExtractedData((p) => ({ ...p, net_result: Number(e.target.value) }))
                        }
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-6 mt-2 pt-4 border-t border-dashed">
                      <div className="space-y-1.5">
                        <Label>Taxa de Adm (%)</Label>
                        <Input
                          type="number"
                          value={extractedData.admin_fee_pct}
                          onChange={(e) =>
                            setExtractedData((p) => ({
                              ...p,
                              admin_fee_pct: Number(e.target.value),
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Fundo Reserva (%)</Label>
                        <Input
                          type="number"
                          value={extractedData.reserve_fee_pct}
                          onChange={(e) =>
                            setExtractedData((p) => ({
                              ...p,
                              reserve_fee_pct: Number(e.target.value),
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="col-span-1 sm:col-span-2 p-4 rounded-lg bg-slate-900 text-white mt-2 flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-slate-300 text-sm font-medium">Total a Repassar</p>
                      </div>
                      <div className="text-2xl font-bold">{formatCurrency(totalTransfer)}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase">
                      Divisão de Investidores
                    </h3>
                    <div className="border rounded-md divide-y overflow-hidden">
                      {extractedData.investors_data.map((inv: any, idx: number) => (
                        <div key={idx} className="flex justify-between p-3 bg-slate-50/50">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{inv.name}</span>
                            <span className="text-xs text-slate-500">{inv.pct}%</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(inv.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Observações / Recebíveis Futuros</Label>
                    <Textarea
                      value={futureReceivables}
                      onChange={(e) => setFutureReceivables(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showOverwriteModal} onOpenChange={setShowOverwriteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-5 h-5" /> Registro Duplicado
            </DialogTitle>
            <DialogDescription>
              Já existe um DRE para esta empresa no período selecionado. Deseja sobrescrever?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowOverwriteModal(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => duplicateRecord && performSave(duplicateRecord.id)}
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : 'Sobrescrever'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
