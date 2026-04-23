migrate(
  (app) => {
    const dreData = new Collection({
      name: 'dre_data',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: "@request.auth.id != '' && @request.body.user = @request.auth.id",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'upload',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('dre_uploads').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'company',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('companies').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'month', type: 'number', required: true, min: 1, max: 12 },
        { name: 'year', type: 'number', required: true, min: 1900 },
        { name: 'total_receitas', type: 'number' },
        { name: 'total_despesas', type: 'number' },
        { name: 'resultado', type: 'number' },
        { name: 'saldo_anterior', type: 'number' },
        { name: 'resultado_acumulado', type: 'number' },
        { name: 'taxa_administracao_percentual', type: 'number' },
        { name: 'taxa_administracao_valor', type: 'number' },
        { name: 'taxa_reserva_percentual', type: 'number' },
        { name: 'taxa_reserva_valor', type: 'number' },
        { name: 'outras_deducoes', type: 'number' },
        { name: 'total_repassar', type: 'number' },
        { name: 'recebiveis_futuros', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_dre_data_unique ON dre_data (company, month, year, user)'],
    })
    app.save(dreData)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('dre_data')
    app.delete(col)
  },
)
