migrate(
  (app) => {
    const companies = new Collection({
      name: 'companies',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true },
        { name: 'group_id', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_companies_slug ON companies (slug)'],
    })
    app.save(companies)

    const initialCompanies = [
      'CR Hotel Boutique',
      'CR Vinícola',
      'CR Condomínio',
      'Fleme',
      'Madri',
      'Living Mall',
      'Reserva dos Inconfidentes',
      'Eco Resort',
    ]

    for (const name of initialCompanies) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      const record = new Record(companies)
      record.set('name', name)
      record.set('slug', slug)
      record.set('group_id', 'ALA')
      app.save(record)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('companies')
    app.delete(col)
  },
)
