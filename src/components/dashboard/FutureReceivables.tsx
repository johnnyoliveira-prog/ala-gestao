import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { DreData, updateFutureReceivables } from '@/services/dres'
import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export function FutureReceivables({
  dreData,
  onUpdated,
}: {
  dreData: DreData
  onUpdated: () => void
}) {
  const [text, setText] = useState(dreData.recebiveis_futuros || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setText(dreData.recebiveis_futuros || '')
  }, [dreData])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateFutureReceivables(dreData.id, text)
      toast({
        title: 'Sucesso',
        description: 'Observações atualizadas com sucesso.',
        className: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      })
      onUpdated()
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao salvar observações.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-800">
          Observações / Recebíveis Futuros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Adicione notas ou previsões de recebíveis futuros aqui..."
          className="min-h-[120px] bg-slate-50 focus-visible:ring-slate-300"
        />
        <Button
          onClick={handleSave}
          disabled={saving || text === (dreData.recebiveis_futuros || '')}
          className="bg-slate-900 hover:bg-slate-800"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </CardContent>
    </Card>
  )
}
