migrate(
  (app) => {
    const inventoryItems = new Collection({
      name: 'inventory_items',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'company',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('companies').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true },
        { name: 'sku', type: 'text' },
        { name: 'current_quantity', type: 'number', required: true },
        { name: 'unit', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_inventory_items_company_name ON inventory_items (company, name)',
      ],
    })
    app.save(inventoryItems)

    const inventoryMovements = new Collection({
      name: 'inventory_movements',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'item',
          type: 'relation',
          required: true,
          collectionId: inventoryItems.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'type', type: 'select', required: true, values: ['in', 'out'], maxSelect: 1 },
        { name: 'quantity', type: 'number', required: true },
        { name: 'description', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(inventoryMovements)

    try {
      const companies = app.findCollectionByNameOrId('companies')
      let crVinicola
      try {
        crVinicola = app.findFirstRecordByData('companies', 'slug', 'cr-vinicola')
      } catch (_) {
        crVinicola = new Record(companies)
        crVinicola.set('name', 'CR Vinícola')
        crVinicola.set('slug', 'cr-vinicola')
        app.save(crVinicola)
      }

      const items = [
        { name: 'Chardonnay 2022', sku: 'CH-22', qty: 120, unit: 'garrafas' },
        { name: 'Merlot Reserva', sku: 'MR-RES', qty: 45, unit: 'garrafas' },
        { name: 'Cabernet Sauvignon', sku: 'CS-00', qty: 250, unit: 'garrafas' },
        { name: 'Caixa Papelão 6', sku: 'CX-6', qty: 500, unit: 'unidades' },
      ]

      for (const item of items) {
        try {
          app.findFirstRecordByFilter('inventory_items', 'company = {:company} && name = {:name}', {
            company: crVinicola.id,
            name: item.name,
          })
        } catch (_) {
          const record = new Record(inventoryItems)
          record.set('company', crVinicola.id)
          record.set('name', item.name)
          record.set('sku', item.sku)
          record.set('current_quantity', item.qty)
          record.set('unit', item.unit)
          app.save(record)
        }
      }
    } catch (e) {
      console.log('Error seeding CR Vinícola:', e.message)
    }
  },
  (app) => {
    try {
      const inventoryMovements = app.findCollectionByNameOrId('inventory_movements')
      app.delete(inventoryMovements)
    } catch (_) {}
    try {
      const inventoryItems = app.findCollectionByNameOrId('inventory_items')
      app.delete(inventoryItems)
    } catch (_) {}
  },
)
