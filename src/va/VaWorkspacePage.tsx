import { useEffect, useMemo, useRef, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import './VaWorkspace.css'
import './VaReliability.css'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import { importLocalWorkspace, loadCloudWorkspace, syncCloudWorkspace } from './vaCloud'
import { loadVaWorkspace, saveVaWorkspace } from './vaStorage'
import type {
  VaClient,
  VaClientDraft,
  VaTask,
  VaTaskDraft,
  VaTaskResponsibility,
  VaTaskStatus,
  VaWorkspaceData,
} from './vaTypes'

type VaWorkspacePageProps = {
  onNavigate: (path: string) => void
}

type WorkspaceView = 'clients' | 'today' | 'follow-up' | 'waiting' | 'upcoming' | 'overdue' | 'completed'
type SyncStatus = 'idle' | 'saving' | 'saved' | 'error'

const emptyWorkspace: VaWorkspaceData = {
  version: 2,
  clients: [],
  tasks: [],
}

const emptyClientDraft: VaClientDraft = {
  displayName: '',
  contactName: '',
  email: '',
  phone: '',
  serviceType: '',
  timeZone: '',
  notes: '',
  active: true,
}

const emptyTaskDraft: VaTaskDraft = {
  clientId: '',
  title: '',
  details: '',
  dueDate: '',
  actionDate: '',
  followUpDate: '',
  status: 'needs-action',
  responsibility: 'va',
}

const nameMaxLength = 80
const taskTitleMaxLength = 120
const notesMaxLength = 1200
const taskDetailsMaxLength = 1500


function VaWorkspacePage({ onNavigate }: VaWorkspacePageProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [passwordRecovery, setPasswordRecovery] = useState(() => hasPasswordRecoveryIntent())

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return
      }

      setSession(data.session)
      setAuthLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)

      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
      }

      if (event === 'SIGNED_OUT') {
        setPasswordRecovery(false)
      }

      setAuthLoading(false)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  if (!isSupabaseConfigured) {
    return (
      <AuthFrame onNavigate={onNavigate}>
        <section className="va-auth-card va-auth-card-single">
          <p className="va-eyebrow">Setup needed</p>
          <h1>Supabase is not configured.</h1>
          <p>
            Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in
            your .env.local file, then restart the development server.
          </p>
        </section>
      </AuthFrame>
    )
  }

  if (authLoading) {
    return (
      <AuthFrame onNavigate={onNavigate}>
        <section className="va-auth-card va-auth-card-single">
          <p>Checking your account...</p>
        </section>
      </AuthFrame>
    )
  }

  if (!session) {
    return (
      <AuthFrame onNavigate={onNavigate}>
        <AuthPanel />
      </AuthFrame>
    )
  }

  if (passwordRecovery) {
    return (
      <AuthFrame onNavigate={onNavigate}>
        <UpdatePasswordPanel
          onComplete={() => {
            setPasswordRecovery(false)
            window.history.replaceState(null, '', '/workspace')
          }}
        />
      </AuthFrame>
    )
  }

  return (
    <>
      <div className="va-auth-account-bar">
        <div>
          <span>Signed in as</span>
          <strong>{session.user.email ?? 'Account user'}</strong>
        </div>
        <div>
          <span className="va-auth-stage-note">Cloud sync active</span>
          <button
            type="button"
            onClick={() => {
              void supabase.auth.signOut()
            }}
          >
            Sign out
          </button>
        </div>
      </div>
      <LocalWorkspacePage onNavigate={onNavigate} user={session.user} />
    </>
  )
}

function AuthFrame({
  onNavigate,
  children,
}: {
  onNavigate: (path: string) => void
  children: React.ReactNode
}) {
  return (
    <main className="va-page-shell">
      <header className="va-topbar">
        <a
          className="va-brand"
          href="/"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/')
          }}
        >
          <img
            className="whenisdue-brand-logo"
            src="/whenisdue-logo.png"
            alt="WhenIsDue"
          />
        </a>

        <nav className="va-topbar-actions" aria-label="Workspace navigation">
          <a
            href="/"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/')
            }}
          >
            Calculators
          </a>
          <span aria-current="page">VA Workspace</span>
        </nav>
      </header>

      {children}
    </main>
  )
}

function AuthPanel() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up' | 'forgot-password'>(() => {
    const requestedMode = new URLSearchParams(window.location.search).get('mode')
    return requestedMode === 'sign-up' ? 'sign-up' : 'sign-in'
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const emailIsValid = email.trim().length > 3
  const canSubmit =
    mode === 'forgot-password'
      ? emailIsValid
      : emailIsValid && password.length >= 8

  async function submit() {
    if (!canSubmit) {
      setMessage(
        mode === 'forgot-password'
          ? 'Enter the email address connected to your account.'
          : 'Enter a valid email and a password with at least 8 characters.',
      )
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      if (mode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/workspace`,
        })

        if (error) {
          throw error
        }

        setMessage('Check your email for a password-reset link.')
        return
      }

      if (mode === 'sign-up') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/workspace`,
          },
        })

        if (error) {
          throw error
        }

        if (!data.session) {
          setMessage('Check your email to confirm the account, then return here to sign in.')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) {
          throw error
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const heading =
    mode === 'sign-in'
      ? 'Sign in'
      : mode === 'sign-up'
        ? 'Create a free account'
        : 'Reset your password'

  return (
    <section className="va-auth-shell">
      <div className="va-auth-intro">
        <p className="va-eyebrow">Private account</p>
        <h1>Sign in before opening your VA workspace.</h1>
        <p>
          Your clients and tasks are stored in your private account and stay available
          across your devices.
        </p>
      </div>

      <form
        className="va-auth-card"
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <p className="va-eyebrow">
          {mode === 'sign-in'
            ? 'Welcome back'
            : mode === 'sign-up'
              ? 'Create account'
              : 'Account recovery'}
        </p>
        <h2>{heading}</h2>

        {mode === 'forgot-password' ? (
          <p className="va-auth-helper">
            Enter your account email. We will send you a secure link for choosing a new password.
          </p>
        ) : null}

        <label>
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        {mode !== 'forgot-password' ? (
          <label>
            <span>Password</span>
            <input
              type="password"
              minLength={8}
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <small>Use at least 8 characters.</small>
          </label>
        ) : null}

        <button
          className="va-primary-button"
          type="submit"
          disabled={!canSubmit || submitting}
        >
          {submitting
            ? 'Please wait...'
            : mode === 'sign-in'
              ? 'Sign in'
              : mode === 'sign-up'
                ? 'Create account'
                : 'Send reset link'}
        </button>

        {mode === 'sign-in' ? (
          <button
            className="va-auth-forgot"
            type="button"
            onClick={() => {
              setMode('forgot-password')
              setPassword('')
              setMessage(null)
            }}
          >
            Forgot password?
          </button>
        ) : null}

        <button
          className="va-auth-switch"
          type="button"
          onClick={() => {
            setMode((current) => {
              const nextMode = current === 'sign-in' ? 'sign-up' : 'sign-in'
              const nextUrl = nextMode === 'sign-up' ? '/workspace?mode=sign-up' : '/workspace'
              window.history.replaceState(null, '', nextUrl)
              return nextMode
            })
            setPassword('')
            setMessage(null)
          }}
        >
          {mode === 'sign-in'
            ? 'Need an account? Create one'
            : mode === 'sign-up'
              ? 'Already have an account? Sign in'
              : 'Return to sign in'}
        </button>

        {message ? <p className="va-auth-message" aria-live="polite">{message}</p> : null}
      </form>
    </section>
  )
}

function UpdatePasswordPanel({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit =
    password.length >= 8 &&
    confirmPassword.length >= 8 &&
    password === confirmPassword

  async function updatePassword() {
    if (password.length < 8) {
      setMessage('Use at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('The two passwords do not match.')
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        throw error
      }

      setMessage('Password updated. Opening your workspace...')

      window.setTimeout(() => {
        onComplete()
      }, 700)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Password update failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      className="va-auth-card va-auth-card-single"
      onSubmit={(event) => {
        event.preventDefault()
        void updatePassword()
      }}
    >
      <p className="va-eyebrow">Account recovery</p>
      <h2>Choose a new password</h2>
      <p className="va-auth-helper">Use at least 8 characters and enter it twice.</p>

      <label>
        <span>New password</span>
        <input
          type="password"
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      <label>
        <span>Confirm new password</span>
        <input
          type="password"
          minLength={8}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </label>

      <button
        className="va-primary-button"
        type="submit"
        disabled={!canSubmit || submitting}
      >
        {submitting ? 'Saving...' : 'Save new password'}
      </button>

      {message ? <p className="va-auth-message" aria-live="polite">{message}</p> : null}
    </form>
  )
}

function hasPasswordRecoveryIntent(): boolean {
  const search = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))

  return search.get('type') === 'recovery' || hash.get('type') === 'recovery'
}

