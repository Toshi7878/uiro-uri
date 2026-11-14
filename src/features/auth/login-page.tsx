import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from './auth-client'

/** 管理者のログイン画面。 */
export function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    const { error } = await authClient.signIn.username({ username, password })
    setSubmitting(false)
    if (error) {
      setError('ユーザー名かパスワードが違います')
      return
    }
    await navigate({ to: '/admin' })
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-4 p-4">
      <h1 className="text-lg font-bold">管理者ログイン</h1>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="username">ユーザー名</Label>
          <Input
            id="username"
            autoComplete="username"
            autoCapitalize="none"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">パスワード</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting}>
          ログイン
        </Button>
      </form>
    </div>
  )
}
