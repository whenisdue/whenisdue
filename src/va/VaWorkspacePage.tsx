import { useMemo, useState } from 'react'
import './VaWorkspace.css'
import { loadVaWorkspace, saveVaWorkspace } from './vaStorage'
import type {
  VaClient,
  VaClientDraft,
  VaTask,
  VaTaskDraft,
  VaTaskStatus,
} from './vaTypes'

type VaWorkspacePageProps = {
  onNavigate: (path: string) => void
}

type WorkspaceView = 'clients' | 'today' | 'follow-up' | 'waiting' | 'upcoming' | 'overdue' | 'completed'

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
  const [workspace, setWorkspace] = useState(loadVaWorkspace)
  const [view, setView] = useState<WorkspaceView>('clients')
  const [clientDraft, setClientDraft] = useState<VaClientDraft>(emptyClientDraft)
  const [taskDraft, setTaskDraft] = useState<VaTaskDraft>(emptyTaskDraft)
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

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

  function persist(nextWorkspace: typeof workspace, successMessage?: string) {
    const result = saveVaWorkspace(nextWorkspace)

    if (!result.ok) {
      setMessage(result.message)
      return false
    }

    setWorkspace(nextWorkspace)
    setMessage(successMessage ?? null)
    return true
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

      <section className="va-hero va-hero-compact">
        <div>
          <p className="va-eyebrow">Client deadline command center</p>
          <h1>Know what needs action, who is waiting, and what is overdue.</h1>
          <p>Every task can have an event due date, an earlier action date, and a separate follow-up date.</p>
        </div>
        <span className="va-local-note">Saved only in this browser</span>
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

export default VaWorkspacePage
