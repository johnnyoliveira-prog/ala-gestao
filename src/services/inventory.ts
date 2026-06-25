import pb from '@/lib/pocketbase/client'

export interface InventoryItem {
  id: string
  company: string
  name: string
  sku: string
  current_quantity: number
  unit: string
  created: string
  updated: string
}

export interface InventoryMovement {
  id: string
  item: string
  user: string
  type: 'in' | 'out'
  quantity: number
  description: string
  created: string
  updated: string
  expand?: {
    item?: InventoryItem
    user?: any
  }
}

export const getCompanyIdBySlug = async (slug: string) => {
  const company = await pb.collection('companies').getFirstListItem(`slug="${slug}"`)
  return company.id
}

export const getInventoryItems = async (companyId: string) => {
  return pb.collection('inventory_items').getFullList<InventoryItem>({
    filter: `company = "${companyId}"`,
    sort: 'name',
  })
}

export const getInventoryMovements = async (companyId: string) => {
  return pb.collection('inventory_movements').getFullList<InventoryMovement>({
    filter: `item.company = "${companyId}"`,
    sort: '-created',
    expand: 'item,user',
  })
}

export const processVoiceCommand = async (text: string, companyId: string) => {
  return pb.send<{ message: string; new_quantity: number; action: string; item_id: string }>(
    '/backend/v1/process-stock-voice',
    {
      method: 'POST',
      body: JSON.stringify({ text, company_id: companyId }),
    },
  )
}

export const addInventoryMovement = async (
  itemId: string,
  type: 'in' | 'out',
  quantity: number,
  description: string,
) => {
  const item = await pb.collection('inventory_items').getOne<InventoryItem>(itemId)
  const newQty = type === 'in' ? item.current_quantity + quantity : item.current_quantity - quantity
  if (newQty < 0) throw new Error('Quantidade insuficiente em estoque.')

  await pb.collection('inventory_items').update(itemId, { current_quantity: newQty })
  await pb.collection('inventory_movements').create({
    item: itemId,
    user: pb.authStore.record?.id,
    type,
    quantity,
    description,
  })
}
