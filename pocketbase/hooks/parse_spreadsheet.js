// @deps xlsx@0.18.5
routerAdd(
  'POST',
  '/backend/v1/parse-spreadsheet',
  (e) => {
    const body = e.requestInfo().body || {}
    const content = body.content
    const isBase64 = body.isBase64 || false

    if (!content) return e.badRequestError('Nenhum conteúdo enviado.')

    try {
      const xlsx = require('xlsx')
      let workbook

      if (isBase64) {
        workbook = xlsx.read(content, { type: 'base64' })
      } else {
        workbook = xlsx.read(content, { type: 'string' })
      }

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return e.badRequestError('A planilha está vazia.')
      }

      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const json = xlsx.utils.sheet_to_json(worksheet, { defval: '' })

      if (json.length === 0) {
        return e.json(200, { data: [] })
      }

      return e.json(200, { data: json })
    } catch (err) {
      return e.badRequestError('Erro ao ler planilha: ' + err.message)
    }
  },
  $apis.requireAuth(),
)
