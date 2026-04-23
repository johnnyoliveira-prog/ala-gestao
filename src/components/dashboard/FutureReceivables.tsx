import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { DreData, updateFutureReceivables } from '@/services/dres'
import { FileText, Pencil } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface FutureReceivablesProps {
  dreData: DreData
  onUpdated: () => void
}

export function FutureReceivables({ dreData, onUpdated }: FutureReceivablesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleOpen = () => {
    setText(dreData.recebiveis_futuros || '')
    setIsOpen(true)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await updateFutureReceivables(dreData.id, text)
      toast({ title: 'Sucesso', description: 'Recebíveis futuros atualizados.' })
      setIsOpen(false)
      onUpdated()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err.message || 'Falha ao salvar.',
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Recebíveis Futuros</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              className="min-h-[150px]"
              placeholder="Descreva os recebíveis futuros e observações gerais do período..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
