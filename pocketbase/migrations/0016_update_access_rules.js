migrate(
  (app) => {
    const collections = ['dres', 'dre_uploads', 'dre_data', 'dre_line_items', 'dre_investors']
    for (const name of collections) {
      const col = app.findCollectionByNameOrId(name)
      col.listRule = "@request.auth.id != ''"
      col.viewRule = "@request.auth.id != ''"
      app.save(col)
    }
  },
  (app) => {
    const dres = app.findCollectionByNameOrId('dres')
    dres.listRule = "@request.auth.id != '' && @request.auth.allowed_companies ?= company_name"
    dres.viewRule = "@request.auth.id != '' && @request.auth.allowed_companies ?= company_name"
    app.save(dres)

    const uploads = app.findCollectionByNameOrId('dre_uploads')
    uploads.listRule = "@request.auth.id != '' && user = @request.auth.id"
    uploads.viewRule = "@request.auth.id != '' && user = @request.auth.id"
    app.save(uploads)

    const data = app.findCollectionByNameOrId('dre_data')
    data.listRule = "@request.auth.id != '' && user = @request.auth.id"
    data.viewRule = "@request.auth.id != '' && user = @request.auth.id"
    app.save(data)

    const items = app.findCollectionByNameOrId('dre_line_items')
    items.listRule = "@request.auth.id != '' && dre_data.user = @request.auth.id"
    items.viewRule = "@request.auth.id != '' && dre_data.user = @request.auth.id"
    app.save(items)

    const investors = app.findCollectionByNameOrId('dre_investors')
    investors.listRule = "@request.auth.id != '' && dre_data.user = @request.auth.id"
    investors.viewRule = "@request.auth.id != '' && dre_data.user = @request.auth.id"
    app.save(investors)
  },
)
