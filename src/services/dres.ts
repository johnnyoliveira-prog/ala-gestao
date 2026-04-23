import pb from '@/lib/pocketbase/client'

export interface DreRecord {
  id: string
  company_name: string
  month: string
  year: string
  total_revenue: number
  total_expenses: number
  net_result: number
  admin_fee_pct: number
  reserve_fee_pct: number
  total_transfer: number
  investors_data: { name: string; pct: number; value: number }[]
  future_receivables: string
  file_ref?: string
  created: string
}

export const getDres = () => pb.collection('dres').getFullList<DreRecord>({ sort: '-created' })

export const createDre = (data: FormData) => pb.collection('dres').create(data)

export const updateDre = (id: string, data: FormData) => pb.collection('dres').update(id, data)

export const checkDuplicateDre = async (
  company: string,
  month: string,
  year: string,
): Promise<DreRecord | null> => {
  try {
    const record = await pb
      .collection('dres')
      .getFirstListItem<DreRecord>(
        `company_name="${company}" && month="${month}" && year="${year}"`,
      )
    return record
  } catch (e) {
    return null // Not found
  }
}

export const getDreFileUrl = (record: DreRecord) => {
  if (!record.file_ref) return ''
  return pb.files.getURL(record as any, record.file_ref)
}
