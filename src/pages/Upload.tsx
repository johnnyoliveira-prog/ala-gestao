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
import { ToastAction } from '@/components/ui/toast'
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

export default function Upload() {
  const { user } = useAuth()
  const [dbCompanies, setDbCompanies] = useState<Company[]>([])
  const [company, setCompany] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [rawSpreadsheetData, setRawSpreadsheetData] = useState<any[][] | null>(null)
  const [isMapping, setIsMapping] = useState(false)
  const [headerRowIndex, setHeaderRowIndex] = useState(0)
  const [mapping, setMapping] = useState({
    codigo: '',
    descricao: '',
    receita: '',
    despesa: '',
  })

  const [extractedData, setExtractedData] = useState<any>(null)
  const [futureReceivables, setFutureReceivables] = useState('')
  const [duplicateRecord, setDuplicateRecord] = useState<DreData | null>(null)
  const [showOverwriteModal, setShowOverwriteModal] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getCompanies().then(setDbCompanies).catch(console.error)
  }, [])

  const netResult = useMemo(() => {
    if (!extractedData) return 0
    return (Number(extractedData.total_revenue) || 0) - (Number(extractedData.total_expenses) || 0)
  }, [extractedData?.total_revenue, extractedData?.total_expenses])

  const totalTransfer = useMemo(() => {
    if (!extractedData) return 0
    const totalFeePct =
      (Number(extractedData.admin_fee_pct) || 0) + (Number(extractedData.reserve_fee_pct) || 0)
    return netResult - netResult * (totalFeePct / 100)
  }, [netResult, extractedData?.admin_fee_pct, extractedData?.reserve_fee_pct])

  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = [
      'application/pdf',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]
    if (
      !validTypes.includes(selectedFile.type) &&
      !/\.(pdf|csv|xlsx|xls)$/i.test(selectedFile.name)
    ) {
      toast({
        variant: 'destructive',
        title: 'Arquivo inválido',
        description: 'Formato não suportado. Por favor, envie apenas arquivos PDF, CSV ou XLSX.',
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
        const isExcel = /\.(xlsx|xls)$/i.test(uploadedFile.name)

        await new Promise<void>((resolve, reject) => {
          if ((window as any).XLSX) {
            resolve()
            return
          }
          const script = document.createElement('script')
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
          script.onload = () => resolve()
          script.onerror = () =>
            reject(new Error('Falha ao carregar biblioteca de leitura de planilhas.'))
          document.head.appendChild(script)
        })

        const XLSX = (window as any).XLSX
        let rawData: any[][] = []

        if (isExcel) {
          const arrayBuffer = await uploadedFile.arrayBuffer()
          const workbook = XLSX.read(arrayBuffer, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          if (sheetName) {
            rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
              header: 1,
              defval: '',
            })
          }
        } else {
          const text = await uploadedFile.text()
          const workbook = XLSX.read(text, { type: 'string' })
          const sheetName = workbook.SheetNames[0]
          if (sheetName) {
            rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
              header: 1,
              defval: '',
            })
          }
        }

        if (rawData && rawData.length > 0) {
          setRawSpreadsheetData(rawData)

          let headerIdx = 0
          for (let i = 0; i < Math.min(10, rawData.length); i++) {
            const rowString = rawData[i].map(String).join(' ').toLowerCase()
            if (
              (rowString.includes('receita') && rowString.includes('despesa')) ||
              rowString.includes('descrição')
            ) {
              headerIdx = i
              break
            }
          }
          setHeaderRowIndex(headerIdx)

          const headers = rawData[headerIdx] || []
          const newMapping = { codigo: '', descricao: '', receita: '', despesa: '' }
          headers.forEach((h: any, idx: number) => {
            const hStr = String(h).toLowerCase()
            if (hStr.includes('código') || hStr.includes('agrupamento'))
              newMapping.codigo = String(idx)
            if (
              hStr.includes('descrição') ||
              (hStr.includes('centro de custo') && !newMapping.descricao)
            )
              newMapping.descricao = String(idx)
            if (hStr.includes('receita') && !hStr.includes('despesa'))
              newMapping.receita = String(idx)
            if (hStr.includes('despesa') || hStr.includes('custo')) newMapping.despesa = String(idx)
          })

          setMapping(newMapping)
          setIsMapping(true)
          toast({
            title: 'Planilha Lida',
            description: 'Por favor, confirme as colunas e a linha de cabeçalho.',
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
    if (!mapping.descricao || !mapping.receita || !mapping.despesa) {
      toast({
        variant: 'destructive',
        title: 'Erro de Mapeamento',
        description: 'Os campos Descrição, Receita e Despesa são obrigatórios.',
      })
      return
    }
    if (!rawSpreadsheetData || rawSpreadsheetData.length === 0) return

    const dataRows = rawSpreadsheetData.slice(headerRowIndex + 1)
    let totalRev = 0
    let totalExp = 0
    let foundTotal = false
    const line_items: any[] = []

    dataRows.forEach((row) => {
      const desc = String(row[Number(mapping.descricao)] || '').trim()
      if (!desc) return

      const code = mapping.codigo ? String(row[Number(mapping.codigo)] || '').trim() : ''
      const revRaw = row[Number(mapping.receita)]
      const expRaw = row[Number(mapping.despesa)]

      const parseNum = (val: any) => {
        if (typeof val === 'number') return val
        if (!val) return 0
        const str = String(val).replace(/\./g, '').replace(',', '.')
        return Number(str) || 0
      }

      const rev = parseNum(revRaw)
      const exp = parseNum(expRaw)

      if (desc.toUpperCase() === 'TOTAL') {
        totalRev = rev
        totalExp = exp
        foundTotal = true
        return
      }

      if (rev > 0 || exp > 0 || rev < 0 || exp < 0) {
        if (rev !== 0)
          line_items.push({
            tipo: 'receita',
            codigo: code,
            descricao: desc,
            valor: rev,
            categoria: 'Operacional',
          })
        if (exp !== 0)
          line_items.push({
            tipo: 'despesa',
            codigo: code,
            descricao: desc,
            valor: exp,
            categoria: 'Operacional',
          })
      }
    })

    if (line_items.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Nenhum dado válido',
        description:
          'Não foi possível encontrar valores numéricos nas colunas selecionadas. Verifique o mapeamento.',
      })
      return
    }

    if (!foundTotal) {
      const rootItems = line_items.filter((item) => !item.codigo || !item.codigo.includes('.'))
      if (rootItems.length > 0) {
        totalRev = rootItems
          .filter((i) => i.tipo === 'receita')
          .reduce((sum, i) => sum + i.valor, 0)
        totalExp = rootItems
          .filter((i) => i.tipo === 'despesa')
          .reduce((sum, i) => sum + i.valor, 0)
      } else {
        totalRev = line_items
          .filter((i) => i.tipo === 'receita')
          .reduce((sum, i) => sum + i.valor, 0)
        totalExp = line_items
          .filter((i) => i.tipo === 'despesa')
          .reduce((sum, i) => sum + i.valor, 0)
      }
    }

    setExtractedData({
      total_revenue: totalRev,
      total_expenses: totalExp,
      net_result: totalRev - totalExp,
      admin_fee_pct: 10,
      reserve_fee_pct: 5,
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
      const fileType = file
        ? file.name.endsWith('.pdf')
          ? 'pdf'
          : file.name.match(/\.(xlsx|xls)$/i)
            ? 'xlsx'
            : 'csv'
        : ''
      const taxa_adm_val = netResult * ((Number(extractedData.admin_fee_pct) || 0) / 100)
      const taxa_res_val = netResult * ((Number(extractedData.reserve_fee_pct) || 0) / 100)

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
          resultado: netResult,
          saldo_anterior: 0,
          resultado_acumulado: netResult,
          taxa_administracao_percentual: Number(extractedData.admin_fee_pct) || 0,
          taxa_administracao_valor: taxa_adm_val,
          taxa_reserva_percentual: Number(extractedData.reserve_fee_pct) || 0,
          taxa_reserva_valor: taxa_res_val,
          outras_deducoes: 0,
          total_repassar: totalTransfer,
          recebiveis_futuros: futureReceivables,
        },
        lineItems: extractedData.line_items,
        overwriteId: idToUpdate,
      })

      toast({
        title: 'Sucesso',
        description: 'DRE processada e validada com sucesso!',
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
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os dados. Verifique sua conexão e tente novamente.',
        action: (
          <ToastAction altText="Tentar Novamente" onClick={() => performSave(idToUpdate)}>
            Tentar Novamente
          </ToastAction>
        ),
      })
    } finally {
      setIsSaving(false)
    }
  }

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
                    accept=".pdf,.csv,.xlsx,.xls"
                    onChange={(e) => e.target.files && validateAndSetFile(e.target.files[0])}
                  />
                  <div className="flex justify-center gap-4 mb-4 text-slate-400">
                    <FileText className="w-8 h-8" />
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Clique ou arraste o arquivo aqui
                  </p>
                  <p className="text-xs text-slate-500 mt-2">Suporta PDF, CSV, XLSX</p>
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
                  {isMapping ? 'Mapear Colunas' : 'Conferência de Valores'}
                </CardTitle>
                <CardDescription>
                  {isMapping
                    ? 'Vincule as colunas da planilha aos campos do sistema'
                    : 'Confirme os valores abaixo e ajuste se necessário.'}
                </CardDescription>
              </div>
              {extractedData && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Extraído
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
                  <div className="space-y-4 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <Label className="font-semibold text-slate-700 whitespace-nowrap">
                        Linha de Cabeçalho:
                      </Label>
                      <Select
                        value={String(headerRowIndex)}
                        onValueChange={(v) => setHeaderRowIndex(Number(v))}
                      >
                        <SelectTrigger className="w-full sm:w-[350px] bg-white border-slate-200">
                          <SelectValue placeholder="Selecione a linha" />
                        </SelectTrigger>
                        <SelectContent>
                          {rawSpreadsheetData?.slice(0, 15).map((row, i) => (
                            <SelectItem key={i} value={String(i)}>
                              Linha {i + 1} ({String(row[0] || row[1] || '').substring(0, 20)}...)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                      {[
                        { label: 'Código da Conta', field: 'codigo', req: false },
                        { label: 'Descrição / Conta', field: 'descricao', req: true },
                        { label: 'Valor Receita', field: 'receita', req: true },
                        { label: 'Valor Despesa', field: 'despesa', req: true },
                      ].map((m) => (
                        <div key={m.field} className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wider text-slate-500 font-medium">
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
                              {(rawSpreadsheetData?.[headerRowIndex] || []).map(
                                (h: any, i: number) => (
                                  <SelectItem key={i} value={String(i)}>
                                    Coluna {i + 1} {h ? `(${h})` : ''}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-slate-200">
                      <Button
                        onClick={handleApplyMapping}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Confirmar Mapeamento e Extrair
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
                      Pré-visualização da Planilha
                    </h4>
                    <div className="border rounded-md overflow-x-auto shadow-sm">
                      <Table>
                        <TableHeader className="bg-slate-100">
                          <TableRow>
                            {(rawSpreadsheetData?.[headerRowIndex] || []).map(
                              (h: any, i: number) => (
                                <TableHead key={i} className="whitespace-nowrap font-semibold">
                                  {h || `Coluna ${i + 1}`}
                                </TableHead>
                              ),
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(
                            rawSpreadsheetData?.slice(headerRowIndex + 1, headerRowIndex + 4) || []
                          ).map((row, i) => (
                            <TableRow key={i}>
                              {(rawSpreadsheetData?.[headerRowIndex] || []).map((_, colIdx) => (
                                <TableCell
                                  key={colIdx}
                                  className="whitespace-nowrap text-slate-600 text-sm"
                                >
                                  {String(row[colIdx] || '')}
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
                          setExtractedData((p: any) => ({
                            ...p,
                            total_revenue: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Despesas Totais</Label>
                      <Input
                        type="number"
                        value={extractedData.total_expenses}
                        onChange={(e) =>
                          setExtractedData((p: any) => ({
                            ...p,
                            total_expenses: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Resultado Líquido (Calculado)</Label>
                      <Input
                        type="text"
                        readOnly
                        className={cn(
                          'bg-slate-50',
                          netResult >= 0
                            ? 'text-emerald-600 font-medium'
                            : 'text-red-600 font-medium',
                        )}
                        value={formatCurrency(netResult)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Observações / Recebíveis Futuros</Label>
                    <Textarea
                      value={futureReceivables}
                      onChange={(e) => setFutureReceivables(e.target.value)}
                      className="min-h-[100px] resize-none"
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
