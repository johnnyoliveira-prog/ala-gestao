import pb from '@/lib/pocketbase/client'

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'gestor' | 'consultor'
  allowed_companies: string[]
  created: string
}

export const getUsers = () => pb.collection('users').getFullList<User>({ sort: 'name' })

export const updateUser = (id: string, data: Partial<User>) =>
  pb.collection('users').update<User>(id, data)
