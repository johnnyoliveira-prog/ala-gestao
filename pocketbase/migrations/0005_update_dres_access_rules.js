migrate(
  (app) => {
    const dres = app.findCollectionByNameOrId('dres')
    const rule = "@request.auth.id != '' && @request.auth.allowed_companies ?= company_name"
    dres.listRule = rule
    dres.viewRule = rule
    dres.createRule = rule
    dres.updateRule = rule
    dres.deleteRule = rule
    app.save(dres)
  },
  (app) => {
    const dres = app.findCollectionByNameOrId('dres')
    const rule = "@request.auth.id != ''"
    dres.listRule = rule
    dres.viewRule = rule
    dres.createRule = rule
    dres.updateRule = rule
    dres.deleteRule = rule
    app.save(dres)
  },
)
