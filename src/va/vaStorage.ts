import type {
  VaClient,
  VaTask,
  VaTaskResponsibility,
  VaWorkspaceData,
} from './vaTypes'

export const vaWorkspaceStorageKey = 'whenisdue.vaWorkspace.v1'

const emptyWorkspace: VaWorkspaceData = {
  version: 2,
  clients: [],
  tasks: [],
}

type StorageResult = {
  ok: boolean
  message: string | null
}

export function loadVaWorkspace(): VaWorkspaceData {
  try {
    const storedValue = localStorage.getItem(vaWorkspaceStorageKey)

    if (!storedValue) {
      return emptyWorkspace
    }

    const parsed: unknown = JSON.parse(storedValue)

    if (isVaWorkspaceV2(parsed)) {
      return normalizeWorkspace(parsed)
    }

    if (isVaWorkspaceV1(parsed)) {
      const migrated: VaWorkspaceData = {
        version: 2,
        clients: parsed.clients,
        tasks: [],
      }
      saveVaWorkspace(migrated)
      return migrated
    }

    return emptyWorkspace
  } catch {
    return emptyWorkspace
  }
}

export function saveVaWorkspace(workspace: VaWorkspaceData): StorageResult {
  try {
    localStorage.setItem(vaWorkspaceStorageKey, JSON.stringify(workspace))
    return { ok: true, message: null }
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      return {
        ok: false,
        message: 'Browser storage is full. Delete an unused client or task before saving again.',
      }
    }

    return {
      ok: false,
      message: 'Saving is unavailable in this browser.',
    }
  }
}

function isVaWorkspaceV2(value: unknown): value is VaWorkspaceData {
  if (!value || typeof value !== 'object') {
    return false
  }

  const workspace = value as Partial<VaWorkspaceData>

  return (
    workspace.version === 2 &&
    Array.isArray(workspace.clients) &&
    workspace.clients.every(isVaClient) &&
    Array.isArray(workspace.tasks) &&
    workspace.tasks.every(isVaTask)
  )
}

function isVaWorkspaceV1(value: unknown): value is { version: 1; clients: VaClient[] } {
  if (!value || typeof value !== 'object') {
    return false
  }

  const workspace = value as { version?: unknown; clients?: unknown }

  return (
    workspace.version === 1 &&
    Array.isArray(workspace.clients) &&
    workspace.clients.every(isVaClient)
  )
}

function isVaClient(value: unknown): value is VaClient {
  if (!value || typeof value !== 'object') {
    return false
  }

  const client = value as Partial<VaClient>

  return (
    typeof client.id === 'string' &&
    typeof client.displayName === 'string' &&
    client.displayName.length <= 80 &&
    typeof client.contactName === 'string' &&
    client.contactName.length <= 80 &&
    typeof client.email === 'string' &&
    client.email.length <= 160 &&
    typeof client.phone === 'string' &&
    client.phone.length <= 60 &&
    typeof client.serviceType === 'string' &&
    client.serviceType.length <= 100 &&
    typeof client.notes === 'string' &&
    client.notes.length <= 1200 &&
    typeof client.active === 'boolean' &&
    typeof client.createdAt === 'string' &&
    typeof client.updatedAt === 'string'
  )
}

function isVaTask(value: unknown): value is VaTask {
  if (!value || typeof value !== 'object') {
    return false
  }

  const task = value as Partial<VaTask>

  return (
    typeof task.id === 'string' &&
    typeof task.clientId === 'string' &&
    typeof task.title === 'string' &&
    task.title.length <= 120 &&
    typeof task.details === 'string' &&
    task.details.length <= 1500 &&
    typeof task.dueDate === 'string' &&
    isDateKeyOrEmpty(task.dueDate) &&
    typeof task.actionDate === 'string' &&
    isDateKeyOrEmpty(task.actionDate) &&
    typeof task.followUpDate === 'string' &&
    isDateKeyOrEmpty(task.followUpDate) &&
    (task.status === 'needs-action' ||
      task.status === 'waiting' ||
      task.status === 'completed') &&
    (task.responsibility === undefined ||
      isVaTaskResponsibility(task.responsibility)) &&
    typeof task.createdAt === 'string' &&
    typeof task.updatedAt === 'string'
  )
}

function normalizeWorkspace(workspace: VaWorkspaceData): VaWorkspaceData {
  return {
    ...workspace,
    tasks: workspace.tasks.map((task) => ({
      ...task,
      responsibility: isVaTaskResponsibility(task.responsibility)
        ? task.responsibility
        : 'va',
    })),
  }
}

function isVaTaskResponsibility(
  value: unknown,
): value is VaTaskResponsibility {
  return (
    value === 'va' ||
    value === 'client' ||
    value === 'third-party' ||
    value === 'unclear'
  )
}

function isDateKeyOrEmpty(value: string): boolean {
  return value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value)
}
