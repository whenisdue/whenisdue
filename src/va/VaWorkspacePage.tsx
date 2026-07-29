import { useEffect, useMemo, useRef, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import './VaWorkspace.css'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import { importLocalWorkspace, loadCloudWorkspace, syncCloudWorkspace } from './vaCloud'
import { loadVaWorkspace, saveVaWorkspace } from './vaStorage'
import type {
  VaClient,
  VaClientDraft,
  VaTask,
  VaTaskDraft,
  VaTaskStatus,
  VaWorkspaceData,
} from './vaTypes'

type VaWorkspacePageProps = {
  onNavigate: (path: string) => void
}

type WorkspaceView = 'clients' | 'today' | 'follow-up' | 'waiting' | 'upcoming' | 'overdue' | 'completed'

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
          <span className="va-brand-mark" aria-hidden="true">✓</span>
          <span>WhenIsDue</span>
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
  const [mode, setMode] = useState<'sign-in' | 'sign-up' | 'forgot-password'>('sign-in')
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
            setMode((current) => (current === 'sign-in' ? 'sign-up' : 'sign-in'))
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
  const [view, setView] = useState<WorkspaceView>('clients')
  const [clientDraft, setClientDraft] = useState<VaClientDraft>(emptyClientDraft)
  const [taskDraft, setTaskDraft] = useState<VaTaskDraft>(emptyTaskDraft)
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge')
  const restoreInputRef = useRef<HTMLInputElement | null>(null)
  const syncQueue = useRef<Promise<void>>(Promise.resolve())

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

  const today = getTodayKey()

  const sortedClients = useMemo(
    () => [...workspace.clients].sort(compareClients),
    [workspace.clients],
  )

  const visibleTasks = useMemo(
    () => filterTasksForView(workspace.tasks, view, today).sort(compareTasks),
    [today, view, workspace.tasks],
  )

  const activeClients = workspace.clients.filter((client) => client.active).length
  const todayCount = filterTasksForView(workspace.tasks, 'today', today).length
  const followUpCount = filterTasksForView(workspace.tasks, 'follow-up', today).length
  const waitingCount = filterTasksForView(workspace.tasks, 'waiting', today).length
  const overdueCount = filterTasksForView(workspace.tasks, 'overdue', today).length
  const completedCount = filterTasksForView(workspace.tasks, 'completed', today).length

  const canSaveClient = clientDraft.displayName.trim().length > 0
  const canSaveTask =
    taskDraft.clientId.trim().length > 0 &&
    taskDraft.title.trim().length > 0 &&
    Boolean(taskDraft.dueDate || taskDraft.actionDate || taskDraft.followUpDate)

  const cloudIsEmpty = workspace.clients.length === 0 && workspace.tasks.length === 0
  const localHasRecords =
    localSnapshot.clients.length > 0 || localSnapshot.tasks.length > 0

  function persist(nextWorkspace: VaWorkspaceData, successMessage?: string) {
    const localResult = saveVaWorkspace(nextWorkspace)

    setWorkspace(nextWorkspace)
    setMessage(localResult.ok ? successMessage ?? null : localResult.message)

    syncQueue.current = syncQueue.current
      .then(() => syncCloudWorkspace(user, nextWorkspace))
      .catch((error: unknown) => {
        setMessage(`Cloud sync failed: ${getErrorMessage(error)}`)
      })

    return true
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

      const confirmed = window.confirm(
        `This backup contains ${clientCount} ${clientCount === 1 ? 'client' : 'clients'} and ${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}.\n\nContinue and ${actionWord} your current workspace?`,
      )

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
    }
  }

  function editClient(client: VaClient) {
    setClientDraft({
      displayName: client.displayName,
      contactName: client.contactName,
      email: client.email,
      phone: client.phone,
      serviceType: client.serviceType,
      notes: client.notes,
      active: client.active,
    })
    setEditingClientId(client.id)
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

  function saveTask() {
    if (!canSaveTask) {
      setMessage('Choose a client, add a task title, and enter at least one date.')
      return
    }

    const now = new Date().toISOString()
    const normalized = normalizeTaskDraft(taskDraft)
    const tasks = editingTaskId
      ? workspace.tasks.map((task) =>
          task.id === editingTaskId ? { ...task, ...normalized, updatedAt: now } : task,
        )
      : [{ ...normalized, id: createId(), createdAt: now, updatedAt: now }, ...workspace.tasks]

    if (persist({ ...workspace, tasks }, editingTaskId ? 'Task updated.' : 'Task saved.')) {
      setTaskDraft({
        ...emptyTaskDraft,
        clientId: normalized.clientId,
      })
      setEditingTaskId(null)
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
    })
    setEditingTaskId(task.id)
    setMessage(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function updateTaskStatus(taskId: string, status: VaTaskStatus) {
    const tasks = workspace.tasks.map((task) =>
      task.id === taskId
        ? { ...task, status, updatedAt: new Date().toISOString() }
        : task,
    )
    persist({ ...workspace, tasks })
  }

  function deleteTask(task: VaTask) {
    if (!window.confirm(`Delete "${task.title}"?`)) {
      return
    }

    persist({
      ...workspace,
      tasks: workspace.tasks.filter((item) => item.id !== task.id),
    })

    if (editingTaskId === task.id) {
      setTaskDraft(emptyTaskDraft)
      setEditingTaskId(null)
    }
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
          <span className="va-brand-mark" aria-hidden="true">✓</span>
          <span>WhenIsDue</span>
        </a>
        <nav className="va-topbar-actions" aria-label="Workspace navigation">
          <a href="/" onClick={(event) => {
            event.preventDefault()
            onNavigate('/')
          }}>Calculators</a>
          <span aria-current="page">VA Workspace</span>
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

      <section className="va-backup-panel" aria-labelledby="va-backup-heading">
        <div className="va-backup-copy">
          <p className="va-eyebrow">Portable backup</p>
          <h2 id="va-backup-heading">Download or restore your workspace</h2>
          <p>
            Backup files include clients and tasks only. Passwords and account credentials are never included.
          </p>
        </div>

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
              onChange={(event) =>
                setRestoreMode(event.target.value as 'merge' | 'replace')
              }
              disabled={restoring}
            >
              <option value="merge">Merge with current records</option>
              <option value="replace">Replace current records</option>
            </select>
          </label>

          <button
            className="va-primary-button"
            type="button"
            onClick={() => restoreInputRef.current?.click()}
            disabled={restoring}
          >
            {restoring ? 'Restoring...' : 'Restore backup'}
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
      </section>

      <section className="va-hero va-hero-compact">
        <div>
          <p className="va-eyebrow">Client deadline command center</p>
          <h1>Know what needs action, who is waiting, and what is overdue.</h1>
          <p>Every task can have an event due date, an earlier action date, and a separate follow-up date.</p>
        </div>
        <span className="va-local-note">Saved to your private account</span>
      </section>

      <section className="va-summary-grid">
        <SummaryCard label="Active clients" value={activeClients} />
        <SummaryCard label="Needs action today" value={todayCount} />
        <SummaryCard label="Follow-ups today" value={followUpCount} />
        <SummaryCard label="Waiting" value={waitingCount} />
        <SummaryCard label="Overdue" value={overdueCount} />
        <SummaryCard label="Completed" value={completedCount} />
      </section>

      <nav className="va-view-tabs" aria-label="Workspace views">
        <ViewButton label="Clients" viewName="clients" currentView={view} setView={setView} count={workspace.clients.length} />
        <ViewButton label="Today" viewName="today" currentView={view} setView={setView} count={todayCount} />
        <ViewButton label="Follow up" viewName="follow-up" currentView={view} setView={setView} count={followUpCount} />
        <ViewButton label="Waiting" viewName="waiting" currentView={view} setView={setView} count={waitingCount} />
        <ViewButton label="Upcoming" viewName="upcoming" currentView={view} setView={setView} count={filterTasksForView(workspace.tasks, 'upcoming', today).length} />
        <ViewButton label="Overdue" viewName="overdue" currentView={view} setView={setView} count={overdueCount} />
        <ViewButton label="Completed" viewName="completed" currentView={view} setView={setView} count={completedCount} />
      </nav>

      <section className="va-phase2-grid">
        <div className="va-form-stack">
          <form className="va-panel" onSubmit={(event) => {
            event.preventDefault()
            saveTask()
          }}>
            <div className="va-section-heading">
              <p className="va-eyebrow">{editingTaskId ? 'Editing task' : 'New client task'}</p>
              <h2>{editingTaskId ? 'Update task' : 'Add a due plan'}</h2>
              <p>Use only the dates that apply. At least one date is required.</p>
            </div>

            <div className="va-form-fields">
              <label>
                <span>Client *</span>
                <select value={taskDraft.clientId} onChange={(event) => setTaskDraft({ ...taskDraft, clientId: event.target.value })}>
                  <option value="">Choose a client</option>
                  {sortedClients.map((client) => (
                    <option key={client.id} value={client.id}>{client.displayName}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Task or event *</span>
                <input
                  maxLength={taskTitleMaxLength}
                  placeholder="Example: Chemotherapy appointment"
                  value={taskDraft.title}
                  onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })}
                />
              </label>

              <div className="va-date-grid">
                <label>
                  <span>Action date</span>
                  <input type="date" value={taskDraft.actionDate} onChange={(event) => setTaskDraft({ ...taskDraft, actionDate: event.target.value })} />
                  <small>When the VA should act</small>
                </label>
                <label>
                  <span>Event due date</span>
                  <input type="date" value={taskDraft.dueDate} onChange={(event) => setTaskDraft({ ...taskDraft, dueDate: event.target.value })} />
                  <small>The actual deadline or event</small>
                </label>
                <label>
                  <span>Follow-up date</span>
                  <input type="date" value={taskDraft.followUpDate} onChange={(event) => setTaskDraft({ ...taskDraft, followUpDate: event.target.value })} />
                  <small>When to check again</small>
                </label>
              </div>

              <label>
                <span>Status</span>
                <select value={taskDraft.status} onChange={(event) => setTaskDraft({ ...taskDraft, status: event.target.value as VaTaskStatus })}>
                  <option value="needs-action">Needs action</option>
                  <option value="waiting">Waiting</option>
                  <option value="completed">Completed</option>
                </select>
              </label>

              <label>
                <span>Details</span>
                <textarea
                  maxLength={taskDetailsMaxLength}
                  placeholder="Confirmation number, contact instructions, transportation details, or other notes"
                  value={taskDraft.details}
                  onChange={(event) => setTaskDraft({ ...taskDraft, details: event.target.value })}
                />
                <small>{safeCount(taskDraft.details.length)} / {taskDetailsMaxLength}</small>
              </label>
            </div>

            <div className="va-form-actions">
              <button className="va-primary-button" type="submit" disabled={!canSaveTask}>
                {editingTaskId ? 'Save task changes' : 'Add task'}
              </button>
              {editingTaskId ? (
                <button className="va-secondary-button" type="button" onClick={() => {
                  setEditingTaskId(null)
                  setTaskDraft(emptyTaskDraft)
                }}>Cancel</button>
              ) : null}
            </div>
          </form>

          <form className="va-panel va-client-mini-form" onSubmit={(event) => {
            event.preventDefault()
            saveClient()
          }}>
            <div className="va-section-heading">
              <p className="va-eyebrow">{editingClientId ? 'Editing client' : 'Client setup'}</p>
              <h2>{editingClientId ? 'Update client' : 'Add another client'}</h2>
            </div>
            <div className="va-form-fields">
              <label>
                <span>Client or household name *</span>
                <input maxLength={nameMaxLength} value={clientDraft.displayName} onChange={(event) => setClientDraft({ ...clientDraft, displayName: event.target.value })} />
              </label>
              <div className="va-two-column-fields">
                <label><span>Email</span><input type="email" value={clientDraft.email} onChange={(event) => setClientDraft({ ...clientDraft, email: event.target.value })} /></label>
                <label><span>Phone</span><input type="tel" value={clientDraft.phone} onChange={(event) => setClientDraft({ ...clientDraft, phone: event.target.value })} /></label>
              </div>
              <label><span>Service type</span><input value={clientDraft.serviceType} onChange={(event) => setClientDraft({ ...clientDraft, serviceType: event.target.value })} /></label>
              <label><span>Notes</span><textarea maxLength={notesMaxLength} value={clientDraft.notes} onChange={(event) => setClientDraft({ ...clientDraft, notes: event.target.value })} /></label>
            </div>
            <div className="va-form-actions">
              <button className="va-primary-button" type="submit" disabled={!canSaveClient}>{editingClientId ? 'Save client changes' : 'Add client'}</button>
              {editingClientId ? <button className="va-secondary-button" type="button" onClick={() => {
                setEditingClientId(null)
                setClientDraft(emptyClientDraft)
              }}>Cancel</button> : null}
            </div>
          </form>
        </div>

        <section className="va-panel va-main-panel">
          <div className="va-section-heading va-list-heading">
            <div>
              <p className="va-eyebrow">{getViewEyebrow(view)}</p>
              <h2>{getViewTitle(view)}</h2>
              <p>{getViewDescription(view)}</p>
            </div>
            <span className="va-directory-count">{safeCount(view === 'clients' ? sortedClients.length : visibleTasks.length)}</span>
          </div>

          {view === 'clients' ? (
            sortedClients.length > 0 ? (
              <div className="va-client-list">
                {sortedClients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    taskCount={workspace.tasks.filter((task) => task.clientId === client.id).length}
                    onEdit={editClient}
                    onToggle={toggleClient}
                    onDelete={deleteClient}
                  />
                ))}
              </div>
            ) : <EmptyState title="No clients yet" message="Add a client before creating a task." />
          ) : (
            visibleTasks.length > 0 ? (
              <div className="va-task-list">
                {visibleTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    client={workspace.clients.find((client) => client.id === task.clientId)}
                    today={today}
                    currentView={view}
                    onEdit={editTask}
                    onStatusChange={updateTaskStatus}
                    onDelete={deleteTask}
                  />
                ))}
              </div>
            ) : <EmptyState title={`Nothing in ${getViewTitle(view).toLowerCase()}`} message="Tasks will appear here automatically based on their dates and status." />
          )}
        </section>
      </section>

      {message ? <p className="va-global-message" aria-live="polite">{message}</p> : null}
    </main>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return <article><span>{label}</span><strong>{safeCount(value)}</strong></article>
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
    <button className={currentView === viewName ? 'is-selected' : ''} type="button" onClick={() => setView(viewName)}>
      <span>{label}</span><b>{safeCount(count)}</b>
    </button>
  )
}

