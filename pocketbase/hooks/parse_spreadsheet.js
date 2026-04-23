routerAdd(
  'POST',
  '/backend/v1/parse-spreadsheet',
  (e) => {
    const body = e.requestInfo().body || {}
    const content = body.content

    if (!content) return e.badRequestError('Nenhum conteúdo enviado.')

    try {
      const lines = []
      let currentLine = []
      let currentCell = ''
      let inQuotes = false

      let separator = ','
      const firstLineEnd = content.indexOf('\n')
      const firstLine = firstLineEnd !== -1 ? content.slice(0, firstLineEnd) : content
      if (firstLine.indexOf(';') !== -1 && firstLine.indexOf(',') === -1) {
        separator = ';'
      } else if (firstLine.split(';').length > firstLine.split(',').length) {
        separator = ';'
      }

      for (let i = 0; i < content.length; i++) {
        const char = content[i]
        const nextChar = content[i + 1]

        if (inQuotes) {
          if (char === '"' && nextChar === '"') {
            currentCell += '"'
            i++
          } else if (char === '"') {
            inQuotes = false
          } else {
            currentCell += char
          }
        } else {
          if (char === '"') {
            inQuotes = true
          } else if (char === separator) {
            currentLine.push(currentCell)
            currentCell = ''
          } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
            if (char === '\r') i++
            currentLine.push(currentCell)
            lines.push(currentLine)
            currentLine = []
            currentCell = ''
          } else if (char === '\r') {
            currentLine.push(currentCell)
            lines.push(currentLine)
            currentLine = []
            currentCell = ''
          } else {
            currentCell += char
          }
        }
      }

      if (currentCell !== '' || currentLine.length > 0) {
        currentLine.push(currentCell)
        lines.push(currentLine)
      }

      if (lines.length < 2) {
        return e.json(200, { data: [] })
      }

      const header = lines[0].map((h) => (h ? h.trim() : ''))
      const data = []

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]
        if (line.length === 0 || (line.length === 1 && line[0].trim() === '')) continue

        const row = {}
        for (let j = 0; j < header.length; j++) {
          row[header[j]] = line[j] ? line[j].trim() : ''
        }
        data.push(row)
      }

      return e.json(200, { data: data })
    } catch (err) {
      return e.badRequestError('Erro ao ler planilha: ' + err.message)
    }
  },
  $apis.requireAuth(),
)
