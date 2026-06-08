routerAdd(
  'POST',
  '/backend/v1/parse-dre',
  (e) => {
    const body = e.requestInfo().body || {}
    const content = body.content

    if (!content) {
      return e.badRequestError('Nenhum arquivo enviado para extração.')
    }

    let parsedJson = { line_items: [] }

    try {
      const reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Você é um extrator de dados financeiros (DRE). Extraia as linhas do DRE a partir do texto de PDF fornecido.\nAlvos OBRIGATÓRIOS: "Código", "Item/Descrição" e "Valor".\nIGNORE a coluna de Percentual (%), cabeçalhos, rodapés e textos complementares.\nRetorne APENAS um objeto JSON (sem formatação markdown) no seguinte formato estrito:\n{"line_items":[{"codigo":"string","descricao":"string","valor":number,"tipo":"receita" ou "despesa","categoria":"Totalizador" ou "Operacional"}]}\nRegras:\n- valor: float (positivo, use ponto para decimais).\n- tipo: "receita" (entrada de dinheiro, vendas) ou "despesa" (saída, custos, deduções).\n- categoria: "Totalizador" (linhas que totalizam e somam grupos, geralmente códigos curtos como 1, 2, ou terminados em .00) ou "Operacional" (linhas de detalhe).',
          },
          { role: 'user', content: 'Extraia o DRE do seguinte texto:\n\n' + content },
        ],
      })

      let jsonText = reply.choices[0].message.content.trim()
      if (jsonText.startsWith('```json')) jsonText = jsonText.substring(7)
      if (jsonText.startsWith('```')) jsonText = jsonText.substring(3)
      if (jsonText.endsWith('```')) jsonText = jsonText.substring(0, jsonText.length - 3)

      parsedJson = JSON.parse(jsonText.trim())
    } catch (err) {
      return e.badRequestError(
        'Falha ao interpretar o arquivo usando IA. Tente novamente ou verifique se o arquivo possui um DRE legível.',
      )
    }

    if (!parsedJson.line_items || parsedJson.line_items.length === 0) {
      return e.badRequestError('Nenhuma linha do DRE encontrada pelo modelo de IA.')
    }

    const extracted = {
      total_revenue: 0,
      total_expenses: 0,
      net_result: 0,
      admin_fee_pct: 10,
      reserve_fee_pct: 5,
      line_items: parsedJson.line_items.map((i) => ({
        codigo: i.codigo || '',
        descricao: i.descricao || '',
        valor: Math.abs(i.valor || 0),
        tipo: i.tipo === 'receita' ? 'receita' : 'despesa',
        categoria: i.categoria === 'Totalizador' ? 'Totalizador' : 'Operacional',
        resumo: (i.descricao || '').substring(0, 20),
        situacao: '',
        percentual: 0,
      })),
    }

    const hasRecTot = extracted.line_items.some(
      (i) => i.tipo === 'receita' && i.categoria === 'Totalizador',
    )
    const hasDesTot = extracted.line_items.some(
      (i) => i.tipo === 'despesa' && i.categoria === 'Totalizador',
    )

    const fallbackRecSum = extracted.line_items
      .filter((i) => i.tipo === 'receita' && i.categoria !== 'Totalizador')
      .reduce((s, i) => s + i.valor, 0)
    const fallbackDesSum = extracted.line_items
      .filter((i) => i.tipo === 'despesa' && i.categoria !== 'Totalizador')
      .reduce((s, i) => s + i.valor, 0)

    let currentRecTot =
      fallbackRecSum > 0
        ? fallbackRecSum
        : extracted.line_items.filter((i) => i.tipo === 'receita').reduce((s, i) => s + i.valor, 0)
    let currentDesTot =
      fallbackDesSum > 0
        ? fallbackDesSum
        : extracted.line_items.filter((i) => i.tipo === 'despesa').reduce((s, i) => s + i.valor, 0)

    for (const item of extracted.line_items) {
      if (item.categoria === 'Totalizador') {
        item.percentual = 100
      } else {
        const base = item.tipo === 'receita' ? currentRecTot : currentDesTot
        item.percentual = base > 0 ? parseFloat(((item.valor / base) * 100).toFixed(2)) : 0
      }
    }

    extracted.total_revenue = hasRecTot
      ? extracted.line_items
          .filter((i) => i.tipo === 'receita' && i.categoria === 'Totalizador')
          .reduce((s, i) => s + i.valor, 0)
      : currentRecTot

    extracted.total_expenses = hasDesTot
      ? extracted.line_items
          .filter((i) => i.tipo === 'despesa' && i.categoria === 'Totalizador')
          .reduce((s, i) => s + i.valor, 0)
      : currentDesTot

    extracted.net_result = extracted.total_revenue - extracted.total_expenses

    return e.json(200, extracted)
  },
  $apis.requireAuth(),
)
