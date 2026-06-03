import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Search, Edit2 } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { getUsers, updateUser, type User } from '@/services/users'
import { getCompanies, type Company } from '@/services/companies'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

export default function AdminUsers() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [search, setSearch] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (user?.role !== 'admin') return
    Promise.all([getUsers(), getCompanies()])
      .then(([u, c]) => {
        setUsers(u)
        setCompanies(c)
      })
      .catch(() => {
        toast({ title: 'Erro', description: 'Falha ao carregar dados.', variant: 'destructive' })
      })
      .finally(() => setLoading(false))
  }, [user, toast])

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  )

  const handleSaveUser = async () => {
    if (!editingUser) return
    try {
      const updated = await updateUser(editingUser.id, {
        role: editingUser.role,
        allowed_companies: editingUser.allowed_companies,
      })
      setUsers(
        users.map((u) =>
          u.id === updated.id
            ? { ...u, role: updated.role, allowed_companies: updated.allowed_companies }
            : u,
        ),
      )
      setEditingUser(null)
      toast({ title: 'Sucesso', description: 'Usuário atualizado com sucesso.' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar usuário.', variant: 'destructive' })
    }
  }

  const toggleCompany = (companyName: string) => {
    if (!editingUser) return
    const isAllowed = editingUser.allowed_companies?.includes(companyName)
    const newCompanies = isAllowed
      ? editingUser.allowed_companies.filter((c) => c !== companyName)
      : [...(editingUser.allowed_companies || []), companyName]
    setEditingUser({ ...editingUser, allowed_companies: newCompanies })
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Usuários</h1>
          <p className="text-slate-500">Gerencie acesso e permissões</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar por nome ou email..."
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Acesso (Empresas)</TableHead>
              <TableHead className="w-[80px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name || '-'}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                      {u.role || 'consultor'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.allowed_companies?.length > 0 ? (
                        u.allowed_companies.map((c) => (
                          <Badge key={c} variant="outline" className="text-xs">
                            {c}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">Nenhum</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setEditingUser(u)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="py-4 space-y-6">
              <div className="space-y-2">
                <Label>Perfil de Acesso</Label>
                <Select
                  value={editingUser.role || 'consultor'}
                  onValueChange={(val: any) => setEditingUser({ ...editingUser, role: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="consultor">Consultor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Empresas Permitidas</Label>
                <div className="h-[200px] overflow-y-auto rounded-md border p-4 space-y-4">
                  {companies.map((c) => (
                    <div key={c.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`company-${c.id}`}
                        checked={editingUser.allowed_companies?.includes(c.name)}
                        onCheckedChange={() => toggleCompany(c.name)}
                      />
                      <Label
                        htmlFor={`company-${c.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {c.name}
                      </Label>
                    </div>
                  ))}
                  {companies.length === 0 && (
                    <p className="text-sm text-slate-500">Nenhuma empresa encontrada.</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
