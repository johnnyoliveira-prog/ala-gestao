routerAdd(
  'POST',
  '/backend/v1/process-stock-voice',
  (e) => {
    const body = e.requestInfo().body || {}
    const { text, company_id } = body

    if (!text) return e.badRequestError('O texto da voz é obrigatório.')
    if (!company_id) return e.badRequestError('O ID da empresa é obrigatório.')

    const user = e.auth
    if (!user) return e.unauthorizedError('Usuário não autenticado.')

    const items = $app.findRecordsByFilter('inventory_items', 'company = {:company}', '', 1000, 0, {
      company: company_id,
    })

    const itemNames = items.map((i) => ({
      id: i.id,
      name: i.getString('name'),
      sku: i.getString('sku'),
    }))

    if (itemNames.length === 0) {
      return e.badRequestError('Nenhum item encontrado no estoque desta empresa.')
    }

    const prompt = `
Você é um assistente de gestão de estoque de uma vinícola.
Extraia a intenção do usuário a partir do texto falado e mapeie para UM dos produtos existentes na lista abaixo.
Produtos existentes:
${JSON.stringify(itemNames)}

Ação pode ser "add" (adicionar, entrada, chegou, colocar) ou "remove" (remover, saída, usar, vender, tirar).
Retorne APENAS um JSON OBRIGATÓRIO (sem formatação markdown):
{"action": "add" ou "remove", "item_id": "string com o id exato", "quantity": numero inteiro, "product_name": "string com o nome"}

Se não conseguir encontrar o produto ou a intenção, item_id deve ser null.
Texto falado: "${text}"
  `

    let parsed = null
    try {
      const reply = $ai.chat({
        model: 'fast',
        messages: [{ role: 'system', content: prompt }],
      })

      let jsonText = reply.choices[0].message.content.trim()
      if (jsonText.startsWith('```json')) jsonText = jsonText.substring(7)
      if (jsonText.startsWith('```')) jsonText = jsonText.substring(3)
      if (jsonText.endsWith('```')) jsonText = jsonText.substring(0, jsonText.length - 3)

      parsed = JSON.parse(jsonText.trim())
    } catch (err) {
      return e.badRequestError('Falha ao interpretar a voz. Tente falar novamente.')
    }

    if (!parsed || !parsed.item_id) {
      return e.badRequestError(`Não foi possível identificar o produto na frase: "${text}"`)
    }
    if (!parsed.quantity || parsed.quantity <= 0) {
      return e.badRequestError('Não foi possível identificar a quantidade de forma clara.')
    }

    try {
      let resultItemName = parsed.product_name || 'Desconhecido'
      let newQty = 0

      $app.runInTransaction((txApp) => {
        const itemRecord = txApp.findRecordById('inventory_items', parsed.item_id)

        const currentQty = itemRecord.getInt('current_quantity')
        const change = parsed.action === 'add' ? parsed.quantity : -parsed.quantity
        newQty = currentQty + change

        if (newQty < 0) {
          throw new Error(
            `Quantidade insuficiente em estoque. O item possui apenas ${currentQty} unidades.`,
          )
        }

        itemRecord.set('current_quantity', newQty)
        txApp.save(itemRecord)

        const movCol = txApp.findCollectionByNameOrId('inventory_movements')
        const movRecord = new Record(movCol)
        movRecord.set('item', parsed.item_id)
        movRecord.set('user', user.id)
        movRecord.set('type', parsed.action === 'add' ? 'in' : 'out')
        movRecord.set('quantity', parsed.quantity)
        movRecord.set('description', 'Comando de voz: ' + text)
        txApp.save(movRecord)

        resultItemName = itemRecord.getString('name')
      })

      return e.json(200, {
        message: `Sucesso: ${parsed.action === 'add' ? 'Adicionadas' : 'Removidas'} ${parsed.quantity} unidades do item ${resultItemName}.`,
        item_id: parsed.item_id,
        new_quantity: newQty,
        action: parsed.action,
      })
    } catch (err) {
      return e.badRequestError(err.message || 'Erro ao salvar atualização no banco de dados.')
    }
  },
  $apis.requireAuth(),
)
