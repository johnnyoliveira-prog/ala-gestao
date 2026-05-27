import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Company, DreData } from '@/services/dres'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, AlertTriangle } from 'lucide-react'

interface GlobalCompanyTableProps {
  currentData: DreData[]
  companies: Company[]
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function GlobalCompanyTable({ currentData, companies }: GlobalCompanyTableProps) {
  const navigate = useNavigate()

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700">Empresa</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Receita</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Despesa</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Resultado</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Margem</TableHead>
                <TableHead className="text-center font-semibold text-slate-700">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((c) => {
                const d = currentData.find((x) => x.company === c.id)
                const margin =
                  d && d.total_receitas > 0 ? (d.resultado / d.total_receitas) * 100 : 0
                return (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => navigate(`/dashboard/${c.slug}`)}
                  >
                    <TableCell className="font-medium text-slate-900">{c.name}</TableCell>
                    <TableCell className="text-right text-slate-600">
                      {formatCurrency(d?.total_receitas || 0)}
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {formatCurrency(d?.total_despesas || 0)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        d && d.resultado >= 0
                          ? 'text-emerald-600'
                          : d && d.resultado < 0
                            ? 'text-red-600'
                            : 'text-slate-600'
                      }`}
                    >
                      {formatCurrency(d?.resultado || 0)}
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {margin.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-center">
                      {d ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Atualizado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-amber-500" /> Sem dados
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
