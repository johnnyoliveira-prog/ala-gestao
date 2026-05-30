import pb from '@/lib/pocketbase/client'

export interface Company {
  id: string
  name: string
  slug: string
  group_id?: string
  created: string
  updated: string
}

export const getCompanies = async () => {
  return pb.collection<Company>('companies').getFullList({
    sort: 'name',
  })
}
