import { sha256 } from './format'

const ACCOUNT_KEY = 'safebuild-v2-account'
const SESSION_KEY = 'safebuild-v2-session'

export interface Account {
  name: string
  hash: string
}

export interface Session {
  name: string
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function loadAccount() {
  const account = read<Account>(ACCOUNT_KEY)
  if (!account || typeof account.name !== 'string' || typeof account.hash !== 'string') return null
  return account
}

export function loadSession() {
  const session = read<Session>(SESSION_KEY)
  const account = loadAccount()
  if (!session || !account || session.name !== account.name) return null
  return session
}

async function hashPassphrase(passphrase: string) {
  const hash = await sha256(`safebuild-v2:${passphrase}`)
  if (hash === 'Unavailable') throw new Error('This browser cannot keep a local passphrase.')
  return hash
}

export async function createAccount(name: string, passphrase: string, confirm: string) {
  const display = name.trim()
  if (display.length < 2) return 'Enter the name you want on this workspace.'
  if (passphrase.length < 4) return 'Use a passphrase of at least 4 characters.'
  if (passphrase !== confirm) return 'The passphrases do not match.'
  if (loadAccount()) return 'This browser already has a local profile. Sign in instead.'
  const hash = await hashPassphrase(passphrase)
  const account: Account = { name: display, hash }
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account))
  localStorage.setItem(SESSION_KEY, JSON.stringify({ name: display } satisfies Session))
  return null
}

export async function signIn(name: string, passphrase: string) {
  const account = loadAccount()
  if (!account) return 'Create local access before signing in.'
  if (name.trim().toLowerCase() !== account.name.toLowerCase()) return 'That name does not match the profile on this browser.'
  const hash = await hashPassphrase(passphrase)
  if (hash !== account.hash) return 'The passphrase does not match.'
  localStorage.setItem(SESSION_KEY, JSON.stringify({ name: account.name } satisfies Session))
  return null
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY)
}
