import pb from '@/lib/pocketbase/client'

export interface Company {
  id: string
  name: string
  slug: string
  group_id?: string
  created: string
  updated: string
}

export interface DreUpload {
  id: string
  collectionId: string
  collectionName: string
  user: string
  company: string
  month: number
  year: number
  file_ref: string
  file_type: string
  status: string
  created: string
  updated: string
}

export interface DreData {
  id: string
  collectionId: string
  collectionName: string
  user: string
  upload?: string
  company: string
  month: number
  year: number
  total_receitas: number
  total_despesas: number
  resultado: number
  saldo_anterior: number
  resultado_acumulado: number
  taxa_administracao_percentual: number
  taxa_administracao_valor: number
  taxa_reserva_percentual: number
  taxa_reserva_valor: number
  outras_deducoes: number
  total_repassar: number
  recebiveis_futuros: string
  created: string
  updated: string
  expand?: {
    company?: Company
    upload?: DreUpload
  }
}

export const getCompanies = async (): Promise<Company[]> => {
  return await pb.collection('companies').getFullList<Company>({
    sort: 'name',
  })
}

export const checkDuplicateDreData = async (
  companyId: string,
  month: number,
  year: number,
): Promise<DreData | null> => {
  try {
    const records = await pb.collection('dre_data').getList<DreData>(1, 1, {
      filter: `company = "${companyId}" && month = ${month} && year = ${year}`,
    })
    return records.items.length > 0 ? records.items[0] : null
  } catch (error) {
    return null
  }
}

export const saveDreFull = async ({
  userId,
  companyId,
  month,
  year,
  file,
  fileType,
  data,
  lineItems,
  overwriteId,
}: {
  userId: string
  companyId: string
  month: number
  year: number
  file: File | null
  fileType: string
  data: any
  lineItems?: any[]
  overwriteId?: string
}) => {
  let uploadId = null

  if (file) {
    const formData = new FormData()
    formData.append('user', userId)
    formData.append('company', companyId)
    formData.append('month', month.toString())
    formData.append('year', year.toString())
    formData.append('file_ref', file)
    formData.append('file_type', fileType)
    formData.append('status', 'processed')

    const uploadRecord = await pb.collection('dre_uploads').create(formData)
    uploadId = uploadRecord.id
  }

  const dreDataPayload: any = {
    user: userId,
    company: companyId,
    month,
    year,
    ...data,
  }

  if (uploadId) {
    dreDataPayload.upload = uploadId
  }

  let dreDataRecord

  if (overwriteId) {
    dreDataRecord = await pb.collection('dre_data').update(overwriteId, dreDataPayload)

    // Delete old line items
    const oldLineItems = await pb.collection('dre_line_items').getFullList({
      filter: `dre_data = "${overwriteId}"`,
    })
    for (const item of oldLineItems) {
      await pb.collection('dre_line_items').delete(item.id)
    }
  } else {
    dreDataRecord = await pb.collection('dre_data').create(dreDataPayload)
  }

  // Save line items
  if (lineItems && lineItems.length > 0) {
    for (const item of lineItems) {
      await pb.collection('dre_line_items').create({
        dre_data: dreDataRecord.id,
        tipo: item.tipo,
        codigo: item.codigo,
        descricao: item.descricao,
        valor: item.valor,
        categoria: item.categoria || 'Operacional',
        resumo: item.resumo || '',
        situacao: item.situacao || '',
      })
    }
  }

  return dreDataRecord
}

export const getDreData = async (): Promise<DreData[]> => {
  return await pb.collection('dre_data').getFullList<DreData>({
    sort: '-year,-month',
    expand: 'company,upload',
  })
}

export const getDreUploadFileUrl = (upload: DreUpload): string => {
  if (!upload || !upload.file_ref) return ''
  return pb.files.getUrl(upload, upload.file_ref)
}

export interface DreLineItem {
  id: string
  dre_data: string
  tipo: string
  codigo: string
  descricao: string
  resumo: string
  situacao: string
  valor: number
  percentual: number
  categoria: string
  created: string
  updated: string
}

export interface DreInvestor {
  id: string
  dre_data: string
  investor_name: string
  participation_percentage: number
  amount: number
  created: string
  updated: string
}

export const getDreInvestors = async (dreDataId: string): Promise<DreInvestor[]> => {
  return await pb.collection('dre_investors').getFullList<DreInvestor>({
    filter: `dre_data = "${dreDataId}"`,
  })
}

export const getCompanyBySlug = async (slug: string): Promise<Company> => {
  return await pb.collection('companies').getFirstListItem<Company>(`slug="${slug}"`)
}

export const getCompanyDreData = async (companyId: string): Promise<DreData[]> => {
  return await pb.collection('dre_data').getFullList<DreData>({
    filter: `company="${companyId}"`,
    sort: '-year,-month',
    expand: 'company,upload',
  })
}

export const getDreLineItems = async (dreDataId: string): Promise<DreLineItem[]> => {
  return await pb.collection('dre_line_items').getFullList<DreLineItem>({
    filter: `dre_data="${dreDataId}"`,
    sort: '-valor',
  })
}

export const updateFutureReceivables = async (id: string, text: string): Promise<DreData> => {
  return await pb.collection('dre_data').update<DreData>(id, { recebiveis_futuros: text })
}

export const deleteDreData = async (dreDataId: string): Promise<void> => {
  const record = await pb.collection('dre_data').getOne<DreData>(dreDataId)

  const items = await pb
    .collection('dre_line_items')
    .getFullList({ filter: `dre_data="${dreDataId}"` })
  for (const item of items) {
    await pb.collection('dre_line_items').delete(item.id)
  }

  const invs = await pb
    .collection('dre_investors')
    .getFullList({ filter: `dre_data="${dreDataId}"` })
  for (const inv of invs) {
    await pb.collection('dre_investors').delete(inv.id)
  }

  await pb.collection('dre_data').delete(dreDataId)

  if (record.upload) {
    try {
      await pb.collection('dre_uploads').delete(record.upload)
    } catch (e) {
      console.warn('Could not delete upload record', e)
    }
  }
}
