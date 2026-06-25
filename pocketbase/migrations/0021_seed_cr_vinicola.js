migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('companies')

    try {
      app.findFirstRecordByData('companies', 'slug', 'cr-vinicola')
    } catch (_) {
      const record = new Record(col)
      record.set('name', 'CR Vinícola')
      record.set('slug', 'cr-vinicola')
      app.save(record)
    }
  },
  (app) => {
    try {
      const record = app.findFirstRecordByData('companies', 'slug', 'cr-vinicola')
      app.delete(record)
    } catch (_) {}
  },
)
