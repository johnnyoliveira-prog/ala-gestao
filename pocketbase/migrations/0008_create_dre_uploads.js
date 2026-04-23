migrate(
  (app) => {
    const uploads = new Collection({
      name: 'dre_uploads',
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
          name: 'company',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('companies').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'month', type: 'number', required: true, min: 1, max: 12 },
        { name: 'year', type: 'number', required: true, min: 1900 },
        { name: 'file_ref', type: 'file', maxSelect: 1, maxSize: 10485760 },
        { name: 'file_type', type: 'text' },
        { name: 'status', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(uploads)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('dre_uploads')
    app.delete(col)
  },
)
