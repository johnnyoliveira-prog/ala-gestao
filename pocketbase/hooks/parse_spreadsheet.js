// @deps papaparse@5.4.1
routerAdd(
  'POST',
  '/backend/v1/parse-spreadsheet',
  (e) => {
    const Papa = require('papaparse')
    const body = e.requestInfo().body || {}
    const content = body.content

    if (!content) return e.badRequestError('Nenhum conteúdo enviado.')

    try {
      const result = Papa.parse(content, { header: true, skipEmptyLines: true })
      return e.json(200, { data: result.data })
    } catch (err) {
      return e.badRequestError('Erro ao ler planilha: ' + err.message)
    }
  },
  $apis.requireAuth(),
)
