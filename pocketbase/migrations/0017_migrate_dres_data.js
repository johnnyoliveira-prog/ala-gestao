migrate(
  (app) => {
    // 1. Update rules to allow all authenticated users to view
    const collectionsToUpdate = ['dre_data', 'dre_uploads', 'dre_line_items', 'dre_investors']
    for (const name of collectionsToUpdate) {
      try {
        const col = app.findCollectionByNameOrId(name)
        col.listRule = "@request.auth.id != ''"
        col.viewRule = "@request.auth.id != ''"
        app.save(col)
      } catch (e) {
        console.log('Skipping rule update for ' + name)
      }
    }

    // 2. Data Migration: dres -> dre_data
    let adminId = ''
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'johnnyoliveira@gmail.com')
      adminId = admin.id
    } catch (e) {
      try {
        const users = app.findRecordsByFilter('_pb_users_auth_', "id != ''", '', 1, 0)
        if (users.length > 0) adminId = users[0].id
      } catch (e2) {}
    }

    if (!adminId) return

    let dres = []
    try {
      dres = app.findRecordsByFilter('dres', "id != ''", '', 1000, 0)
    } catch (e) {
      console.log('No dres records found')
      return
    }

    for (const dre of dres) {
      const companyName = dre.getString('company_name')
      if (!companyName) continue

      const monthStr = dre.getString('month')
      const yearStr = dre.getString('year')
      const month = parseInt(monthStr, 10) || 1
      const year = parseInt(yearStr, 10) || 2024

      let slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      slug = slug.replace(/^-+|-+$/g, '')
      if (!slug) slug = 'company-' + $security.randomString(6).toLowerCase()

      // Find or create company
      let companyId = ''
      try {
        const safeName = companyName.replace(/'/g, "''")
        const existingCompanies = app.findRecordsByFilter(
          'companies',
          "name = '" + safeName + "' || slug = '" + slug + "'",
          '',
          1,
          0,
        )
        if (existingCompanies.length > 0) {
          companyId = existingCompanies[0].id
        }
      } catch (e) {}

      if (!companyId) {
        try {
          const col = app.findCollectionByNameOrId('companies')
          const newCompany = new Record(col)
          newCompany.set('name', companyName)
          newCompany.set('slug', slug)
          app.save(newCompany)
          companyId = newCompany.id
        } catch (e) {
          console.log('Error creating company ' + companyName)
          continue
        }
      }

      // Upsert dre_data
      try {
        let dreDataRecord = null
        try {
          const existingData = app.findRecordsByFilter(
            'dre_data',
            "company = '" + companyId + "' && month = " + month + ' && year = ' + year,
            '',
            1,
            0,
          )
          if (existingData.length > 0) dreDataRecord = existingData[0]
        } catch (e) {}

        if (!dreDataRecord) {
          const col = app.findCollectionByNameOrId('dre_data')
          dreDataRecord = new Record(col)
          dreDataRecord.set('user', adminId)
          dreDataRecord.set('company', companyId)
          dreDataRecord.set('month', month)
          dreDataRecord.set('year', year)
        }

        const dreRev = dre.getFloat('total_revenue')
        const dreExp = dre.getFloat('total_expenses')
        const dreRes = dre.getFloat('net_result')
        const dreAdminPct = dre.getFloat('admin_fee_pct')
        const dreResPct = dre.getFloat('reserve_fee_pct')
        const dreTrans = dre.getFloat('total_transfer')

        if (dreRev) dreDataRecord.set('total_receitas', dreRev)
        if (dreExp) dreDataRecord.set('total_despesas', dreExp)
        if (dreRes) dreDataRecord.set('resultado', dreRes)
        if (dreAdminPct) dreDataRecord.set('taxa_administracao_percentual', dreAdminPct)
        if (dreResPct) dreDataRecord.set('taxa_reserva_percentual', dreResPct)
        if (dreTrans) dreDataRecord.set('total_repassar', dreTrans)

        const future = dre.getString('future_receivables')
        if (future) dreDataRecord.set('recebiveis_futuros', future)

        app.save(dreDataRecord)
      } catch (e) {
        console.log('Error saving dre_data')
      }
    }
  },
  (app) => {
    // Revert rules if necessary
    const collectionsToUpdate = ['dre_data', 'dre_uploads', 'dre_line_items', 'dre_investors']
    for (const name of collectionsToUpdate) {
      try {
        const col = app.findCollectionByNameOrId(name)
        col.listRule = "@request.auth.id != '' && user = @request.auth.id"
        col.viewRule = "@request.auth.id != '' && user = @request.auth.id"
        app.save(col)
      } catch (e) {}
    }
  },
)
