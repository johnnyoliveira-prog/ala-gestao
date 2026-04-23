// @deps xlsx@0.18.5
routerAdd(
  'POST',
  '/backend/v1/parse-spreadsheet',
  (e) => {
    const { read, utils } = require('xlsx')
    const body = e.requestInfo().body || {}
    const content = body.content

    if (!content) return e.badRequestError('Nenhum conteúdo enviado.')

    try {
      const workbook = read(content, { type: 'base64' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const json = utils.sheet_to_json(worksheet, { defval: '' })
      return e.json(200, { data: json })
    } catch (err) {
      return e.badRequestError('Erro ao ler planilha: ' + err.message)
    }
  },
  $apis.requireAuth(),
)
