// @deps xlsx@0.18.5
routerAdd(
  'POST',
  '/backend/v1/parse-dre',
  (e) => {
    const xlsx = require('xlsx')
    const body = e.requestInfo().body || {}
    const content = body.content

    if (!content) {
      return e.badRequestError('Nenhum arquivo enviado para extração.')
    }

    try {
      const workbook = xlsx.read(content, { type: 'base64' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 })

      let extracted = {
        total_revenue: 0,
        total_expenses: 0,
        net_result: 0,
        admin_fee_pct: 10,
        reserve_fee_pct: 5,
        investors_data: [],
        line_items: [],
      }

      let section = 'none'

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length === 0) continue

        const colA = String(row[0] || '').trim()
        const colALower = colA.toLowerCase()

        let rawVal = row[1] !== undefined && row[1] !== '' ? row[1] : row[2]
        let val = 0

        if (typeof rawVal === 'number') {
          val = rawVal
        } else if (typeof rawVal === 'string') {
          let cleaned = rawVal.replace(/R\$\s*/g, '').trim()
          if (cleaned.includes(',')) {
            cleaned = cleaned.replace(/\./g, '').replace(',', '.')
          }
          val = parseFloat(cleaned) || 0
        }

        if (
          colALower === 'receitas' ||
          colALower === 'receita' ||
          colALower.includes('receita total')
        ) {
          section = 'receitas'
          if (val > 0) extracted.total_revenue = val
          continue
        } else if (
          colALower === 'despesas' ||
          colALower === 'despesa' ||
          colALower.includes('despesa total')
        ) {
          section = 'despesas'
          if (val > 0) extracted.total_expenses = val
          continue
        } else if (
          colALower.includes('resultado') ||
          colALower.includes('líquido') ||
          colALower.includes('liquido')
        ) {
          section = 'none'
          extracted.net_result = val
          continue
        } else if (
          colALower.includes('sócios') ||
          colALower.includes('investidor') ||
          colALower.includes('investidores')
        ) {
          section = 'investidores'
          continue
        }

        if (!colA) continue

        if (section === 'receitas' && val > 0) {
          if (colALower.includes('total')) {
            extracted.total_revenue = val
          } else {
            extracted.line_items.push({
              tipo: 'receita',
              descricao: colA,
              valor: val,
              categoria: 'Operacional',
            })
          }
        } else if (section === 'despesas' && val > 0) {
          if (colALower.includes('total')) {
            extracted.total_expenses = val
          } else {
            extracted.line_items.push({
              tipo: 'despesa',
              descricao: colA,
              valor: val,
              categoria: 'Operacional',
            })
          }
        } else if (section === 'investidores') {
          let rawPct = row[1] !== undefined && row[1] !== '' ? row[1] : row[2]
          let pct = 0
          if (typeof rawPct === 'number') {
            pct = rawPct <= 1 ? rawPct * 100 : rawPct
          } else if (typeof rawPct === 'string') {
            let pctCleaned = rawPct.replace('%', '').trim()
            if (pctCleaned.includes(',')) {
              pctCleaned = pctCleaned.replace(/\./g, '').replace(',', '.')
            }
            pct = parseFloat(pctCleaned) || 0
          }
          if (pct > 0) {
            extracted.investors_data.push({ name: colA, pct: pct, value: 0 })
          }
        }
      }

      if (extracted.total_revenue === 0) {
        extracted.total_revenue = extracted.line_items
          .filter((i) => i.tipo === 'receita')
          .reduce((sum, item) => sum + item.valor, 0)
      }
      if (extracted.total_expenses === 0) {
        extracted.total_expenses = extracted.line_items
          .filter((i) => i.tipo === 'despesa')
          .reduce((sum, item) => sum + item.valor, 0)
      }
      if (extracted.net_result === 0) {
        extracted.net_result = extracted.total_revenue - extracted.total_expenses
      }

      if (extracted.investors_data.length === 0) {
        extracted.investors_data = [
          { name: 'Sócio Majoritário', pct: 70, value: 0 },
          { name: 'Sócio Minoritário', pct: 30, value: 0 },
        ]
      }

      if (extracted.total_revenue === 0 && extracted.total_expenses === 0) {
        return e.badRequestError(
          'Não foi possível extrair dados financeiros deste arquivo. Estrutura não reconhecida.',
        )
      }

      return e.json(200, extracted)
    } catch (err) {
      return e.badRequestError(
        'Estrutura de dados inválida no arquivo. Certifique-se de usar o formato correto.',
      )
    }
  },
  $apis.requireAuth(),
)
