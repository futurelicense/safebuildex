import { useState, type FormEvent } from 'react'
import { createAccount, loadAccount, signIn } from '../lib/auth'

export function Login({ onEnter, onBack }: { onEnter: (name: string) => void; onBack: () => void }) {
  const existing = loadAccount()
  const [name, setName] = useState(existing?.name ?? '')
  const [passphrase, setPassphrase] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const message = existing ? await signIn(name, passphrase) : await createAccount(name, passphrase, confirm)
      if (message) {
        setError(message)
        return
      }
      onEnter(loadAccount()?.name ?? name.trim())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sign-in failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit} autoComplete="off">
        <button className="text-link" type="button" onClick={onBack}>
          ← Back to SAFE-BUILD
        </button>
        <p className="landing-kicker">Local access</p>
        <h1>{existing ? 'Sign in' : 'Create local access'}</h1>
        <p className="muted">
          {existing
            ? `The profile for ${existing.name} is saved on this device. Signing out keeps the workspace.`
            : 'The first passphrase creates the profile for this browser. It is not sent anywhere.'}
        </p>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} required autoFocus />
        </label>
        <label>
          Passphrase
          <input type="password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} required />
        </label>
        {existing ? null : (
          <label>
            Confirm passphrase
            <input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required />
          </label>
        )}
        {error ? <p className="danger">{error}</p> : null}
        <button className="btn" type="submit" disabled={pending}>
          {pending ? 'Checking…' : existing ? 'Sign in' : 'Create access'}
        </button>
      </form>
    </div>
  )
}
