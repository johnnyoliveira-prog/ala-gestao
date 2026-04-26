migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('dre_line_items')

    if (!col.fields.getByName('resumo')) {
      col.fields.add(new TextField({ name: 'resumo' }))
    }
    if (!col.fields.getByName('situacao')) {
      col.fields.add(new TextField({ name: 'situacao' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('dre_line_items')
    col.fields.removeByName('resumo')
    col.fields.removeByName('situacao')
    app.save(col)
  },
)
