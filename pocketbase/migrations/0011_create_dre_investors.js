migrate(
  (app) => {
    const dreDataCol = app.findCollectionByNameOrId('dre_data')
    const investors = new Collection({
      name: 'dre_investors',
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
        { name: 'investor_name', type: 'text' },
        { name: 'participation_percentage', type: 'number' },
        { name: 'amount', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(investors)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('dre_investors')
    app.delete(col)
  },
)
