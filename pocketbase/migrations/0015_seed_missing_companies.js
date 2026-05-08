migrate(
  (app) => {
    const companiesData = [
      { name: 'Vinícola', slug: 'vinicola' },
      { name: 'Madri', slug: 'madri' },
      { name: 'Living Mall', slug: 'living-mall' },
      { name: 'Eco Resort', slug: 'eco-resort' },
      { name: 'TECDEF', slug: 'tecdef' },
    ]

    const col = app.findCollectionByNameOrId('companies')

    for (const data of companiesData) {
      try {
        app.findFirstRecordByData('companies', 'slug', data.slug)
      } catch (_) {
        const record = new Record(col)
        record.set('name', data.name)
        record.set('slug', data.slug)
        app.save(record)
      }
    }
  },
  (app) => {
    const slugs = ['vinicola', 'madri', 'living-mall', 'eco-resort', 'tecdef']
    for (const slug of slugs) {
      try {
        const record = app.findFirstRecordByData('companies', 'slug', slug)
        app.delete(record)
      } catch (_) {}
    }
  },
)
