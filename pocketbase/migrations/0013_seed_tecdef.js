migrate(
  (app) => {
    try {
      app.findFirstRecordByData('companies', 'slug', 'tecdef')
      return // already seeded
    } catch (_) {}

    const collection = app.findCollectionByNameOrId('companies')
    const record = new Record(collection)
    record.set('name', 'TECDEF')
    record.set('slug', 'tecdef')
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findFirstRecordByData('companies', 'slug', 'tecdef')
      app.delete(record)
    } catch (_) {}
  },
)
