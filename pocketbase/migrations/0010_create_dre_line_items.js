migrate(
  (app) => {
    const dreDataCol = app.findCollectionByNameOrId('dre_data')
    const lineItems = new Collection({
      name: 'dre_line_items',
      type: 'base',
      listRule: "@request.auth.id != '' && dre_data.user = @request.auth.id",
      viewRule: "@request.auth.id != '' && dre_data.user = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && dre_data.user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && dre_data.user = @request.auth.id",
      fields: [
        {
          name: 'dre_data',
          type: 'relation',
          required: true,
          collectionId: dreDataCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'tipo', type: 'text' },
        { name: 'codigo', type: 'text' },
        { name: 'descricao', type: 'text' },
        { name: 'valor', type: 'number' },
        { name: 'percentual', type: 'number' },
        { name: 'categoria', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(lineItems)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('dre_line_items')
    app.delete(col)
  },
)
