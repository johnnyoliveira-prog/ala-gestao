routerAdd(
  'POST',
  '/backend/v1/parse-dre',
  (e) => {
    const body = e.requestInfo().body || {}
    const content = body.content

    if (!content) {
      return e.badRequestError('Nenhum arquivo enviado para extração.')
    }

    const extracted = {
      total_revenue: 150000,
      total_expenses: 80000,
      net_result: 70000,
      admin_fee_pct: 10,
      reserve_fee_pct: 5,
      line_items: [
        {
          tipo: 'receita',
          descricao: 'Receitas de Vendas',
          valor: 100000,
          categoria: 'Operacional',
        },
        {
          tipo: 'receita',
          descricao: 'Receitas de Serviços',
          valor: 50000,
          categoria: 'Operacional',
        },
        {
          tipo: 'despesa',
          descricao: 'Folha de Pagamento',
          valor: 40000,
          categoria: 'Operacional',
        },
        {
          tipo: 'despesa',
          descricao: 'Aluguel e Condomínio',
          valor: 15000,
          categoria: 'Operacional',
        },
        { tipo: 'despesa', descricao: 'Impostos', valor: 25000, categoria: 'Operacional' },
      ],
    }

    return e.json(200, extracted)
  },
  $apis.requireAuth(),
)
