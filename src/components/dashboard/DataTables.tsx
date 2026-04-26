import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { DreLineItem, DreData } from '@/services/dres'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function DataTables({
  lineItems,
  currentDre,
}: {
  lineItems: DreLineItem[]
  currentDre: DreData
}) {
  const totalSum = currentDre.resultado || 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-800">
          Detalhamento do DRE (Hierarquia X.XX)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="w-[120px]">Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.map((item) => (
              <TableRow key={item.id} className="hover:bg-slate-50/50">
                <TableCell className="font-medium text-slate-600">{item.codigo}</TableCell>
                <TableCell>{item.descricao}</TableCell>
                <TableCell
                  className={`text-right font-medium ${item.valor >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                >
                  {formatCurrency(item.valor)}
                </TableCell>
              </TableRow>
            ))}
            {lineItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                  Nenhum item com formato X.XX encontrado para este período.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-slate-100 hover:bg-slate-100">
              <TableCell colSpan={2} className="font-bold text-slate-900 text-right">
                Resultado Líquido do Período
              </TableCell>
              <TableCell
                className={`text-right font-bold ${totalSum >= 0 ? 'text-emerald-700' : 'text-red-700'}`}
              >
                {formatCurrency(totalSum)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  )
}
