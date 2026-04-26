migrate(
  (app) => {
    try {
      const dreData = app.findRecordsByFilter('dre_data', '1=1', '', 1000, 0)
      for (const dre of dreData) {
        const items = app.findRecordsByFilter(
          'dre_line_items',
          `dre_data = "${dre.id}"`,
          '',
          1000,
          0,
        )

        for (const item of items) {
          const codigo = item.getString('codigo') || ''
          const dots = (codigo.match(/\./g) || []).length
          if (dots === 1) {
            const parts = codigo.split('.')
            const isTotalizer = parts[0].length > 1 || parts[1] === '00'
            const novaCategoria = isTotalizer ? 'Totalizador' : 'Operacional'
            if (item.getString('categoria') !== novaCategoria) {
              item.set('categoria', novaCategoria)
              app.saveNoValidate(item)
            }
          }
        }

        const filtered = items.filter((i) => {
          const codigo = i.getString('codigo') || ''
          const dots = (codigo.match(/\./g) || []).length
          return dots === 1
        })

        const hasRecTot = filtered.some(
          (i) => i.getString('tipo') === 'receita' && i.getString('categoria') === 'Totalizador',
        )
        const hasDesTot = filtered.some(
          (i) => i.getString('tipo') === 'despesa' && i.getString('categoria') === 'Totalizador',
        )

        let totalRec = 0
        let totalDes = 0

        if (hasRecTot) {
          totalRec = filtered
            .filter(
              (i) =>
                i.getString('tipo') === 'receita' && i.getString('categoria') === 'Totalizador',
            )
            .reduce((sum, i) => sum + i.getFloat('valor'), 0)
        } else {
          totalRec = filtered
            .filter((i) => i.getString('tipo') === 'receita')
            .reduce((sum, i) => sum + i.getFloat('valor'), 0)
        }

        if (hasDesTot) {
          totalDes = filtered
            .filter(
              (i) =>
                i.getString('tipo') === 'despesa' && i.getString('categoria') === 'Totalizador',
            )
            .reduce((sum, i) => sum + i.getFloat('valor'), 0)
        } else {
          totalDes = filtered
            .filter((i) => i.getString('tipo') === 'despesa')
            .reduce((sum, i) => sum + i.getFloat('valor'), 0)
        }

        dre.set('total_receitas', totalRec)
        dre.set('total_despesas', totalDes)
        dre.set('resultado', totalRec - totalDes)
        app.saveNoValidate(dre)
      }
    } catch (err) {
      console.log('Error in migration 0014', err)
    }
  },
  (app) => {
    // no-op
  },
)
