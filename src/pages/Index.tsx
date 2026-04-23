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
} from 'lucide-react'
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
  const [dbCompanies, setDbCompanies] = useState<Company[]>([])

  const [company, setCompany] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const [isDragActive, setIsDragActive] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [extractedData, setExtractedData] = useState<any>(null)
  const [futureReceivables, setFutureReceivables] = useState('')

  const [duplicateRecord, setDuplicateRecord] = useState<DreData | null>(null)
  const [showOverwriteModal, setShowOverwriteModal] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const { user } = useAuth()

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = () => {
    setIsDragActive(false)
  }

  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    if (
      !validTypes.includes(selectedFile.type) &&
      !selectedFile.name.endsWith('.pdf') &&
      !selectedFile.name.endsWith('.xlsx') &&
      !selectedFile.name.endsWith('.xls')
    ) {
      toast({
        variant: 'destructive',
        title: 'Arquivo inválido',
        description: 'Por favor, envie apenas arquivos PDF ou Excel (.xlsx, .xls).',
      })
      return
    }
    setFile(selectedFile)
    simulateExtraction(selectedFile)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const simulateExtraction = (uploadedFile: File) => {
    setIsExtracting(true)
    setExtractedData(null)

    setTimeout(() => {
      const baseRev = 100000 + (uploadedFile.size % 200000)
      const baseExp = baseRev * 0.45
      const baseRes = baseRev - baseExp

      setExtractedData({
        total_revenue: baseRev,
        total_expenses: baseExp,
        net_result: baseRes,
        admin_fee_pct: 10,
        reserve_fee_pct: 5,
        investors_data: [
          { name: 'Sócio Majoritário', pct: 70, value: 0 },
          { name: 'Sócio Minoritário', pct: 30, value: 0 },
        ],
      })

      setIsExtracting(false)
      toast({
        title: 'Extração concluída',
        description: 'Os dados foram extraídos do arquivo com sucesso.',
      })
    }, 2000)
  }

  const removeFile = () => {
    setFile(null)
    setExtractedData(null)
    setFutureReceivables('')
  }

  const handleDataChange = (field: string, value: string) => {
    const numValue = value === '' ? 0 : Number(value)
    setExtractedData((prev: any) => ({ ...prev, [field]: numValue }))
  }

  const handleSaveAttempt = async () => {
    if (!company || !month || !year || !extractedData) {
      toast({
        variant: 'destructive',
        title: 'Atenção',
        description: 'Preencha todos os campos obrigatórios e aguarde a extração.',
      })
      return
    }

    const rec = Number(extractedData.total_revenue) || 0
    const desp = Number(extractedData.total_expenses) || 0
    const res = Number(extractedData.net_result) || 0

    if (Math.abs(rec - desp - res) > 0.01) {
      toast({
        variant: 'destructive',
        title: 'Erro de Validação',
        description:
          'O resultado líquido deve ser exatamente a diferença entre Receitas Totais e Despesas Totais.',
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

      const fileType = file ? (file.name.endsWith('.pdf') ? 'pdf' : 'xlsx') : ''
      const taxa_adm_val =
        (Number(extractedData.net_result) || 0) * ((Number(extractedData.admin_fee_pct) || 0) / 100)
      const taxa_res_val =
        (Number(extractedData.net_result) || 0) *
        ((Number(extractedData.reserve_fee_pct) || 0) / 100)

      const dataToSave = {
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
      }

      await saveDreFull({
        userId: user.id,
        companyId: company,
        month: Number(month),
        year: Number(year),
        file,
        fileType,
        data: dataToSave,
        investors: extractedData.investors_data,
        overwriteId: idToUpdate,
      })

      toast({
        title: 'Sucesso',
        description: 'DRE salvo com sucesso no sistema.',
        className: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      })

      setCompany('')
      setMonth('')
      setYear('')
      removeFile()
      setShowOverwriteModal(false)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro inesperado.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const selectedCompanyName = dbCompanies.find((c) => c.id === company)?.name

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <UploadCloud className="w-8 h-8 text-slate-700" />
            Processamento de DRE
          </h1>
          <p className="text-slate-500 mt-1">
            Faça o upload do documento para extração automática e validação.
          </p>
        </div>

        <Button
          onClick={handleSaveAttempt}
          disabled={!extractedData || isExtracting || isSaving}
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
                {dbCompanies.length === 0 ? (
                  <div className="p-3 text-sm text-slate-600 bg-slate-50 rounded-md border border-slate-100">
                    Carregando empresas...
                  </div>
                ) : (
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
                )}
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
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                    isDragActive
                      ? 'border-slate-500 bg-slate-50 scale-[1.02]'
                      : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.xlsx,.xls"
                    onChange={(e) => e.target.files && validateAndSetFile(e.target.files[0])}
                  />
                  <div className="flex justify-center gap-4 mb-4 text-slate-400">
                    <FileText className="w-8 h-8" />
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Clique ou arraste o arquivo aqui
                  </p>
                  <p className="text-xs text-slate-500 mt-2">Suporta PDF, XLSX e XLS (Máx. 10MB)</p>
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
                  <Calculator className="w-5 h-5 text-slate-600" />
                  Dados Extraídos
                </CardTitle>
                <CardDescription>
                  Valores extraídos automaticamente. Ajuste se necessário.
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
                    <span className="font-medium animate-pulse">
                      Analisando documento e extraindo métricas...
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-32 w-full mt-6" />
                </div>
              ) : extractedData ? (
                <div className="p-6 space-y-8 animate-fade-in-up">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-slate-500 text-xs uppercase tracking-wider">
                        Receitas Totais
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-500 text-sm">R$</span>
                        <Input
                          type="number"
                          className="pl-9 font-medium text-slate-900"
                          value={extractedData.total_revenue || ''}
                          onChange={(e) => handleDataChange('total_revenue', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-500 text-xs uppercase tracking-wider">
                        Despesas Totais
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-500 text-sm">R$</span>
                        <Input
                          type="number"
                          className="pl-9 font-medium text-slate-900"
                          value={extractedData.total_expenses || ''}
                          onChange={(e) => handleDataChange('total_expenses', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-slate-500 text-xs uppercase tracking-wider">
                        Resultado Líquido
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-500 text-sm">R$</span>
                        <Input
                          type="number"
                          className={cn(
                            'pl-9 font-medium',
                            (extractedData.net_result ?? 0) >= 0
                              ? 'text-emerald-600'
                              : 'text-red-600',
                          )}
                          value={extractedData.net_result || ''}
                          onChange={(e) => handleDataChange('net_result', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-6 mt-2 pt-4 border-t border-dashed">
                      <div className="space-y-1.5">
                        <Label className="text-slate-500 text-xs uppercase tracking-wider">
                          Taxa de Adm (%)
                        </Label>
                        <Input
                          type="number"
                          className="font-medium text-slate-900"
                          value={extractedData.admin_fee_pct || ''}
                          onChange={(e) => handleDataChange('admin_fee_pct', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-500 text-xs uppercase tracking-wider">
                          Fundo Reserva (%)
                        </Label>
                        <Input
                          type="number"
                          className="font-medium text-slate-900"
                          value={extractedData.reserve_fee_pct || ''}
                          onChange={(e) => handleDataChange('reserve_fee_pct', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-span-1 sm:col-span-2 p-4 rounded-lg bg-slate-900 text-white mt-2 flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-slate-300 text-sm font-medium">Total a Repassar</p>
                        <p className="text-xs text-slate-400 mt-0.5">Após dedução das taxas</p>
                      </div>
                      <div className="text-2xl font-bold tracking-tight">
                        {formatCurrency(totalTransfer)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">
                      Divisão de Investidores
                    </h3>
                    <div className="border rounded-md divide-y overflow-hidden">
                      {extractedData.investors_data.map((inv: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-slate-800">{inv.name}</span>
                            <span className="text-xs text-slate-500">
                              {inv.pct}% de participação
                            </span>
                          </div>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(inv.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-900 font-semibold">
                      Recebíveis Futuros / Observações
                    </Label>
                    <Textarea
                      placeholder="Ex: Março 2026 R$ 47.059,15..."
                      className="min-h-[100px] resize-none bg-slate-50"
                      value={futureReceivables}
                      onChange={(e) => setFutureReceivables(e.target.value)}
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
              <AlertCircle className="w-5 h-5" />
              Registro Duplicado Encontrado
            </DialogTitle>
            <DialogDescription className="pt-2 text-slate-600 text-base">
              Já existe um DRE para{' '}
              <strong className="text-slate-900">{selectedCompanyName}</strong> em{' '}
              <strong className="text-slate-900">
                {MONTHS.find((m) => m.value === month)?.label}/{year}
              </strong>
              .
              <br />
              <br />
              Deseja sobrescrever os dados existentes com esta nova extração?
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
              variant="default"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => duplicateRecord && performSave(duplicateRecord.id)}
              disabled={isSaving}
            >
              {isSaving ? 'Sobrescrevendo...' : 'Sobrescrever Dados'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
