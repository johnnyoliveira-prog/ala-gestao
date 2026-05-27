import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Company, DreData } from '@/services/dres'
import { Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'

export function PerformanceRanking({
  currentData,
  companies,
}: {
  currentData: DreData[]
  companies: Company[]
}) {
  const ranked = currentData
    .filter((d) => d.resultado !== undefined)
    .sort((a, b) => b.resultado - a.resultado)
    .slice(0, 5)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Ranking de Performance (Top 5)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ranked.map((d, i) => {
            const comp = companies.find((c) => c.id === d.company)
            return (
              <div
                key={d.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-700 text-sm">
                    {i + 1}º
                  </div>
                  <Link
                    to={`/dashboard/${comp?.slug}`}
                    className="font-medium text-slate-800 hover:underline"
                  >
                    {comp?.name}
                  </Link>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-emerald-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      d.resultado,
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    Margem:{' '}
                    {d.total_receitas > 0 ? ((d.resultado / d.total_receitas) * 100).toFixed(1) : 0}
                    %
                  </div>
                </div>
              </div>
            )
          })}
          {ranked.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">Nenhum dado para o período.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
