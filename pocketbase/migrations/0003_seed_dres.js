migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('dres')

    const sampleData = [
      {
        company_name: 'CR Hotel Boutique',
        month: '01',
        year: '2024',
        total_revenue: 150000.5,
        total_expenses: 80000.0,
        net_result: 70000.5,
        admin_fee_pct: 10,
        reserve_fee_pct: 5,
        total_transfer: 59500.42,
        investors_data: [
          { name: 'João Silva', pct: 60, value: 35700.25 },
          { name: 'Maria Souza', pct: 40, value: 23800.17 },
        ],
        future_receivables: 'Fevereiro 2024: R$ 45.000,00',
      },
      {
        company_name: 'Madri',
        month: '02',
        year: '2024',
        total_revenue: 210000.0,
        total_expenses: 95000.0,
        net_result: 115000.0,
        admin_fee_pct: 8,
        reserve_fee_pct: 2,
        total_transfer: 103500.0,
        investors_data: [{ name: 'Fundo Alpha', pct: 100, value: 103500.0 }],
        future_receivables: '',
      },
    ]

    for (const data of sampleData) {
      try {
        app.findFirstRecordByData('dres', 'company_name', data.company_name)
        // Simplify check: just don't insert if any exist for this company to avoid exact matching logic complexity in seed
      } catch (_) {
        const record = new Record(col)
        record.set('company_name', data.company_name)
        record.set('month', data.month)
        record.set('year', data.year)
        record.set('total_revenue', data.total_revenue)
        record.set('total_expenses', data.total_expenses)
        record.set('net_result', data.net_result)
        record.set('admin_fee_pct', data.admin_fee_pct)
        record.set('reserve_fee_pct', data.reserve_fee_pct)
        record.set('total_transfer', data.total_transfer)
        record.set('investors_data', data.investors_data)
        record.set('future_receivables', data.future_receivables)
        app.save(record)
      }
    }
  },
  (app) => {
    // Pass down
  },
)
