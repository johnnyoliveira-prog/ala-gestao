migrate(
  (app) => {
    const dres = new Collection({
      name: 'dres',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'company_name', type: 'text', required: true },
        { name: 'month', type: 'text', required: true },
        { name: 'year', type: 'text', required: true },
        { name: 'total_revenue', type: 'number' },
        { name: 'total_expenses', type: 'number' },
        { name: 'net_result', type: 'number' },
        { name: 'admin_fee_pct', type: 'number' },
        { name: 'reserve_fee_pct', type: 'number' },
        { name: 'total_transfer', type: 'number' },
        { name: 'investors_data', type: 'json' },
        { name: 'future_receivables', type: 'text' },
        {
          name: 'file_ref',
          type: 'file',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: [
            'application/pdf',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_dres_company_date ON dres (company_name, month, year)'],
    })
    app.save(dres)
  },
  (app) => {
    const dres = app.findCollectionByNameOrId('dres')
    app.delete(dres)
  },
)
