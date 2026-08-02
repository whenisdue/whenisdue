import type { User } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import type {
  VaClient,
  VaTask,
  VaTaskResponsibility,
  VaTaskStatus,
  VaWorkspaceData,
} from './vaTypes'

type ClientRow = {
  id: string
  user_id: string
  display_name: string
  contact_name: string
  email: string
  phone: string
  service_type: string
  notes: string
  active: boolean
  created_at: string
  updated_at: string
}

type TaskRow = {
  id: string
  user_id: string
  client_id: string
  title: string
  details: string
  due_date: string | null
  action_date: string | null
  follow_up_date: string | null
  status: VaTaskStatus
  responsibility: VaTaskResponsibility | null
  created_at: string
  updated_at: string
}

export async function loadCloudWorkspace(user: User): Promise<VaWorkspaceData> {
  const [clientResult, taskResult] = await Promise.all([
    supabase
      .from('va_clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('va_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  if (clientResult.error) {
    throw clientResult.error
  }

  if (taskResult.error) {
    throw taskResult.error
  }

  return {
    version: 2,
    clients: ((clientResult.data ?? []) as ClientRow[]).map(fromClientRow),
    tasks: ((taskResult.data ?? []) as TaskRow[]).map(fromTaskRow),
  }
}

export async function syncCloudWorkspace(
  user: User,
  workspace: VaWorkspaceData,
): Promise<void> {
  const clientRows = workspace.clients.map((client) => toClientRow(user, client))
  const taskRows = workspace.tasks.map((task) => toTaskRow(user, task))

  if (clientRows.length > 0) {
    const { error } = await supabase
      .from('va_clients')
      .upsert(clientRows, { onConflict: 'id' })

    if (error) {
      throw error
    }
  }

  if (taskRows.length > 0) {
    const { error } = await supabase
      .from('va_tasks')
      .upsert(taskRows, { onConflict: 'id' })

    if (error) {
      throw error
    }
  }

  const [existingClients, existingTasks] = await Promise.all([
    supabase.from('va_clients').select('id').eq('user_id', user.id),
    supabase.from('va_tasks').select('id').eq('user_id', user.id),
  ])

  if (existingClients.error) {
    throw existingClients.error
  }

  if (existingTasks.error) {
    throw existingTasks.error
  }

  const wantedTaskIds = new Set(workspace.tasks.map((task) => task.id))
  const staleTaskIds = (existingTasks.data ?? [])
    .map((row) => String(row.id))
    .filter((id) => !wantedTaskIds.has(id))

  if (staleTaskIds.length > 0) {
    const { error } = await supabase
      .from('va_tasks')
      .delete()
      .eq('user_id', user.id)
      .in('id', staleTaskIds)

    if (error) {
      throw error
    }
  }

  const wantedClientIds = new Set(workspace.clients.map((client) => client.id))
  const staleClientIds = (existingClients.data ?? [])
    .map((row) => String(row.id))
    .filter((id) => !wantedClientIds.has(id))

  if (staleClientIds.length > 0) {
    const { error } = await supabase
      .from('va_clients')
      .delete()
      .eq('user_id', user.id)
      .in('id', staleClientIds)

    if (error) {
      throw error
    }
  }
}

export async function importLocalWorkspace(
  user: User,
  localWorkspace: VaWorkspaceData,
): Promise<VaWorkspaceData> {
  const clientIdMap = new Map<string, string>()

  const clients = localWorkspace.clients.map((client) => {
    const id = isUuid(client.id) ? client.id : crypto.randomUUID()
    clientIdMap.set(client.id, id)

    return {
      ...client,
      id,
    }
  })

  const tasks = localWorkspace.tasks
    .map((task) => {
      const clientId = clientIdMap.get(task.clientId)

      if (!clientId) {
        return null
      }

      return {
        ...task,
        id: isUuid(task.id) ? task.id : crypto.randomUUID(),
        clientId,
      }
    })
    .filter((task): task is VaTask => task !== null)

  const imported: VaWorkspaceData = {
    version: 2,
    clients,
    tasks,
  }

  await syncCloudWorkspace(user, imported)
  return loadCloudWorkspace(user)
}

function toClientRow(user: User, client: VaClient): ClientRow {
  return {
    id: client.id,
    user_id: user.id,
    display_name: client.displayName,
    contact_name: client.contactName,
    email: client.email,
    phone: client.phone,
    service_type: client.serviceType,
    notes: client.notes,
    active: client.active,
    created_at: client.createdAt,
    updated_at: client.updatedAt,
  }
}

function toTaskRow(user: User, task: VaTask): TaskRow {
  return {
    id: task.id,
    user_id: user.id,
    client_id: task.clientId,
    title: task.title,
    details: task.details,
    due_date: task.dueDate || null,
    action_date: task.actionDate || null,
    follow_up_date: task.followUpDate || null,
    status: task.status,
    responsibility: task.responsibility,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
  }
}

function fromClientRow(row: ClientRow): VaClient {
  return {
    id: row.id,
    displayName: row.display_name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    serviceType: row.service_type,
    notes: row.notes,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function fromTaskRow(row: TaskRow): VaTask {
  return {
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    details: row.details,
    dueDate: row.due_date ?? '',
    actionDate: row.action_date ?? '',
    followUpDate: row.follow_up_date ?? '',
    status: row.status,
    responsibility: isVaTaskResponsibility(row.responsibility)
      ? row.responsibility
      : 'va',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
