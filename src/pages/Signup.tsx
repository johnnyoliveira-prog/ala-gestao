import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage, extractFieldErrors } from '@/lib/pocketbase/errors'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const { signUp, user } = useAuth()
  const navigate = useNavigate()

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Erro de Validação',
        description: 'As senhas não coincidem.',
      })
      return
    }

    if (password.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Senha fraca',
        description: 'A senha deve ter no mínimo 8 caracteres.',
      })
      return
    }

    setIsLoading(true)
    const { error } = await signUp(name, email, password)
    setIsLoading(false)

    if (error) {
      const errors = extractFieldErrors(error)
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro no Cadastro',
          description: getErrorMessage(error) || 'Não foi possível criar a conta. Tente novamente.',
        })
      }
    } else {
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Bem-vindo ao sistema Grupo ALA.',
        className: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      })
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">GRUPO ALA</h1>
        <p className="text-sm text-slate-500 font-medium tracking-widest uppercase">
          Quem conhece, confia.
        </p>
      </div>
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
          <CardDescription>Preencha os dados abaixo para se cadastrar no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {fieldErrors.name && (
                <p className="text-[0.8rem] font-medium text-destructive">{fieldErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {fieldErrors.email && (
                <p className="text-[0.8rem] font-medium text-destructive">{fieldErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {fieldErrors.password && (
                <p className="text-[0.8rem] font-medium text-destructive">{fieldErrors.password}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {fieldErrors.passwordConfirm && (
                <p className="text-[0.8rem] font-medium text-destructive">
                  {fieldErrors.passwordConfirm}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 mt-2"
              disabled={isLoading}
            >
              {isLoading ? 'Criando conta...' : 'Cadastrar'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Já possui uma conta?{' '}
            <Link to="/login" className="text-slate-900 font-semibold hover:underline">
              Entrar
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
