import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { DreData, updateFutureReceivables } from '@/services/dres'
import { FileText, Pencil, Loader2, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface FutureReceivablesProps {
  dreData: DreData
  onUpdated: () => void
}

export function FutureReceivables({ dreData, onUpdated }: FutureReceivablesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpen = () => {
    setText(dreData.recebiveis_futuros || '')
    setError(null)
    setIsOpen(true)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      await updateFutureReceivables(dreData.id, text)
      toast({ description: 'Recebíveis atualizados com sucesso' })
      setIsOpen(false)
      onUpdated()
    } catch (err: any) {
      setError('Ocorreu um erro ao atualizar os recebíveis')
      toast({
        variant: 'destructive',
        description: 'Ocorreu um erro ao atualizar os recebíveis',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            Recebíveis Futuros / Observações
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpen}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
          >
            <Pencil className="w-4 h-4 mr-2" /> Editar
          </Button>
        </CardHeader>
        <CardContent>
          {dreData.recebiveis_futuros ? (
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {dreData.recebiveis_futuros}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic">Nenhum recebível futuro registrado</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={(open) => !isSaving && setIsOpen(open)}>
        <DialogContent className="sm:max-w-[550px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Recebíveis Futuros</DialogTitle>
            <DialogDescription>
              Digite ou cole os recebíveis futuros no formato: Mês Ano R$ valor / Mês Ano R$ valor
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Textarea
              className="min-h-[150px] resize-y"
              placeholder="Exemplo: Março 2026 R$ 47.059,15 / Abril 2026 R$ 3.192,91 / Maio 2026 R$ 888,62"
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                if (error) setError(null)
              }}
              disabled={isSaving}
            />
            {error && (
              <Alert variant="destructive" className="py-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            {error ? (
              <Button onClick={handleSave} disabled={isSaving} className="bg-slate-900 text-white">
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSaving ? 'Salvando...' : 'Tentar Novamente'}
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