function ClientCard({
  client,
  taskCount,
  onEdit,
  onToggle,
  onDelete,
}: {
  client: VaClient
  taskCount: number
  onEdit: (client: VaClient) => void
  onToggle: (id: string) => void
  onDelete: (client: VaClient) => void
}) {
  return (
    <article className={`va-client-card ${client.active ? '' : 'is-inactive'}`}>
      <div className="va-client-card-top">
        <span className="va-client-avatar">{getInitials(client.displayName)}</span>
        <div>
          <div className="va-client-title-row">
            <h3>{client.displayName}</h3>
            <span className={client.active ? 'is-active' : 'is-paused'}>{client.active ? 'Active' : 'Paused'}</span>
          </div>
          <p>{client.serviceType || 'Service type not added'} · {safeCount(taskCount)} {taskCount === 1 ? 'task' : 'tasks'}</p>
        </div>
      </div>
      <div className="va-client-actions">
        <button type="button" onClick={() => onEdit(client)}>Edit</button>
        <button type="button" onClick={() => onToggle(client.id)}>{client.active ? 'Pause' : 'Activate'}</button>
        <button className="va-delete-button" type="button" onClick={() => onDelete(client)}>Delete</button>
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
  const primaryDate = getPrimaryTaskDate(task)
  const overdue = primaryDate !== '' && primaryDate < today && task.status !== 'completed'

  return (
    <article className={`va-task-card status-${task.status} ${overdue ? 'is-overdue' : ''}`}>
      <div className="va-task-card-head">
        <div>
          <p>{client?.displayName ?? 'Unknown client'}</p>
          <h3>{task.title}</h3>
        </div>
        <span>{formatStatus(task.status)}</span>
      </div>

      <div className="va-task-dates">
        <DateItem label="Action" value={task.actionDate} />
        <DateItem label="Due" value={task.dueDate} />
        <DateItem label="Follow up" value={task.followUpDate} />
      </div>

      {task.details ? <p className="va-task-details">{task.details}</p> : null}

      <div className="va-task-actions">
        <button type="button" onClick={() => onEdit(task)}>Edit</button>
        {currentView === 'completed' ? (
          <button
            className="va-restore-button"
            type="button"
            onClick={() => onStatusChange(task.id, 'needs-action')}
          >
            Restore to Needs Action
          </button>
        ) : (
          <>
            {task.status !== 'needs-action' ? <button type="button" onClick={() => onStatusChange(task.id, 'needs-action')}>Needs action</button> : null}
            {task.status !== 'waiting' ? <button type="button" onClick={() => onStatusChange(task.id, 'waiting')}>Waiting</button> : null}
            {task.status !== 'completed' ? <button type="button" onClick={() => onStatusChange(task.id, 'completed')}>Complete</button> : null}
          </>
        )}
        <button className="va-delete-button" type="button" onClick={() => onDelete(task)}>
          {currentView === 'completed' ? 'Delete permanently' : 'Delete'}
        </button>
      </div>
    </article>
  )
}

function DateItem({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value ? formatDateKey(value) : '—'}</strong></div>
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return <div className="va-empty-state"><span>＋</span><h3>{title}</h3><p>{message}</p></div>
}

function filterTasksForView(tasks: VaTask[], view: WorkspaceView, today: string): VaTask[] {
  if (view === 'clients') return []
  if (view === 'waiting') return tasks.filter((task) => task.status === 'waiting')
  if (view === 'completed') return tasks.filter((task) => task.status === 'completed')
  if (view === 'follow-up') return tasks.filter((task) => task.status !== 'completed' && task.followUpDate === today)
  if (view === 'today') {
    return tasks.filter((task) =>
      task.status !== 'completed' &&
      (task.actionDate === today || task.dueDate === today),
    )
  }
  if (view === 'overdue') {
    return tasks.filter((task) => {
      if (task.status === 'completed') return false
      const primaryDate = getPrimaryTaskDate(task)
      return primaryDate !== '' && primaryDate < today
    })
  }
  return tasks.filter((task) => {
    if (task.status === 'completed' || task.status === 'waiting') return false
    const primaryDate = getPrimaryTaskDate(task)
    return primaryDate > today
  })
}

function getPrimaryTaskDate(task: VaTask): string {
  return task.actionDate || task.dueDate || task.followUpDate
}

function compareTasks(first: VaTask, second: VaTask): number {
  if (first.status === 'completed' && second.status === 'completed') {
    return second.updatedAt.localeCompare(first.updatedAt)
  }

  const firstDate = getPrimaryTaskDate(first) || '9999-12-31'
  const secondDate = getPrimaryTaskDate(second) || '9999-12-31'

  if (firstDate !== secondDate) {
    return firstDate.localeCompare(secondDate)
  }

  return second.updatedAt.localeCompare(first.updatedAt)
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
  }
}

function getViewEyebrow(view: WorkspaceView): string {
  return view === 'clients' ? 'Client directory' : 'Task view'
}

function getViewTitle(view: WorkspaceView): string {
  const labels: Record<WorkspaceView, string> = {
    clients: 'Your clients',
    today: 'Today',
    'follow-up': 'Follow up',
    waiting: 'Waiting',
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

function formatStatus(status: VaTaskStatus): string {
  if (status === 'needs-action') return 'Needs action'
  if (status === 'waiting') return 'Waiting'
  return 'Completed'
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
    followUpDate: optionalBackupDateKey(value.followUpDate, `Task ${index + 1} follow-up date`),
    status,
    createdAt: requireBackupDate(value.createdAt, `Task ${index + 1} created date`),
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