function LocalWorkspacePage({
  onNavigate,
  user,
}: VaWorkspacePageProps & { user: User }) {
  const [localSnapshot] = useState(loadVaWorkspace)
  const [workspace, setWorkspace] = useState<VaWorkspaceData>(emptyWorkspace)
  const [workspaceLoading, setWorkspaceLoading] = useState(true)
  const [view, setView] = useState<WorkspaceView>('today')
  const [clockNow, setClockNow] = useState(() => new Date())
  const [clockClientId, setClockClientId] = useState('')
  const [formPanel, setFormPanel] = useState<'task' | 'client' | null>(null)
  const [waitingTaskId, setWaitingTaskId] = useState<string | null>(null)
  const [waitingCheckDate, setWaitingCheckDate] = useState('')
  const [waitingResponsibility, setWaitingResponsibility] =
    useState<VaTaskResponsibility>('client')
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [clientDraft, setClientDraft] = useState<VaClientDraft>(emptyClientDraft)
  const [taskDraft, setTaskDraft] = useState<VaTaskDraft>(emptyTaskDraft)
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [failedWorkspace, setFailedWorkspace] = useState<VaWorkspaceData | null>(null)
  const [importing, setImporting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge')
  const [replaceConfirmation, setReplaceConfirmation] = useState('')
  const restoreInputRef = useRef<HTMLInputElement | null>(null)
  const syncQueue = useRef<Promise<void>>(Promise.resolve())
  const syncRevision = useRef(0)

  useEffect(() => {
    let active = true
    setWorkspaceLoading(true)

    loadCloudWorkspace(user)
      .then((cloudWorkspace) => {
        if (!active) {
          return
        }

        setWorkspace(cloudWorkspace)

        const cloudHasRecords =
          cloudWorkspace.clients.length > 0 || cloudWorkspace.tasks.length > 0
        const browserHasRecords =
          localSnapshot.clients.length > 0 || localSnapshot.tasks.length > 0

        if (cloudHasRecords || !browserHasRecords) {
          saveVaWorkspace(cloudWorkspace)
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setMessage(getErrorMessage(error))
        }
      })
      .finally(() => {
        if (active) {
          setWorkspaceLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [localSnapshot, user])

  useEffect(() => {
    const interval = window.setInterval(() => setClockNow(new Date()), 60_000)
    return () => window.clearInterval(interval)
  }, [])

  const today = getTodayKey()

  const sortedClients = useMemo(
    () => [...workspace.clients].sort(compareClients),
    [workspace.clients],
  )

  const selectedClockClient =
    sortedClients.find((client) => client.id === clockClientId) ??
    sortedClients[0]

  const visibleTasks = useMemo(
    () => filterTasksForView(workspace.tasks, view, today).sort((first, second) => compareTasksForView(first, second, view, today)),
    [today, view, workspace.tasks],
  )

  const waitingGroups = useMemo(
    () => groupWaitingTasks(visibleTasks, today),
    [today, visibleTasks],
  )

  const activeClients = workspace.clients.filter((client) => client.active).length
  const todayCount = filterTasksForView(workspace.tasks, 'today', today).length
  const waitingCount = filterTasksForView(workspace.tasks, 'waiting', today).length
  const upcomingCount = filterTasksForView(workspace.tasks, 'upcoming', today).length
  const completedCount = filterTasksForView(workspace.tasks, 'completed', today).length
  const tomorrow = getRelativeDateKey(today, 1)
  const nextWeek = getRelativeDateKey(today, 7)
  const completedTodayCount = workspace.tasks.filter(
    (task) =>
      task.status === 'completed' &&
      getLocalDateKeyFromIso(task.updatedAt) === today,
  ).length
  const stillOpenCount = workspace.tasks.filter(
    (task) => task.status !== 'completed',
  ).length
  const waitingOnOthersCount = workspace.tasks.filter(
    (task) => task.status === 'waiting',
  ).length
  const returningTomorrowCount = workspace.tasks.filter(
    (task) =>
      task.status === 'waiting' &&
      task.followUpDate === tomorrow,
  ).length
  const upcomingDeadlineCount = workspace.tasks.filter(
    (task) =>
      task.status !== 'completed' &&
      Boolean(
        task.dueDate &&
          task.dueDate > today &&
          task.dueDate <= nextWeek,
      ),
  ).length
  const unclearCount = workspace.tasks.filter(
    (task) =>
      task.status !== 'completed' &&
      task.responsibility === 'unclear',
  ).length

  const canSaveClient = clientDraft.displayName.trim().length > 0
  const taskIsWaitingOnSomeone = isWaitingResponsibility(
    taskDraft.responsibility,
  )

  const canSaveTask =
    taskDraft.clientId.trim().length > 0 &&
    taskDraft.title.trim().length > 0 &&
    (taskIsWaitingOnSomeone
      ? Boolean(taskDraft.followUpDate)
      : Boolean(taskDraft.actionDate || taskDraft.dueDate))

  const cloudIsEmpty = workspace.clients.length === 0 && workspace.tasks.length === 0
  const localHasRecords =
    localSnapshot.clients.length > 0 || localSnapshot.tasks.length > 0

  function persist(nextWorkspace: VaWorkspaceData, successMessage?: string) {
    const localResult = saveVaWorkspace(nextWorkspace)

    if (!localResult.ok) {
      setMessage(localResult.message)
      setSyncStatus('error')
      setSyncError(localResult.message)
      setFailedWorkspace(nextWorkspace)
      return false
    }

    const revision = syncRevision.current + 1
    syncRevision.current = revision

    setWorkspace(nextWorkspace)
    setMessage(successMessage ?? 'Saved in this browser. Syncing to your account...')
    setSyncStatus('saving')
    setSyncError(null)
    setFailedWorkspace(null)

    syncQueue.current = syncQueue.current
      .catch(() => undefined)
      .then(async () => {
        await syncCloudWorkspace(user, nextWorkspace)
        const verifiedWorkspace = await loadCloudWorkspace(user)

        if (!workspacesMatch(nextWorkspace, verifiedWorkspace)) {
          throw new Error(
            'The cloud copy did not match the dates and statuses you saved. Please retry.',
          )
        }

        if (syncRevision.current === revision) {
          setWorkspace(verifiedWorkspace)
          saveVaWorkspace(verifiedWorkspace)
          setSyncStatus('saved')
          setSyncError(null)
          setFailedWorkspace(null)
          setMessage(successMessage ? `${successMessage} Cloud sync confirmed.` : 'Cloud sync confirmed.')
        }
      })
      .catch((error: unknown) => {
        if (syncRevision.current === revision) {
          const errorMessage = getErrorMessage(error)
          setSyncStatus('error')
          setSyncError(errorMessage)
          setFailedWorkspace(nextWorkspace)
          setMessage(`Cloud sync failed: ${errorMessage}`)
        }
      })

    return true
  }

  function retryCloudSync() {
    if (!failedWorkspace) {
      return
    }

    persist(failedWorkspace, 'Retrying the last saved change.')
  }

  function saveClientTimeZone(clientId: string, timeZone: string) {
    const clients = workspace.clients.map((client) =>
      client.id === clientId
        ? {
            ...client,
            timeZone,
            updatedAt: new Date().toISOString(),
          }
        : client,
    )

    persist(
      { ...workspace, clients },
      timeZone
        ? 'Client timezone saved.'
        : 'Client timezone removed.',
    )
  }

  async function importBrowserRecords() {
    if (importing) {
      return
    }

    const confirmed = window.confirm(
      'Copy the clients and tasks saved in this browser into your private cloud account?',
    )

    if (!confirmed) {
      return
    }

    setImporting(true)
    setMessage(null)

    try {
      const imported = await importLocalWorkspace(user, localSnapshot)
      setWorkspace(imported)
      saveVaWorkspace(imported)
      setMessage('Browser records copied to your cloud account.')
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setImporting(false)
    }
  }


  function downloadBackup() {
    const backup = {
      format: 'whenisdue-va-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      workspace,
    }

    const fileContents = JSON.stringify(backup, null, 2)
    const blob = new Blob([fileContents], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `whenisdue-backup-${getTodayKey()}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)

    setMessage(
      `Backup downloaded: ${safeCount(workspace.clients.length)} clients and ${safeCount(workspace.tasks.length)} tasks.`,
    )
  }

  async function restoreBackup(file: File) {
    if (restoring) {
      return
    }

    setRestoring(true)
    setMessage(null)

    try {
      const text = await file.text()
      const parsed: unknown = JSON.parse(text)
      const importedWorkspace = parseBackupWorkspace(parsed)
      const clientCount = safeCount(importedWorkspace.clients.length)
      const taskCount = safeCount(importedWorkspace.tasks.length)
      const actionWord = restoreMode === 'replace' ? 'replace' : 'merge with'

      const warning =
        restoreMode === 'replace'
          ? `WARNING: Replace will permanently remove all current clients and tasks from this account before importing the backup.\n\nThis backup contains ${clientCount} ${clientCount === 1 ? 'client' : 'clients'} and ${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}.\n\nContinue and replace your current workspace?`
          : `This backup contains ${clientCount} ${clientCount === 1 ? 'client' : 'clients'} and ${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}.\n\nContinue and ${actionWord} your current workspace?`

      const confirmed = window.confirm(warning)

      if (!confirmed) {
        setMessage('Restore cancelled. No records were changed.')
        return
      }

      const nextWorkspace =
        restoreMode === 'replace'
          ? importedWorkspace
          : mergeWorkspaces(workspace, importedWorkspace)

      const localResult = saveVaWorkspace(nextWorkspace)

      if (!localResult.ok) {
        throw new Error(localResult.message ?? 'The restored backup could not be saved in this browser.')
      }

      setWorkspace(nextWorkspace)

      syncQueue.current = syncQueue.current.then(() =>
        syncCloudWorkspace(user, nextWorkspace),
      )
      await syncQueue.current

      setMessage(
        `Backup restored. Your account now has ${safeCount(nextWorkspace.clients.length)} clients and ${safeCount(nextWorkspace.tasks.length)} tasks.`,
      )
    } catch (error) {
      setMessage(`Restore failed: ${getErrorMessage(error)}`)
    } finally {
      setRestoring(false)

      if (restoreInputRef.current) {
        restoreInputRef.current.value = ''
      }

      setReplaceConfirmation('')
    }
  }

  function saveClient() {
    if (!canSaveClient) {
      setMessage('Add a client or household name before saving.')
      return
    }

    const now = new Date().toISOString()
    const normalized = normalizeClientDraft(clientDraft)
    const clients = editingClientId
      ? workspace.clients.map((client) =>
          client.id === editingClientId ? { ...client, ...normalized, updatedAt: now } : client,
        )
      : [{ ...normalized, id: createId(), createdAt: now, updatedAt: now }, ...workspace.clients]

    if (persist({ ...workspace, clients }, editingClientId ? 'Client updated.' : 'Client saved.')) {
      setClientDraft(emptyClientDraft)
      setEditingClientId(null)
      setFormPanel(null)
    }
  }

  function editClient(client: VaClient) {
    setClientDraft({
      displayName: client.displayName,
      contactName: client.contactName,
      email: client.email,
      phone: client.phone,
      serviceType: client.serviceType,
      timeZone: client.timeZone,
      notes: client.notes,
      active: client.active,
    })
    setEditingClientId(client.id)
    setFormPanel('client')
    setView('clients')
    setMessage(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function toggleClient(clientId: string) {
    const clients = workspace.clients.map((client) =>
      client.id === clientId
        ? { ...client, active: !client.active, updatedAt: new Date().toISOString() }
        : client,
    )
    persist({ ...workspace, clients })
  }

  function deleteClient(client: VaClient) {
    const taskCount = workspace.tasks.filter((task) => task.clientId === client.id).length
    const warning = taskCount > 0
      ? `Delete ${client.displayName} and ${taskCount} linked ${taskCount === 1 ? 'task' : 'tasks'}?`
      : `Delete ${client.displayName}?`

    if (!window.confirm(warning)) {
      return
    }

    persist({
      ...workspace,
      clients: workspace.clients.filter((item) => item.id !== client.id),
      tasks: workspace.tasks.filter((task) => task.clientId !== client.id),
    })

    if (editingClientId === client.id) {
      setClientDraft(emptyClientDraft)
      setEditingClientId(null)
    }
  }

  function saveTask(form?: HTMLFormElement) {
    if (!canSaveTask) {
      setMessage('Choose a client, add a task title, and enter at least one date.')
      return
    }

    const now = new Date().toISOString()
    const submittedDates = form ? new FormData(form) : null
    const draftForSave: VaTaskDraft = {
      ...taskDraft,
      actionDate: readFormDate(
        submittedDates,
        'actionDate',
        taskDraft.actionDate,
      ),
      dueDate: readFormDate(
        submittedDates,
        'dueDate',
        taskDraft.dueDate,
      ),
      followUpDate: readFormDate(
        submittedDates,
        'followUpDate',
        taskDraft.followUpDate,
      ),
    }

    const waitingOnSomeone = isWaitingResponsibility(
      draftForSave.responsibility,
    )

    if (waitingOnSomeone && !draftForSave.followUpDate) {
      setMessage('Choose when you want this item to return for follow-up.')
      return
    }

    if (
      !waitingOnSomeone &&
      !draftForSave.actionDate &&
      !draftForSave.dueDate
    ) {
      setMessage('Choose when this item should appear in Today.')
      return
    }

    if (
      draftForSave.actionDate &&
      draftForSave.dueDate &&
      draftForSave.dueDate < draftForSave.actionDate
    ) {
      setMessage('The due date cannot be earlier than the scheduled date.')
      return
    }

    draftForSave.status = waitingOnSomeone
      ? 'waiting'
      : draftForSave.status === 'completed'
        ? 'completed'
        : 'needs-action'

    if (
      draftForSave.responsibility === 'unclear' &&
      !draftForSave.actionDate
    ) {
      draftForSave.actionDate = today
    }

    const normalized = normalizeTaskDraft(draftForSave)
    const existingTask = editingTaskId
      ? workspace.tasks.find((task) => task.id === editingTaskId)
      : undefined
    const savedTask: VaTask = editingTaskId
      ? {
          ...(existingTask ?? {
            id: editingTaskId,
            createdAt: now,
          }),
          ...normalized,
          id: editingTaskId,
          updatedAt: now,
          createdAt: existingTask?.createdAt ?? now,
        }
      : {
          ...normalized,
          id: createId(),
          createdAt: now,
          updatedAt: now,
        }

    const tasks = editingTaskId
      ? workspace.tasks.map((task) => (task.id === editingTaskId ? savedTask : task))
      : [savedTask, ...workspace.tasks]

    const placement = getTaskPlacement(savedTask, today)
    const dateSummary = getTaskDateSummary(savedTask)
    const successMessage = editingTaskId
      ? `Task updated. ${dateSummary} ${placement.message}`
      : `Task added. ${dateSummary} ${placement.message}`

    if (persist({ ...workspace, tasks }, successMessage)) {
      setTaskDraft({
        ...emptyTaskDraft,
        clientId: normalized.clientId,
      })
      setEditingTaskId(null)
      setFormPanel(null)
      setView(placement.view)
    }
  }

  function editTask(task: VaTask) {
    setTaskDraft({
      clientId: task.clientId,
      title: task.title,
      details: task.details,
      dueDate: task.dueDate,
      actionDate: task.actionDate,
      followUpDate: task.followUpDate,
      status: task.status,
      responsibility: task.responsibility,
    })
    setEditingTaskId(task.id)
    setFormPanel('task')
    setMessage(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function updateTaskStatus(taskId: string, status: VaTaskStatus) {
    if (status === 'waiting') {
      const task = workspace.tasks.find((item) => item.id === taskId)

      setWaitingTaskId(taskId)
      setWaitingCheckDate(
        task?.followUpDate || getSuggestedCheckDate(today),
      )
      setWaitingResponsibility(
        task && isWaitingResponsibility(task.responsibility)
          ? task.responsibility
          : 'client',
      )
      setMessage(null)
      return
    }

    const tasks = workspace.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status,
            responsibility:
              status === 'needs-action'
                ? ('va' as VaTaskResponsibility)
                : task.responsibility,
            actionDate:
              status === 'needs-action'
                ? today
                : task.actionDate,
            followUpDate:
              status === 'needs-action'
                ? ''
                : task.followUpDate,
            updatedAt: new Date().toISOString(),
          }
        : task,
    )

    const successMessage =
      status === 'completed'
        ? 'Task completed and moved to History.'
        : 'This task is now in Today.'

    persist({ ...workspace, tasks }, successMessage)

    if (status === 'needs-action') {
      setView('today')
    }
  }

  function confirmWaitingStatus(form?: HTMLFormElement) {
    if (!waitingTaskId) {
      return
    }

    const submittedDate = readFormDate(
      form ? new FormData(form) : null,
      'waitingCheckDate',
      waitingCheckDate,
    )

    if (!submittedDate) {
      setMessage('Choose when this task should return for follow-up.')
      return
    }

    const tasks = workspace.tasks.map((task) =>
      task.id === waitingTaskId
        ? {
            ...task,
            status: 'waiting' as VaTaskStatus,
            responsibility: waitingResponsibility,
            actionDate: '',
            followUpDate: submittedDate,
            updatedAt: new Date().toISOString(),
          }
        : task,
    )

    const returnsToday = submittedDate <= today
    const formattedDate = formatDateKey(submittedDate)

    persist(
      { ...workspace, tasks },
      returnsToday
        ? `Waiting status saved. This task is in Today because its check-in date is ${formattedDate}.`
        : `Waiting status saved. This task will return to Today on ${formattedDate}.`,
    )

    setWaitingTaskId(null)
    setWaitingCheckDate('')
    setWaitingResponsibility('client')
    setView(returnsToday ? 'today' : 'waiting')
  }

  function deleteTask(task: VaTask) {
    setDeletingTaskId(task.id)
    setMessage(null)
  }

  function confirmDeleteTask() {
    if (!deletingTaskId) {
      return
    }

    const task = workspace.tasks.find((item) => item.id === deletingTaskId)

    if (!task) {
      setDeletingTaskId(null)
      return
    }

    persist(
      {
        ...workspace,
        tasks: workspace.tasks.filter((item) => item.id !== deletingTaskId),
      },
      `Deleted "${task.title}".`,
    )

    if (editingTaskId === deletingTaskId) {
      setTaskDraft(emptyTaskDraft)
      setEditingTaskId(null)
    }

    setDeletingTaskId(null)
  }

  if (workspaceLoading) {
    return (
      <main className="va-page-shell">
        <div className="va-cloud-loading">
          <span aria-hidden="true" />
          <p>Loading your cloud workspace...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="va-page-shell">
      <header className="va-topbar">
        <a className="va-brand" href="/" onClick={(event) => {
          event.preventDefault()
          onNavigate('/')
        }}>
          <img
            className="whenisdue-brand-logo"
            src="/whenisdue-logo.png"
            alt="WhenIsDue"
          />
        </a>
        <nav className="va-topbar-actions va-workspace-utility-nav" aria-label="Workspace navigation">
          <span aria-current="page">VA Workspace</span>
          <details className="va-workspace-tools">
            <summary>Other tools</summary>
            <div>
              <a
                href="/typing"
                onClick={(event) => {
                  event.preventDefault()
                  onNavigate('/typing')
                }}
              >
                Typing Practice
              </a>
              <a
                href="/"
                onClick={(event) => {
                  event.preventDefault()
                  onNavigate('/')
                }}
              >
                Calculators
              </a>
            </div>
          </details>
        </nav>
      </header>

      {cloudIsEmpty && localHasRecords ? (
        <section className="va-import-banner">
          <div>
            <p className="va-eyebrow">Browser records found</p>
            <h2>Copy your existing records into this account.</h2>
            <p>
              {safeCount(localSnapshot.clients.length)} clients and{' '}
              {safeCount(localSnapshot.tasks.length)} tasks are available to import.
            </p>
          </div>
          <button
            className="va-primary-button"
            type="button"
            onClick={() => {
              void importBrowserRecords()
            }}
            disabled={importing}
          >
            {importing ? 'Importing...' : 'Import browser records'}
          </button>
        </section>
      ) : null}

      <section className="va-daily-header va-daily-header-compact">
        <div>
          <p className="va-eyebrow">{formatWorkspaceDate(today)}</p>
          <h1>{getViewTitle(view)}</h1>
          <p>{getDailySummary(view, todayCount, waitingCount, upcomingCount, completedCount)}</p>
        </div>
        <div className="va-daily-header-right">
          <section className="va-time-panel" aria-label="Local time comparison">
            <div className="va-time-card">
              <span>Your time</span>
              <strong>{formatClockTime(clockNow)}</strong>
              <small>{getLocalTimeZoneLabel()}</small>
            </div>

            <div className="va-time-card va-client-time-card">
              <span>Client time</span>

              {sortedClients.length > 0 ? (
                <>
                  <strong>
                    {selectedClockClient?.timeZone
                      ? formatClockTime(clockNow, selectedClockClient.timeZone)
                      : '—'}
                  </strong>

                  <label className="va-client-clock-select">
                    <span className="sr-only">Choose client clock</span>
                    <select
                      value={selectedClockClient?.id ?? ''}
                      onChange={(event) => setClockClientId(event.target.value)}
                    >
                      {sortedClients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.displayName}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedClockClient?.timeZone ? (
                    <small>
                      {getBusinessHourLabel(clockNow, selectedClockClient.timeZone)}
                    </small>
                  ) : (
                    <label className="va-inline-timezone-picker">
                      <span>Timezone not set</span>
                      <select
                        value=""
                        onChange={(event) => {
                          const timeZone = event.target.value

                          if (selectedClockClient && timeZone) {
                            saveClientTimeZone(selectedClockClient.id, timeZone)
                          }
                        }}
                      >
                        <option value="">Choose timezone</option>
                        {getSupportedTimeZones().map((timeZone) => (
                          <option key={timeZone} value={timeZone}>
                            {formatTimeZoneLabel(timeZone)}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </>
              ) : (
                <>
                  <strong>—</strong>
                  <small>Add a client first</small>
                </>
              )}
            </div>
          </section>

          <div className="va-daily-header-actions">
          {view === 'clients' ? (
            <button
              className="va-primary-button"
              type="button"
              onClick={() => {
                setEditingClientId(null)
                setClientDraft(emptyClientDraft)
                setFormPanel('client')
              }}
            >
              + Add client
            </button>
          ) : null}
          <button
            className={view === 'clients' ? 'va-secondary-button' : 'va-primary-button'}
            type="button"
            onClick={() => {
              setEditingTaskId(null)
              setTaskDraft({ ...emptyTaskDraft, actionDate: today })
              setFormPanel('task')
            }}
          >
            + Add task
          </button>
          </div>
        </div>
      </section>

      <section className="va-daily-work">
        {deletingTaskId ? (
          <div
            className="va-form-overlay"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setDeletingTaskId(null)
              }
            }}
          >
            <section
              className="va-form-drawer"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-task-dialog-title"
              aria-describedby="delete-task-dialog-description"
            >
              <div className="va-form-drawer-head">
                <div>
                  <p className="va-eyebrow">Confirm deletion</p>
                  <h2 id="delete-task-dialog-title">Delete this task permanently?</h2>
                </div>
                <button
                  className="va-drawer-close"
                  type="button"
                  aria-label="Close delete confirmation"
                  onClick={() => setDeletingTaskId(null)}
                >
                  ×
                </button>
              </div>

              <p id="delete-task-dialog-description">
                {workspace.tasks.find((task) => task.id === deletingTaskId)?.title ??
                  'This task'} will be removed from this account. This action cannot be undone.
              </p>

              <div className="va-form-actions">
                <button
                  className="va-delete-button"
                  type="button"
                  onClick={confirmDeleteTask}
                >
                  Delete permanently
                </button>
                <button
                  className="va-secondary-button"
                  type="button"
                  onClick={() => setDeletingTaskId(null)}
                >
                  Cancel
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {waitingTaskId ? (
          <div
            className="va-form-overlay"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setWaitingTaskId(null)
                setWaitingCheckDate('')
                setWaitingResponsibility('client')
              }
            }}
          >
            <section
              className="va-form-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="waiting-dialog-title"
            >
              <div className="va-form-drawer-head">
                <div>
                  <p className="va-eyebrow">Someone else owns the next step</p>
                  <h2 id="waiting-dialog-title">Who are you waiting for?</h2>
                </div>
                <button
                  className="va-drawer-close"
                  type="button"
                  aria-label="Close waiting dialog"
                  onClick={() => {
                    setWaitingTaskId(null)
                    setWaitingCheckDate('')
                    setWaitingResponsibility('client')
                  }}
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  confirmWaitingStatus(event.currentTarget)
                }}
              >
                <div className="va-form-fields">
                  <label>
                    <span>Waiting for *</span>
                    <select
                      value={waitingResponsibility}
                      onChange={(event) =>
                        setWaitingResponsibility(
                          event.target.value as VaTaskResponsibility,
                        )
                      }
                    >
                      <option value="client">The client</option>
                      <option value="third-party">Someone else</option>
                    </select>
                    <small>
                      Choose who currently owes the next action.
                    </small>
                  </label>

                  <label>
                    <span>Follow up on *</span>
                    <input
                      autoFocus
                      required
                      type="date"
                      name="waitingCheckDate"
                      min={today}
                      value={waitingCheckDate}
                      onChange={(event) => setWaitingCheckDate(event.target.value)}
                    />
                    <small>
                      The task will leave Today and return automatically on this date.
                    </small>
                  </label>
                </div>

                <div className="va-form-actions">
                  <button className="va-primary-button" type="submit" disabled={!waitingCheckDate}>
                    Save as Waiting
                  </button>
                  <button
                    className="va-secondary-button"
                    type="button"
                    onClick={() => {
                      setWaitingTaskId(null)
                      setWaitingCheckDate('')
                      setWaitingResponsibility('client')
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          </div>
        ) : null}

        {formPanel ? (
          <div
            className="va-form-overlay"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setFormPanel(null)
                setEditingTaskId(null)
                setEditingClientId(null)
              }
            }}
          >
            <section
              className="va-form-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="va-form-drawer-title"
            >
              <div className="va-form-drawer-head">
                <div>
                  <p className="va-eyebrow">
                    {formPanel === 'task'
                      ? editingTaskId
                        ? 'Editing task'
                        : 'Quick capture'
                      : editingClientId
                        ? 'Editing client'
                        : 'Client setup'}
                  </p>
                  <h2 id="va-form-drawer-title">
                    {formPanel === 'task'
                      ? editingTaskId
                        ? 'Update task'
                        : 'Add a task'
                      : editingClientId
                        ? 'Update client'
                        : 'Add a client'}
                  </h2>
                </div>
                <button
                  className="va-drawer-close"
                  type="button"
                  aria-label="Close form"
                  onClick={() => {
                    setFormPanel(null)
                    setEditingTaskId(null)
                    setEditingClientId(null)
                  }}
                >
                  ×
                </button>
              </div>

              {formPanel === 'task' ? (
                <>
                  <p className="va-task-form-intro">
                    Choose the client, write the task, and decide when you plan to work on it.
                  </p>
                  <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    saveTask(event.currentTarget)
                  }}
                >
                  <div className="va-form-fields">
                    <label>
                      <span>Client *</span>
                      <select
                        value={taskDraft.clientId}
                        onChange={(event) =>
                          setTaskDraft({ ...taskDraft, clientId: event.target.value })
                        }
                      >
                        <option value="">Choose a client</option>
                        {sortedClients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.displayName}
                          </option>
                        ))}
                      </select>
                      <button
                        className="va-secondary-button"
                        type="button"
                        onClick={() => {
                          setEditingClientId(null)
                          setClientDraft(emptyClientDraft)
                          setFormPanel('client')
                        }}
                      >
                        + Add a new client
                      </button>
                    </label>

                    <label>
                      <span>Task *</span>
                      <input
                        autoFocus
                        maxLength={taskTitleMaxLength}
                        placeholder="Example: Confirm Friday appointment"
                        value={taskDraft.title}
                        onChange={(event) =>
                          setTaskDraft({ ...taskDraft, title: event.target.value })
                        }
                      />
                    </label>

                    <label>
                      <span>Who needs to act next? *</span>
                      <select
                        value={taskDraft.responsibility}
                        onChange={(event) => {
                          const responsibility =
                            event.target.value as VaTaskResponsibility
                          const waiting = isWaitingResponsibility(responsibility)

                          setTaskDraft({
                            ...taskDraft,
                            responsibility,
                            status: waiting ? 'waiting' : 'needs-action',
                            actionDate: waiting ? '' : taskDraft.actionDate || today,
                            followUpDate: waiting
                              ? taskDraft.followUpDate || getSuggestedCheckDate(today)
                              : '',
                          })
                        }}
                      >
                        <option value="va">I need to do this</option>
                        <option value="client">The client needs to respond</option>
                        <option value="third-party">
                          Another person or company needs to respond
                        </option>
                        <option value="unclear">
                          I’m not sure who needs to act next
                        </option>
                      </select>
                      <small>
                        This decides whether the item stays active or moves to Waiting.
                      </small>
                    </label>

                    <div className="va-date-grid">
                      {isWaitingResponsibility(taskDraft.responsibility) ? (
                        <label>
                          <span>Check back on *</span>
                          <input
                            type="date"
                            name="followUpDate"
                            min={today}
                            value={taskDraft.followUpDate}
                            onInput={(event) => {
                              const value = event.currentTarget.value
                              setTaskDraft((current) => ({
                                ...current,
                                followUpDate: value,
                              }))
                            }}
                            onChange={(event) => {
                              const value = event.currentTarget.value
                              setTaskDraft((current) => ({
                                ...current,
                                followUpDate: value,
                              }))
                            }}
                          />
                          <small>
                            Choose when to check this again.
                          </small>
                        </label>
                      ) : (
                        <label>
                          <span>Do this on *</span>
                          <input
                            type="date"
                            name="actionDate"
                            value={taskDraft.actionDate}
                            onInput={(event) => {
                              const value = event.currentTarget.value
                              setTaskDraft((current) => ({
                                ...current,
                                actionDate: value,
                              }))
                            }}
                            onChange={(event) => {
                              const value = event.currentTarget.value
                              setTaskDraft((current) => ({
                                ...current,
                                actionDate: value,
                              }))
                            }}
                          />
                          <small>
                            Choose when you plan to do this.
                          </small>
                        </label>
                      )}
                    </div>

                    <details className="va-task-optional-details">
                      <summary>Optional details</summary>
                      <div className="va-task-optional-body">
                        <label>
                          <span>Due date</span>
                          <input
                            type="date"
                            name="dueDate"
                            value={taskDraft.dueDate}
                            onInput={(event) => {
                              const value = event.currentTarget.value
                              setTaskDraft((current) => ({
                                ...current,
                                dueDate: value,
                              }))
                            }}
                            onChange={(event) => {
                              const value = event.currentTarget.value
                              setTaskDraft((current) => ({
                                ...current,
                                dueDate: value,
                              }))
                            }}
                          />
                          <small>The final deadline for this task.</small>
                        </label>

                        <label>
                          <span>Notes</span>
                          <textarea
                            maxLength={taskDetailsMaxLength}
                            placeholder="Add a confirmation number, instructions, or other useful details"
                            value={taskDraft.details}
                            onChange={(event) =>
                              setTaskDraft({ ...taskDraft, details: event.target.value })
                            }
                          />
                          <small>
                            {safeCount(taskDraft.details.length)} / {taskDetailsMaxLength}
                          </small>
                        </label>
                      </div>
                    </details>
                  </div>

                  <div className="va-form-actions">
                    <button
                      className="va-primary-button"
                      type="submit"
                      disabled={!canSaveTask}
                    >
                      {editingTaskId ? 'Save changes' : 'Add task'}
                    </button>
                    <button
                      className="va-secondary-button"
                      type="button"
                      onClick={() => {
                        setFormPanel(null)
                        setEditingTaskId(null)
                        setTaskDraft(emptyTaskDraft)
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                  </form>
                </>
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    saveClient()
                  }}
                >
                  <div className="va-form-fields">
                    <label>
                      <span>Client or household name *</span>
                      <input
                        autoFocus
                        maxLength={nameMaxLength}
                        value={clientDraft.displayName}
                        onChange={(event) =>
                          setClientDraft({
                            ...clientDraft,
                            displayName: event.target.value,
                          })
                        }
                      />
                    </label>

                    <div className="va-two-column-fields">
                      <label>
                        <span>Email</span>
                        <input
                          type="email"
                          value={clientDraft.email}
                          onChange={(event) =>
                            setClientDraft({ ...clientDraft, email: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        <span>Phone</span>
                        <input
                          type="tel"
                          value={clientDraft.phone}
                          onChange={(event) =>
                            setClientDraft({ ...clientDraft, phone: event.target.value })
                          }
                        />
                      </label>
                    </div>

                    <label>
                      <span>Service type</span>
                      <input
                        value={clientDraft.serviceType}
                        onChange={(event) =>
                          setClientDraft({
                            ...clientDraft,
                            serviceType: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label>
                      <span>Client timezone</span>
                      <select
                        value={clientDraft.timeZone}
                        onChange={(event) =>
                          setClientDraft({
                            ...clientDraft,
                            timeZone: event.target.value,
                          })
                        }
                      >
                        <option value="">Not set</option>
                        {getSupportedTimeZones().map((timeZone) => (
                          <option key={timeZone} value={timeZone}>
                            {formatTimeZoneLabel(timeZone)}
                          </option>
                        ))}
                      </select>
                      <small>
                        Used to show the client’s current local time.
                      </small>
                    </label>

                    <label>
                      <span>Notes</span>
                      <textarea
                        maxLength={notesMaxLength}
                        value={clientDraft.notes}
                        onChange={(event) =>
                          setClientDraft({ ...clientDraft, notes: event.target.value })
                        }
                      />
                    </label>
                  </div>

                  <div className="va-form-actions">
                    <button
                      className="va-primary-button"
                      type="submit"
                      disabled={!canSaveClient}
                    >
                      {editingClientId ? 'Save client changes' : 'Add client'}
                    </button>
                    <button
                      className="va-secondary-button"
                      type="button"
                      onClick={() => {
                        setFormPanel(null)
                        setEditingClientId(null)
                        setClientDraft(emptyClientDraft)
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        ) : null}

        <section className="va-panel va-main-panel">
          {view !== 'today' ? (
            <div className="va-section-heading va-list-heading">
              <div>
                <p className="va-eyebrow">{getViewEyebrow(view)}</p>
                <h2>{getViewTitle(view)}</h2>
                <p>{getViewDescription(view)}</p>
              </div>
              <span className="va-directory-count">
                {safeCount(view === 'clients' ? sortedClients.length : visibleTasks.length)}
              </span>
            </div>
          ) : null}

          {view === 'clients' ? (
            sortedClients.length > 0 ? (
              <div className="va-client-list">
                {sortedClients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    tasks={workspace.tasks.filter(
                      (task) => task.clientId === client.id,
                    )}
                    today={today}
                    onEdit={editClient}
                    onToggle={toggleClient}
                    onDelete={deleteClient}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No clients yet"
                message="Add the first client you manage. Then keep their tasks, deadlines, and follow-ups together."
              />
            )
          ) : visibleTasks.length > 0 ? (
            view === 'waiting' ? (
              <div className="va-waiting-groups">
                {waitingGroups.map((group) => (
                  <section
                    className={`va-waiting-group group-${group.key}`}
                    key={group.key}
                    aria-labelledby={`waiting-group-${group.key}`}
                  >
                    <div className="va-waiting-group-heading">
                      <div>
                        <h3 id={`waiting-group-${group.key}`}>{group.label}</h3>
                        <p>{group.description}</p>
                      </div>
                      <span>{safeCount(group.tasks.length)}</span>
                    </div>

                    <div className="va-task-list">
                      {group.tasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          client={workspace.clients.find(
                            (client) => client.id === task.clientId,
                          )}
                          today={today}
                          currentView={view}
                          onEdit={editTask}
                          onStatusChange={updateTaskStatus}
                          onDelete={deleteTask}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="va-task-list">
                {visibleTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    client={workspace.clients.find(
                      (client) => client.id === task.clientId,
                    )}
                    today={today}
                    currentView={view}
                    onEdit={editTask}
                    onStatusChange={updateTaskStatus}
                    onDelete={deleteTask}
                  />
                ))}
              </div>
            )
          ) : (
            <EmptyState
              title={`Nothing in ${getViewTitle(view).toLowerCase()}`}
              message={
                view === 'today'
                  ? 'You’re clear for today. Review upcoming work or add the next task that needs attention.'
                  : 'Tasks will appear here automatically based on their dates and status.'
              }
            />
          )}
        </section>
      </section>

      {view === 'today' ? (
        <details className="va-close-day-panel">
          <summary>
            <div>
              <p className="va-eyebrow">End-of-day check</p>
              <h2>Close the day</h2>
              <p>Review what is finished and what still needs a clear next step.</p>
            </div>
            <span>Review</span>
          </summary>

          <div className="va-close-day-body">
            <div className="va-close-day-grid">
              <article>
                <span>Completed today</span>
                <strong>{safeCount(completedTodayCount)}</strong>
              </article>
              <article>
                <span>Still open</span>
                <strong>{safeCount(stillOpenCount)}</strong>
              </article>
              <article>
                <span>Waiting on others</span>
                <strong>{safeCount(waitingOnOthersCount)}</strong>
              </article>
              <article>
                <span>Returning tomorrow</span>
                <strong>{safeCount(returningTomorrowCount)}</strong>
              </article>
              <article>
                <span>Deadlines in 7 days</span>
                <strong>{safeCount(upcomingDeadlineCount)}</strong>
              </article>
              <article className={unclearCount > 0 ? 'needs-attention' : ''}>
                <span>Needs clarification</span>
                <strong>{safeCount(unclearCount)}</strong>
              </article>
            </div>

            <p className="va-close-day-note">
              Before signing off, make sure every open item is either planned,
              waiting on someone, or clearly marked for clarification.
            </p>
          </div>
        </details>
      ) : null}

      <nav className="va-compact-tabs" aria-label="Workspace views">
        <ViewButton label="Today" viewName="today" currentView={view} setView={setView} count={todayCount} />
        <ViewButton label="Waiting" viewName="waiting" currentView={view} setView={setView} count={waitingCount} />
        <ViewButton label="Clients" viewName="clients" currentView={view} setView={setView} count={activeClients} />
        <ViewButton label="Later" viewName="upcoming" currentView={view} setView={setView} count={upcomingCount} />
        <ViewButton label="History" viewName="completed" currentView={view} setView={setView} count={completedCount} />
      </nav>

      <details className="va-backup-panel">
        <summary>
          <div>
            <p className="va-eyebrow">Portable backup</p>
            <h2>Backup and restore</h2>
            <p>Download a copy of your clients and tasks, or restore a previous backup.</p>
          </div>
          <span>Open tools</span>
        </summary>

        <div className="va-backup-body">
          <p className="va-backup-privacy">
            Backup files include clients and tasks only. Passwords and account credentials are never included.
          </p>

          <div className="va-backup-controls">
            <button
              className="va-secondary-button"
              type="button"
              onClick={downloadBackup}
              disabled={restoring}
            >
              Download backup
            </button>

            <label className="va-restore-mode">
              <span>Restore method</span>
              <select
                value={restoreMode}
                onChange={(event) => {
                  const nextMode = event.target.value as 'merge' | 'replace'
                  setRestoreMode(nextMode)
                  setReplaceConfirmation('')
                }}
                disabled={restoring}
              >
                <option value="merge">Merge with current records</option>
                <option value="replace">Replace current records</option>
              </select>
            </label>

            {restoreMode === 'replace' ? (
              <label className="va-replace-confirmation">
                <span>Type REPLACE to continue</span>
                <input
                  value={replaceConfirmation}
                  onChange={(event) =>
                    setReplaceConfirmation(event.target.value.toUpperCase())
                  }
                  placeholder="REPLACE"
                  autoComplete="off"
                  disabled={restoring}
                />
                <small>
                  Replace permanently removes the current workspace before importing the backup.
                </small>
              </label>
            ) : null}

            <button
              className={
                restoreMode === 'replace'
                  ? 'va-destructive-restore-button'
                  : 'va-primary-button'
              }
              type="button"
              onClick={() => restoreInputRef.current?.click()}
              disabled={
                restoring ||
                (restoreMode === 'replace' &&
                  replaceConfirmation !== 'REPLACE')
              }
            >
              {restoring
                ? 'Restoring...'
                : restoreMode === 'replace'
                  ? 'Replace workspace'
                  : 'Restore backup'}
            </button>

            <input
              ref={restoreInputRef}
              className="va-hidden-file-input"
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                const file = event.target.files?.[0]

                if (file) {
                  void restoreBackup(file)
                }
              }}
            />
          </div>
        </div>
      </details>

      <section
        className={`va-sync-status va-sync-${syncStatus}`}
        aria-live="polite"
        aria-label="Cloud synchronization status"
      >
        <span aria-hidden="true" />
        <div>
          <strong>
            {syncStatus === 'saving'
              ? 'Saving to cloud'
              : syncStatus === 'saved'
                ? 'Cloud copy verified'
                : syncStatus === 'error'
                  ? 'Cloud sync needs attention'
                  : 'Cloud sync ready'}
          </strong>
          <small>
            {syncStatus === 'saving'
              ? 'Keep this tab open until saving finishes.'
              : syncStatus === 'saved'
                ? 'The server copy matches the dates and statuses shown here.'
                : syncStatus === 'error'
                  ? syncError ?? 'The last change is still saved in this browser.'
                  : 'Changes will be verified after every save.'}
          </small>
        </div>
        {syncStatus === 'error' && failedWorkspace ? (
          <button className="va-secondary-button" type="button" onClick={retryCloudSync}>
            Retry sync
          </button>
        ) : null}
      </section>

      {message ? <p className="va-global-message" aria-live="polite">{message}</p> : null}
    </main>
  )
}


function ViewButton({
  label,
  viewName,
  currentView,
  setView,
  count,
}: {
  label: string
  viewName: WorkspaceView
  currentView: WorkspaceView
  setView: (view: WorkspaceView) => void
  count: number
}) {
  return (
    <button className={currentView === viewName ? 'is-selected' : ''} type="button" aria-current={currentView === viewName ? 'page' : undefined} onClick={() => setView(viewName)}>
      <span>{label}</span><b>{safeCount(count)}</b>
    </button>
  )
}

function ClientCard({
  client,
  tasks,
  today,
  onEdit,
  onToggle,
  onDelete,
}: {
  client: VaClient
  tasks: VaTask[]
  today: string
  onEdit: (client: VaClient) => void
  onToggle: (id: string) => void
  onDelete: (client: VaClient) => void
}) {
  const openTasks = tasks.filter((task) => task.status !== 'completed')
  const activeCount = openTasks.filter(
    (task) => task.status === 'needs-action',
  ).length
  const waitingCount = openTasks.filter(
    (task) => task.status === 'waiting',
  ).length
  const overdueCount = openTasks.filter(
    (task) =>
      Boolean(
        (task.dueDate && task.dueDate < today) ||
          (task.status === 'waiting' &&
            task.followUpDate &&
            task.followUpDate < today) ||
          (task.status !== 'waiting' &&
            task.actionDate &&
            task.actionDate < today),
      ),
  ).length
  const nextDeadline = openTasks
    .map((task) => task.dueDate)
    .filter(Boolean)
    .sort()[0]

  return (
    <article className={`va-client-card ${client.active ? '' : 'is-inactive'}`}>
      <div className="va-client-card-top">
        <span className="va-client-avatar">{getInitials(client.displayName)}</span>
        <div>
          <div className="va-client-title-row">
            <h3>{client.displayName}</h3>
            <span className={client.active ? 'is-active' : 'is-paused'}>
              {client.active ? 'Active' : 'Paused'}
            </span>
          </div>
          <p>
            {client.serviceType || 'Service type not added'}
            {client.timeZone ? ` · ${formatTimeZoneLabel(client.timeZone)}` : ''}
            {' · '}
            {safeCount(openTasks.length)}{' '}
            {openTasks.length === 1 ? 'open task' : 'open tasks'}
          </p>
        </div>
      </div>

      <dl className="va-client-work-summary" aria-label={`${client.displayName} work summary`}>
        <div className={overdueCount > 0 ? 'has-overdue' : ''}>
          <dt>Overdue</dt>
          <dd>{safeCount(overdueCount)}</dd>
        </div>
        <div>
          <dt>Active</dt>
          <dd>{safeCount(activeCount)}</dd>
        </div>
        <div>
          <dt>Waiting</dt>
          <dd>{safeCount(waitingCount)}</dd>
        </div>
        <div className="va-client-next-deadline">
          <dt>Next deadline</dt>
          <dd>{nextDeadline ? formatDateKey(nextDeadline) : 'None'}</dd>
        </div>
      </dl>

      <div className="va-client-actions">
        <button type="button" onClick={() => onEdit(client)}>Edit</button>
        <button type="button" onClick={() => onToggle(client.id)}>
          {client.active ? 'Pause' : 'Activate'}
        </button>
        <button
          className="va-delete-button"
          type="button"
          onClick={() => onDelete(client)}
        >
          Delete
        </button>
      </div>
    </article>
  )
}

function TaskCard({
  task,
  client,
  today,
  currentView,
  onEdit,
  onStatusChange,
  onDelete,
}: {
  task: VaTask
  client: VaClient | undefined
  today: string
  currentView: WorkspaceView
  onEdit: (task: VaTask) => void
  onStatusChange: (id: string, status: VaTaskStatus) => void
  onDelete: (task: VaTask) => void
}) {
  const reason = getTaskPriorityReason(task, today)
  const relevantDate = getRelevantTaskDate(task, today)

  return (
    <article className={`va-task-card va-task-card-simplified status-${task.status} ${reason.kind === 'overdue' ? 'is-overdue' : ''}`}>
      <p className={`va-task-reason reason-${reason.kind}`}>{reason.label}</p>

      <div className="va-task-card-head">
        <div>
          <h3>{task.title}</h3>
          <p className="va-task-client">{client?.displayName ?? 'Unknown client'}</p>
          <p
            className={`va-task-responsibility responsibility-${task.responsibility}`}
          >
            {getResponsibilityLabel(task.responsibility)}
          </p>
        </div>

        <div className="va-task-date-stack">
          {relevantDate ? (
            <span className="va-task-relevant-date">{relevantDate}</span>
          ) : null}

          {task.dueDate ? (
            <span
              className={`va-task-final-deadline ${
                task.status !== 'completed' && task.dueDate < today
                  ? 'is-overdue'
                  : ''
              }`}
            >
              Final deadline {formatDateKey(task.dueDate)}
            </span>
          ) : null}
        </div>
      </div>

      {task.details ? (
        <details className="va-task-details-disclosure">
          <summary>View notes</summary>
          <p>{task.details}</p>
        </details>
      ) : null}

      <div className="va-task-actions va-task-outcomes">
        {currentView === 'completed' ? (
          <button
            className="va-restore-button"
            type="button"
            onClick={() => onStatusChange(task.id, 'needs-action')}
          >
            Restore
          </button>
        ) : task.status === 'waiting' ? (
          <>
            <button
              className="va-needs-action-button va-task-primary-action"
              type="button"
              onClick={() => onStatusChange(task.id, 'needs-action')}
            >
              Move to Today
            </button>
            <button
              className="va-complete-button va-task-secondary-action"
              type="button"
              onClick={() => onStatusChange(task.id, 'completed')}
            >
              Done
            </button>
          </>
        ) : (
          <>
            <button
              className="va-complete-button va-task-primary-action"
              type="button"
              onClick={() => onStatusChange(task.id, 'completed')}
            >
              Done
            </button>
            <button
              className="va-waiting-button va-task-secondary-action"
              type="button"
              onClick={() => onStatusChange(task.id, 'waiting')}
            >
              Wait for reply
            </button>
          </>
        )}

        <button
          className="va-task-text-button"
          type="button"
          onClick={() => onEdit(task)}
        >
          Edit
        </button>
        <button
          className="va-delete-button va-task-text-button"
          type="button"
          onClick={() => onDelete(task)}
        >
          {currentView === 'completed' ? 'Delete permanently' : 'Delete'}
        </button>
      </div>
    </article>
  )
}

function getTaskPriorityReason(
  task: VaTask,
  today: string,
): {
  label: string
  kind: 'overdue' | 'today' | 'waiting' | 'later' | 'done'
} {
  if (task.status === 'completed') {
    return { label: 'Completed', kind: 'done' }
  }

  if (task.status === 'waiting') {
    if (task.followUpDate && task.followUpDate < today) {
      const daysOverdue = daysBetweenKeys(
        task.followUpDate,
        today,
      )

      return {
        label: `Follow-up overdue by ${daysOverdue} ${
          daysOverdue === 1 ? 'day' : 'days'
        }`,
        kind: 'overdue',
      }
    }

    if (task.followUpDate === today) {
      return {
        label: 'Check back today',
        kind: 'today',
      }
    }

    return {
      label:
        task.responsibility === 'third-party'
          ? 'Waiting for someone else'
          : 'Waiting for the client',
      kind: 'waiting',
    }
  }

  if (task.dueDate && task.dueDate < today) {
    const daysOverdue = daysBetweenKeys(
      task.dueDate,
      today,
    )

    return {
      label: `Deadline overdue by ${daysOverdue} ${
        daysOverdue === 1 ? 'day' : 'days'
      }`,
      kind: 'overdue',
    }
  }

  if (task.followUpDate && task.followUpDate < today) {
    const daysOverdue = daysBetweenKeys(
      task.followUpDate,
      today,
    )

    return {
      label: `Follow-up overdue by ${daysOverdue} ${
        daysOverdue === 1 ? 'day' : 'days'
      }`,
      kind: 'overdue',
    }
  }

  if (task.actionDate && task.actionDate < today) {
    const daysOverdue = daysBetweenKeys(
      task.actionDate,
      today,
    )

    return {
      label: `Planned action overdue by ${daysOverdue} ${
        daysOverdue === 1 ? 'day' : 'days'
      }`,
      kind: 'overdue',
    }
  }

  if (task.dueDate === today) {
    return { label: 'Deadline today', kind: 'today' }
  }

  if (task.followUpDate === today) {
    return { label: 'Check back today', kind: 'today' }
  }

  if (task.actionDate === today) {
    return { label: 'Planned for today', kind: 'today' }
  }

  return { label: 'Later', kind: 'later' }
}

function getRelevantTaskDate(
  task: VaTask,
  today: string,
): string | null {
  if (task.status === 'waiting') {
    return task.followUpDate
      ? `Check back ${formatDateKey(task.followUpDate)}`
      : null
  }

  const reason = getTaskPriorityReason(task, today)

  if (
    reason.label.startsWith('Deadline') &&
    task.dueDate
  ) {
    return `Due ${formatDateKey(task.dueDate)}`
  }

  if (
    reason.label.includes('Follow') &&
    task.followUpDate
  ) {
    return `Check back ${formatDateKey(task.followUpDate)}`
  }

  if (task.actionDate) {
    return `Work on ${formatDateKey(task.actionDate)}`
  }

  if (task.dueDate) {
    return `Due ${formatDateKey(task.dueDate)}`
  }

  if (task.followUpDate) {
    return `Check back ${formatDateKey(task.followUpDate)}`
  }

  return null
}

function daysBetweenKeys(start: string, end: string): number {
  const startDate = new Date(`${start}T00:00:00Z`)
  const endDate = new Date(`${end}T00:00:00Z`)
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000))
}

function EmptyState({
  title,
  message,
  action,
}: {
  title: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
}) {
  return (
    <div className="va-empty-state">
      <span>＋</span>
      <h3>{title}</h3>
      <p>{message}</p>

      {action ? (
        <button
          className="va-secondary-button"
          type="button"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      ) : null}
    </div>
  )
}

type WaitingGroup = {
  key: 'soon' | 'week' | 'later' | 'missing'
  label: string
  description: string
  tasks: VaTask[]
}

function groupWaitingTasks(
  tasks: VaTask[],
  today: string,
): WaitingGroup[] {
  const inThreeDays = getRelativeDateKey(today, 3)
  const inSevenDays = getRelativeDateKey(today, 7)

  const groups: WaitingGroup[] = [
    {
      key: 'soon',
      label: 'Follow up soon',
      description: 'Returning within the next 3 days.',
      tasks: [],
    },
    {
      key: 'week',
      label: 'Later this week',
      description: 'Returning 4 to 7 days from now.',
      tasks: [],
    },
    {
      key: 'later',
      label: 'Later',
      description: 'Returning more than a week from now.',
      tasks: [],
    },
    {
      key: 'missing',
      label: 'No check-back date',
      description: 'These items need a follow-up date before they can return automatically.',
      tasks: [],
    },
  ]

  for (const task of tasks) {
    if (!task.followUpDate) {
      groups[3].tasks.push(task)
    } else if (task.followUpDate <= inThreeDays) {
      groups[0].tasks.push(task)
    } else if (task.followUpDate <= inSevenDays) {
      groups[1].tasks.push(task)
    } else {
      groups[2].tasks.push(task)
    }
  }

  return groups.filter((group) => group.tasks.length > 0)
}

function filterTasksForView(tasks: VaTask[], view: WorkspaceView, today: string): VaTask[] {
  if (view === 'clients') return []
  if (view === 'waiting') return tasks.filter((task) => task.status === 'waiting' && (!task.followUpDate || task.followUpDate > today))
  if (view === 'completed') return tasks.filter((task) => task.status === 'completed')
  if (view === 'follow-up') return tasks.filter((task) => task.status !== 'completed' && Boolean(task.followUpDate && task.followUpDate <= today))
  if (view === 'today' || view === 'overdue') {
    return tasks.filter((task) => {
      if (task.status === 'completed') return false
      if (task.status === 'waiting') return Boolean(task.followUpDate && task.followUpDate <= today)
      return Boolean(
        (task.actionDate && task.actionDate <= today) ||
        (task.dueDate && task.dueDate <= today) ||
        (task.followUpDate && task.followUpDate <= today)
      )
    })
  }
  return tasks.filter((task) => {
    if (
      task.status === 'completed' ||
      task.status === 'waiting'
    ) {
      return false
    }

    const belongsInToday = Boolean(
      (task.actionDate && task.actionDate <= today) ||
        (task.dueDate && task.dueDate <= today) ||
        (task.followUpDate &&
          task.followUpDate <= today),
    )

    if (belongsInToday) {
      return false
    }

    const nextDate = getPrimaryTaskDate(task)

    return Boolean(nextDate && nextDate > today)
  })
}

function getPrimaryTaskDate(task: VaTask): string {
  return task.actionDate || task.dueDate || task.followUpDate
}

function getTaskPriorityRank(task: VaTask, today: string): number {
  if (task.status === 'completed') return 99
  if (task.dueDate && task.dueDate < today) return 1
  if (task.followUpDate && task.followUpDate < today) return 2
  if (task.dueDate === today) return 3
  if (task.followUpDate === today) return 4
  if (task.actionDate && task.actionDate <= today) return 5
  if (task.status === 'waiting') return 20
  return 30
}

function compareTasksForView(first: VaTask, second: VaTask, view: WorkspaceView, today: string): number {
  if (view === 'today' || view === 'overdue' || view === 'follow-up') {
    const rankDifference = getTaskPriorityRank(first, today) - getTaskPriorityRank(second, today)
    if (rankDifference !== 0) return rankDifference
  }

  if (first.status === 'completed' && second.status === 'completed') {
    return second.updatedAt.localeCompare(first.updatedAt)
  }

  const firstDate = getPrimaryTaskDate(first) || '9999-12-31'
  const secondDate = getPrimaryTaskDate(second) || '9999-12-31'
  if (firstDate !== secondDate) return firstDate.localeCompare(secondDate)
  return second.updatedAt.localeCompare(first.updatedAt)
}

function readFormDate(
  formData: FormData | null,
  fieldName: string,
  fallback: string,
): string {
  const submitted = formData?.get(fieldName)

  if (typeof submitted !== 'string') {
    return fallback
  }

  return isDateKey(submitted) ? submitted : ''
}

function getTaskDateSummary(task: VaTask): string {
  const parts: string[] = []

  if (task.actionDate) {
    parts.push(`Show in Today: ${formatDateKey(task.actionDate)}.`)
  }

  if (task.dueDate) {
    parts.push(`Deadline: ${formatDateKey(task.dueDate)}.`)
  }

  if (task.followUpDate) {
    parts.push(`Check again: ${formatDateKey(task.followUpDate)}.`)
  }

  return parts.length > 0 ? parts.join(' ') : 'No dates were saved.'
}

function workspacesMatch(
  expected: VaWorkspaceData,
  actual: VaWorkspaceData,
): boolean {
  if (
    expected.clients.length !== actual.clients.length ||
    expected.tasks.length !== actual.tasks.length
  ) {
    return false
  }

  const expectedClients = [...expected.clients].sort((a, b) => a.id.localeCompare(b.id))
  const actualClients = [...actual.clients].sort((a, b) => a.id.localeCompare(b.id))
  const expectedTasks = [...expected.tasks].sort((a, b) => a.id.localeCompare(b.id))
  const actualTasks = [...actual.tasks].sort((a, b) => a.id.localeCompare(b.id))

  const clientsMatch = expectedClients.every((client, index) => {
    const cloudClient = actualClients[index]

    return Boolean(
      cloudClient &&
        client.id === cloudClient.id &&
        client.displayName === cloudClient.displayName &&
        client.contactName === cloudClient.contactName &&
        client.email === cloudClient.email &&
        client.phone === cloudClient.phone &&
        client.serviceType === cloudClient.serviceType &&
        client.timeZone === cloudClient.timeZone &&
        client.notes === cloudClient.notes &&
        client.active === cloudClient.active,
    )
  })

  const tasksMatch = expectedTasks.every((task, index) => {
    const cloudTask = actualTasks[index]

    return Boolean(
      cloudTask &&
        task.id === cloudTask.id &&
        task.clientId === cloudTask.clientId &&
        task.title === cloudTask.title &&
        task.details === cloudTask.details &&
        task.dueDate === cloudTask.dueDate &&
        task.actionDate === cloudTask.actionDate &&
        task.followUpDate === cloudTask.followUpDate &&
        task.status === cloudTask.status &&
        task.responsibility === cloudTask.responsibility,
    )
  })

  return clientsMatch && tasksMatch
}

function getRelativeDateKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function getLocalDateKeyFromIso(value: string): string {
  const date = new Date(value)

  if (!Number.isFinite(date.getTime())) {
    return ''
  }

  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getSuggestedCheckDate(today: string): string {
  const date = new Date(`${today}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

function getTaskPlacement(
  task: VaTask,
  today: string,
): { view: WorkspaceView; message: string } {
  if (task.status === 'completed') {
    return { view: 'completed', message: 'It is now in History.' }
  }

  if (task.status === 'waiting') {
    if (task.followUpDate && task.followUpDate <= today) {
      return {
        view: 'today',
        message: `${getTaskPriorityReason(task, today).label}. It now appears in Today.`,
      }
    }

    if (task.followUpDate) {
      return {
        view: 'waiting',
        message: `It is waiting and will return to Today on ${formatDateKey(task.followUpDate)}.`,
      }
    }

    return {
      view: 'waiting',
      message: 'It is in Waiting without a check-in date.',
    }
  }

  const appearsToday = Boolean(
    (task.actionDate && task.actionDate <= today) ||
      (task.dueDate && task.dueDate <= today) ||
      (task.followUpDate && task.followUpDate <= today),
  )

  if (appearsToday) {
    return {
      view: 'today',
      message: `${getTaskPriorityReason(task, today).label}. It now appears in Today.`,
    }
  }

  return {
    view: 'upcoming',
    message: 'It is scheduled for Later.',
  }
}

let cachedTimeZones: string[] | null = null

function getSupportedTimeZones(): string[] {
  if (cachedTimeZones) {
    return cachedTimeZones
  }

  const fallback = [
    'America/Los_Angeles',
    'America/Denver',
    'America/Chicago',
    'America/New_York',
    'America/Toronto',
    'Europe/London',
    'Asia/Dubai',
    'Asia/Manila',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Perth',
    'Australia/Brisbane',
    'Australia/Sydney',
    'Pacific/Auckland',
  ]

  const supportedValuesOf = (
    Intl as typeof Intl & {
      supportedValuesOf?: (key: 'timeZone') => string[]
    }
  ).supportedValuesOf

  cachedTimeZones =
    typeof supportedValuesOf === 'function'
      ? supportedValuesOf('timeZone')
      : fallback

  return cachedTimeZones
}

function formatTimeZoneLabel(timeZone: string): string {
  return timeZone.replaceAll('_', ' ')
}

function formatClockTime(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(date)
}

function getLocalTimeZoneLabel(): string {
  return (
    Intl.DateTimeFormat().resolvedOptions().timeZone
      ?.replaceAll('_', ' ') || 'Local time'
  )
}

function getBusinessHourLabel(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).formatToParts(date)
  const hour = Number(parts.find((part) => part.type === 'hour')?.value)

  return Number.isFinite(hour) && hour >= 8 && hour < 18
    ? 'Good time to call'
    : 'Outside business hours'
}

function formatWorkspaceDate(today: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${today}T00:00:00Z`))
}

function getDailySummary(view: WorkspaceView, todayCount: number, waitingCount: number, upcomingCount: number, completedCount: number): string {
  if (view === 'today') return todayCount === 0 ? 'You’re caught up. Nothing needs your attention right now.' : `${safeCount(todayCount)} ${todayCount === 1 ? 'item needs' : 'items need'} your attention.`
  if (view === 'waiting') return waitingCount === 0 ? 'No items are waiting.' : `${safeCount(waitingCount)} ${waitingCount === 1 ? 'item is' : 'items are'} waiting on someone else.`
  if (view === 'upcoming') return upcomingCount === 0 ? 'Nothing is scheduled for later.' : `${safeCount(upcomingCount)} ${upcomingCount === 1 ? 'item is' : 'items are'} scheduled for later.`
  if (view === 'completed') return `${safeCount(completedCount)} completed ${completedCount === 1 ? 'item' : 'items'} in your history.`
  if (view === 'clients') return 'Keep client details and their work together.'
  return 'Review the items in this view.'
}

function compareClients(first: VaClient, second: VaClient): number {
  if (first.active !== second.active) return first.active ? -1 : 1
  return first.displayName.localeCompare(second.displayName, undefined, { sensitivity: 'base' })
}

function normalizeClientDraft(draft: VaClientDraft): VaClientDraft {
  return {
    displayName: draft.displayName.trim(),
    contactName: draft.contactName.trim(),
    email: draft.email.trim(),
    phone: draft.phone.trim(),
    serviceType: draft.serviceType.trim(),
    timeZone: draft.timeZone.trim(),
    notes: draft.notes.trim(),
    active: draft.active,
  }
}

function normalizeTaskDraft(draft: VaTaskDraft): VaTaskDraft {
  return {
    clientId: draft.clientId.trim(),
    title: draft.title.trim(),
    details: draft.details.trim(),
    dueDate: draft.dueDate,
    actionDate: draft.actionDate,
    followUpDate: draft.followUpDate,
    status: draft.status,
    responsibility: draft.responsibility,
  }
}

function getViewEyebrow(view: WorkspaceView): string {
  return view === 'clients' ? 'Client directory' : 'Task view'
}

function getViewTitle(view: WorkspaceView): string {
  const labels: Record<WorkspaceView, string> = {
    clients: 'Your clients',
    today: 'Today',
    'follow-up': 'Follow-ups due',
    waiting: 'Waiting on others',
    upcoming: 'Upcoming',
    overdue: 'Overdue',
    completed: 'Completed',
  }
  return labels[view]
}

function getViewDescription(view: WorkspaceView): string {
  const descriptions: Record<WorkspaceView, string> = {
    clients: 'Manage client records and see how many tasks belong to each client.',
    today: 'Action dates and event due dates scheduled for today.',
    'follow-up': 'Items that should be checked again today.',
    waiting: 'Items currently waiting on another person or organization.',
    upcoming: 'Future active work sorted by the next relevant date.',
    overdue: 'Active items whose next relevant date has already passed.',
    completed: 'Finished tasks kept for reference. Restore one if it needs attention again.',
  }
  return descriptions[view]
}

function formatDateKey(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return 'Invalid date'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

function getTodayKey(): string {
  const now = new Date()
  const year = String(now.getFullYear()).padStart(4, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getInitials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'VA'
}

function safeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0
}

function createId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `item-${Date.now()}-${Math.random().toString(16).slice(2)}`
}



function parseBackupWorkspace(value: unknown): VaWorkspaceData {
  const candidate =
    isRecord(value) && value.format === 'whenisdue-va-backup'
      ? value.workspace
      : value

  if (!isRecord(candidate)) {
    throw new Error('This file is not a valid WhenIsDue workspace backup.')
  }

  if (candidate.version !== 2) {
    throw new Error('This backup uses an unsupported workspace version.')
  }

  if (!Array.isArray(candidate.clients) || !Array.isArray(candidate.tasks)) {
    throw new Error('The backup is missing its clients or tasks list.')
  }

  const clients = candidate.clients.map(validateBackupClient)
  const clientIds = new Set(clients.map((client) => client.id))
  const tasks = candidate.tasks.map((task, index) =>
    validateBackupTask(task, clientIds, index),
  )

  return { version: 2, clients, tasks }
}

function validateBackupClient(value: unknown, index: number): VaClient {
  if (!isRecord(value)) {
    throw new Error(`Client ${index + 1} is invalid.`)
  }

  return {
    id: requireBackupString(value.id, `Client ${index + 1} ID`, 160),
    displayName: requireBackupString(
      value.displayName,
      `Client ${index + 1} name`,
      nameMaxLength,
    ),
    contactName: optionalBackupString(value.contactName, 80),
    email: optionalBackupString(value.email, 160),
    phone: optionalBackupString(value.phone, 60),
    serviceType: optionalBackupString(value.serviceType, 100),
    timeZone: optionalBackupString(value.timeZone, 100),
    notes: optionalBackupString(value.notes, notesMaxLength),
    active: typeof value.active === 'boolean' ? value.active : true,
    createdAt: requireBackupDate(value.createdAt, `Client ${index + 1} created date`),
    updatedAt: requireBackupDate(value.updatedAt, `Client ${index + 1} updated date`),
  }
}

function validateBackupTask(
  value: unknown,
  clientIds: Set<string>,
  index: number,
): VaTask {
  if (!isRecord(value)) {
    throw new Error(`Task ${index + 1} is invalid.`)
  }

  const clientId = requireBackupString(value.clientId, `Task ${index + 1} client`, 160)

  if (!clientIds.has(clientId)) {
    throw new Error(`Task ${index + 1} refers to a client missing from the backup.`)
  }

  const status = value.status

  if (status !== 'needs-action' && status !== 'waiting' && status !== 'completed') {
    throw new Error(`Task ${index + 1} has an invalid status.`)
  }

  const task: VaTask = {
    id: requireBackupString(value.id, `Task ${index + 1} ID`, 160),
    clientId,
    title: requireBackupString(value.title, `Task ${index + 1} title`, taskTitleMaxLength),
    details: optionalBackupString(value.details, taskDetailsMaxLength),
    dueDate: optionalBackupDateKey(value.dueDate, `Task ${index + 1} due date`),
    actionDate: optionalBackupDateKey(value.actionDate, `Task ${index + 1} action date`),
    followUpDate: optionalBackupDateKey(
      value.followUpDate,
      `Task ${index + 1} follow-up date`,
    ),
    status,
    responsibility: parseTaskResponsibility(value.responsibility),
    createdAt: requireBackupDate(
      value.createdAt,
      `Task ${index + 1} created date`,
    ),
    updatedAt: requireBackupDate(value.updatedAt, `Task ${index + 1} updated date`),
  }

  if (!task.dueDate && !task.actionDate && !task.followUpDate) {
    throw new Error(`Task ${index + 1} does not contain any date.`)
  }

  return task
}

function mergeWorkspaces(
  current: VaWorkspaceData,
  imported: VaWorkspaceData,
): VaWorkspaceData {
  const usedClientIds = new Set(current.clients.map((client) => client.id))
  const usedTaskIds = new Set(current.tasks.map((task) => task.id))
  const clientIdMap = new Map<string, string>()

  const importedClients = imported.clients.map((client) => {
    const id = createUniqueId(usedClientIds)
    clientIdMap.set(client.id, id)
    usedClientIds.add(id)
    return { ...client, id }
  })

  const importedTasks = imported.tasks.map((task) => {
    const clientId = clientIdMap.get(task.clientId)

    if (!clientId) {
      throw new Error(`The task "${task.title}" has no matching imported client.`)
    }

    const id = createUniqueId(usedTaskIds)
    usedTaskIds.add(id)
    return { ...task, id, clientId }
  })

  return {
    version: 2,
    clients: [...importedClients, ...current.clients],
    tasks: [...importedTasks, ...current.tasks],
  }
}

function createUniqueId(usedIds: Set<string>): string {
  let id = createId()
  while (usedIds.has(id)) id = createId()
  return id
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireBackupString(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== 'string') throw new Error(`${label} is missing.`)
  const normalized = value.trim()
  if (normalized.length === 0 || normalized.length > maxLength) {
    throw new Error(`${label} is invalid.`)
  }
  return normalized
}

function optionalBackupString(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function requireBackupDate(value: unknown, label: string): string {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) {
    throw new Error(`${label} is invalid.`)
  }
  return value
}

function optionalBackupDateKey(value: unknown, label: string): string {
  if (value === '' || value === null || value === undefined) return ''
  if (typeof value !== 'string' || !isDateKey(value)) {
    throw new Error(`${label} is invalid.`)
  }
  return value
}

function isDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    Number.isFinite(year) &&
    Number.isFinite(month) &&
    Number.isFinite(day) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

function isWaitingResponsibility(
  responsibility: VaTaskResponsibility,
): boolean {
  return (
    responsibility === 'client' ||
    responsibility === 'third-party'
  )
}

function parseTaskResponsibility(
  value: unknown,
): VaTaskResponsibility {
  return value === 'client' ||
    value === 'third-party' ||
    value === 'unclear'
    ? value
    : 'va'
}

function getResponsibilityLabel(
  responsibility: VaTaskResponsibility,
): string {
  const labels: Record<VaTaskResponsibility, string> = {
    va: 'You need to do this',
    client: 'Waiting for the client',
    'third-party': 'Waiting for someone else',
    unclear: 'Needs clarification',
  }

  return labels[responsibility]
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }

  return 'Something went wrong. Please try again.'
}

export default VaWorkspacePage
