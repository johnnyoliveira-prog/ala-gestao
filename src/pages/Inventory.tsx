import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  Plus,
  Search,
  Mic,
  Square,
  Loader2,
  Package,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  getCompanyIdBySlug,
  getInventoryItems,
  getInventoryMovements,
  addInventoryMovement,
  processVoiceCommand,
  type InventoryItem,
  type InventoryMovement,
} from '@/services/inventory'
import { useRealtime } from '@/hooks/use-realtime'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Inventory() {
  const { slug } = useParams()
  const { toast } = useToast()

  const [companyId, setCompanyId] = useState<string | null>(null)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [isManualOpen, setIsManualOpen] = useState(false)
  const [manualItem, setManualItem] = useState('')
  const [manualType, setManualType] = useState<'in' | 'out'>('in')
  const [manualQty, setManualQty] = useState('')
  const [loadingManual, setLoadingManual] = useState(false)

  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const recognitionRef = useRef<any>(null)

  const loadData = useCallback(async () => {
    if (!slug) return
    try {
      setLoading(true)
      let cid = companyId
      if (!cid) {
        cid = await getCompanyIdBySlug(slug)
        setCompanyId(cid)
      }
      const [fetchedItems, fetchedMovs] = await Promise.all([
        getInventoryItems(cid),
        getInventoryMovements(cid),
      ])
      setItems(fetchedItems)
      setMovements(fetchedMovs)
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [slug, companyId, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('inventory_items', loadData)
  useRealtime('inventory_movements', loadData)

  const handleManualSubmit = async () => {
    if (!manualItem || !manualQty) return
    try {
      setLoadingManual(true)
      await addInventoryMovement(
        manualItem,
        manualType,
        parseInt(manualQty, 10),
        'Lançamento manual',
      )
      toast({ title: 'Sucesso', description: 'Movimento registrado com sucesso.' })
      setIsManualOpen(false)
      setManualItem('')
      setManualQty('')
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoadingManual(false)
    }
  }

  const startRecording = () => {
    const SR = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      toast({
        title: 'Erro',
        description: 'Reconhecimento de voz não suportado neste navegador.',
        variant: 'destructive',
      })
      return
    }
    const recognition = new SR()
    recognition.lang = 'pt-BR'
    recognition.continuous = false
    recognition.interimResults = true

    let finalTranscript = ''

    recognition.onresult = (e: any) => {
      let current = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        current += e.results[i][0].transcript
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript
        }
      }
      setTranscript(current)
    }

    recognition.onend = () => {
      setIsRecording(false)
      const textToProcess = finalTranscript || transcript
      if (textToProcess) {
        processVoice(textToProcess)
      }
      setTranscript('')
    }

    recognition.start()
    setIsRecording(true)
    recognitionRef.current = recognition
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  const processVoice = async (text: string) => {
    if (!companyId) return
    try {
      setIsProcessingVoice(true)
      const res = await processVoiceCommand(text, companyId)
      toast({ title: 'Ação Processada', description: res.message })
    } catch (err: any) {
      toast({ title: 'Erro na Voz', description: err.message, variant: 'destructive' })
    } finally {
      setIsProcessingVoice(false)
    }
  }

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Package className="h-8 w-8 text-primary" />
          Estoque CR Vinícola
        </h2>
        <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Lançamento Manual
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Lançamento de Estoque</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select value={manualItem} onValueChange={setManualItem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Movimento</Label>
                <Select value={manualType} onValueChange={(v: any) => setManualType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Entrada</SelectItem>
                    <SelectItem value="out">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={manualQty}
                  onChange={(e) => setManualQty(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button disabled={loadingManual} onClick={handleManualSubmit}>
                {loadingManual ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">Produtos</TabsTrigger>
          <TabsTrigger value="movements">Histórico de Movimentos</TabsTrigger>
        </TabsList>
        <TabsContent value="items" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou SKU..."
              className="max-w-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Quantidade Atual</TableHead>
                  <TableHead>Unidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum produto encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell className="text-right font-bold text-lg">
                        {item.current_quantity}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="movements">
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Usuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma movimentação recente.
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell>{new Date(mov.created).toLocaleString()}</TableCell>
                      <TableCell className="font-medium">{mov.expand?.item?.name}</TableCell>
                      <TableCell>
                        {mov.type === 'in' ? (
                          <Badge
                            variant="outline"
                            className="text-green-600 bg-green-50 border-green-200"
                          >
                            <ArrowUpRight className="w-3 h-3 mr-1" /> Entrada
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-red-600 bg-red-50 border-red-200"
                          >
                            <ArrowDownRight className="w-3 h-3 mr-1" /> Saída
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold">{mov.quantity}</TableCell>
                      <TableCell className="text-muted-foreground">{mov.description}</TableCell>
                      <TableCell>{mov.expand?.user?.name || mov.expand?.user?.email}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2">
        {isRecording && (
          <div className="bg-slate-900 text-white px-4 py-3 rounded-lg text-sm max-w-xs shadow-lg animate-in slide-in-from-bottom-2">
            {transcript || 'Diga o comando... (ex: "Adicionar 12 garrafas de Chardonnay")'}
          </div>
        )}
        <Button
          size="icon"
          className="h-16 w-16 rounded-full shadow-2xl transition-all duration-300"
          variant={isRecording ? 'destructive' : 'default'}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessingVoice}
        >
          {isProcessingVoice ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : isRecording ? (
            <Square className="h-8 w-8 fill-current" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </Button>
      </div>
    </div>
  )
}
