// @deps pdf-parse@1.1.1, buffer@6.0.3
routerAdd(
  'POST',
  '/backend/v1/parse-dre',
  async (e) => {
    const body = e.requestInfo().body || {}
    let content = body.content
    const uploadId = body.upload_id || body.uploadId

    if (!uploadId) {
      return e.badRequestError('O ID do upload (upload_id) é obrigatório.')
    }

    const uploadRecord = $app.findRecordById('dre_uploads', uploadId)
    if (!uploadRecord) {
      return e.notFoundError('Upload não encontrado.')
    }

    if (uploadRecord.getString('status') === 'processed') {
      return e.badRequestError('Este upload já foi processado.')
    }

    if (!content) {
      const fileRef = uploadRecord.getString('file_ref')
      if (!fileRef) {
        uploadRecord.set('status', 'error')
        $app.save(uploadRecord)
        return e.badRequestError('Nenhum arquivo ou texto enviado para extração.')
      }

      try {
        const baseUrl = $secrets.get('PB_INSTANCE_URL') || 'http://127.0.0.1:8090'
        const fileUrl = baseUrl + '/api/files/dre_uploads/' + uploadId + '/' + fileRef

        const res = await fetch(fileUrl)
        if (!res.ok) throw new Error('Falha ao baixar PDF')

        const arrayBuffer = await res.arrayBuffer()
        const pdfParse = require('pdf-parse')
        const { Buffer } = require('buffer')

        const pdfData = await pdfParse(Buffer.from(arrayBuffer))
        content = pdfData.text
      } catch (err) {
        uploadRecord.set('status', 'error')
        $app.save(uploadRecord)
        $app
          .logger()
          .error('Falha ao extrair texto do PDF', 'uploadId', uploadId, 'error', err.message)
        return e.badRequestError(
          'Falha ao processar o arquivo PDF. Envie o texto extraído no campo content.',
        )
      }
    }

    if (!content) {
      uploadRecord.set('status', 'error')
      $app.save(uploadRecord)
      return e.badRequestError('Nenhum texto de arquivo enviado para extração.')
    }

    let parsedJson = { line_items: [] }

    try {
      const reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Você é um extrator de dados financeiros (DRE). Extraia as linhas do DRE a partir do texto de PDF fornecido, focando na tabela de dados.\nAlvos OBRIGATÓRIOS: "Código", "Item/Descrição" (que deve ser mapeado para o campo "descricao") e "Valor".\nIGNORE automaticamente informações não essenciais como colunas de percentual (%), cabeçalhos, rodapés e textos complementares.\nRetorne APENAS um objeto JSON (sem formatação markdown) no seguinte formato estrito:\n{"line_items":[{"codigo":"string","descricao":"string","valor":number,"tipo":"receita" ou "despesa","categoria":"Totalizador" ou "Operacional"}]}\nRegras:\n- valor: float (positivo, use ponto para decimais e remova símbolos de moeda).\n- tipo: "receita" (entrada de dinheiro, vendas) ou "despesa" (saída, custos, deduções).\n- categoria: "Totalizador" (linhas que totalizam e somam grupos, geralmente códigos curtos como 1, 2, ou terminados em .00) ou "Operacional" (linhas de detalhe).',
          },
          { role: 'user', content: 'Extraia o DRE do seguinte texto de PDF:\n\n' + content },
        ],
      })

      let jsonText = reply.choices[0].message.content.trim()
      if (jsonText.startsWith('```json')) jsonText = jsonText.substring(7)
      if (jsonText.startsWith('```')) jsonText = jsonText.substring(3)
      if (jsonText.endsWith('```')) jsonText = jsonText.substring(0, jsonText.length - 3)

      parsedJson = JSON.parse(jsonText.trim())
    } catch (err) {
      uploadRecord.set('status', 'error')
      $app.save(uploadRecord)
      $app
        .logger()
        .error('Falha na interpretacao da IA', 'uploadId', uploadId, 'error', err.message)
      return e.badRequestError(
        'Falha ao interpretar o arquivo usando IA. Tente novamente ou verifique se o arquivo possui um DRE legível.',
      )
    }

    if (!parsedJson.line_items || parsedJson.line_items.length === 0) {
      uploadRecord.set('status', 'error')
      $app.save(uploadRecord)
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

    try {
      $app.runInTransaction((txApp) => {
        const companyId = uploadRecord.getString('company')
        const month = uploadRecord.getInt('month')
        const year = uploadRecord.getInt('year')
        const userId = uploadRecord.getString('user')

        let dreDataRecord
        try {
          const existing = txApp.findRecordsByFilter(
            'dre_data',
            'company = {:company} && month = {:month} && year = {:year}',
            '',
            1,
            0,
            { company: companyId, month: month, year: year },
          )
          if (existing.length > 0) {
            dreDataRecord = existing[0]
            const oldItems = txApp.findRecordsByFilter(
              'dre_line_items',
              'dre_data = {:dre_data}',
              '',
              1000,
              0,
              { dre_data: dreDataRecord.id },
            )
            for (const item of oldItems) {
              txApp.delete(item)
            }
          }
        } catch (err) {}

        if (!dreDataRecord) {
          const col = txApp.findCollectionByNameOrId('dre_data')
          dreDataRecord = new Record(col)
          dreDataRecord.set('company', companyId)
          dreDataRecord.set('month', month)
          dreDataRecord.set('year', year)
          dreDataRecord.set('user', userId)
        }

        dreDataRecord.set('upload', uploadId)
        dreDataRecord.set('total_receitas', extracted.total_revenue)
        dreDataRecord.set('total_despesas', extracted.total_expenses)
        dreDataRecord.set('resultado', extracted.net_result)
        txApp.save(dreDataRecord)

        const itemsCol = txApp.findCollectionByNameOrId('dre_line_items')
        for (const item of extracted.line_items) {
          const lineRecord = new Record(itemsCol)
          lineRecord.set('dre_data', dreDataRecord.id)
          lineRecord.set('codigo', item.codigo)
          lineRecord.set('descricao', item.descricao)
          lineRecord.set('valor', item.valor)
          lineRecord.set('tipo', item.tipo)
          lineRecord.set('categoria', item.categoria)
          lineRecord.set('percentual', item.percentual)
          lineRecord.set('resumo', item.resumo)
          lineRecord.set('situacao', item.situacao)
          txApp.save(lineRecord)
        }

        uploadRecord.set('status', 'processed')
        txApp.save(uploadRecord)
      })
    } catch (dbErr) {
      uploadRecord.set('status', 'error')
      $app.save(uploadRecord)
      $app.logger().error('Falha ao salvar no banco', 'uploadId', uploadId, 'error', dbErr.message)
      return e.badRequestError('Erro ao salvar os dados no banco de dados.')
    }

    return e.json(200, extracted)
  },
  $apis.requireAuth(),
)
