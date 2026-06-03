migrate(
  (app) => {
    const uploads = app.findCollectionByNameOrId('dre_uploads')
    uploads.deleteRule = "@request.auth.id != ''"
    app.save(uploads)

    const data = app.findCollectionByNameOrId('dre_data')
    data.deleteRule = "@request.auth.id != ''"
    app.save(data)

    const lineItems = app.findCollectionByNameOrId('dre_line_items')
    lineItems.deleteRule = "@request.auth.id != ''"
    app.save(lineItems)
  },
  (app) => {
    const uploads = app.findCollectionByNameOrId('dre_uploads')
    uploads.deleteRule = "@request.auth.id != '' && user = @request.auth.id"
    app.save(uploads)

    const data = app.findCollectionByNameOrId('dre_data')
    data.deleteRule = "@request.auth.id != '' && user = @request.auth.id"
    app.save(data)

    const lineItems = app.findCollectionByNameOrId('dre_line_items')
    lineItems.deleteRule = "@request.auth.id != '' && dre_data.user = @request.auth.id"
    app.save(lineItems)
  },
)
