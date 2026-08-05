export type VaClient = {
  id: string
  displayName: string
  contactName: string
  email: string
  phone: string
  serviceType: string
  timeZone: string
  notes: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export type VaTaskStatus = 'needs-action' | 'waiting' | 'completed'

export type VaTaskResponsibility =
  | 'va'
  | 'client'
  | 'third-party'
  | 'unclear'

export type VaTask = {
  id: string
  clientId: string
  title: string
  details: string
  dueDate: string
  actionDate: string
  followUpDate: string
  status: VaTaskStatus
  responsibility: VaTaskResponsibility
  createdAt: string
  updatedAt: string
}

export type VaWorkspaceData = {
  version: 2
  clients: VaClient[]
  tasks: VaTask[]
}

export type VaClientDraft = Omit<VaClient, 'id' | 'createdAt' | 'updatedAt'>

export type VaTaskDraft = Omit<VaTask, 'id' | 'createdAt' | 'updatedAt'>
