import { useNavigate } from '@tanstack/react-router'
import { authClient } from './auth-client'

/** ログアウトして、ログイン画面へ戻る。 */
export function LogoutButton() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      className="underline"
      onClick={async () => {
        await authClient.signOut()
        await navigate({ to: '/login' })
      }}
    >
      ログアウト
    </button>
  )
}
