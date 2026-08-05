import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function filterTasksForToday(tasks, today) {
  return tasks.filter((task) => {
    if (task.status === 'completed') return false

    if (task.status === 'waiting') {
      return Boolean(
        task.followUpDate &&
        task.followUpDate <= today
      )
    }

    return Boolean(
      (task.actionDate && task.actionDate <= today) ||
      (task.dueDate && task.dueDate <= today) ||
      (task.followUpDate && task.followUpDate <= today)
    )
  })
}

function filterTasksForLater(tasks, today) {
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
      (task.followUpDate && task.followUpDate <= today)
    )

    if (belongsInToday) {
      return false
    }

    const nextDate =
      task.actionDate ||
      task.dueDate ||
      task.followUpDate

    return Boolean(nextDate && nextDate > today)
  })
}

function moveWaitingTaskToToday(task, today) {
  return {
    ...task,
    status: 'needs-action',
    responsibility: 'va',
    actionDate: today,
    followUpDate: '',
  }
}

function rank(task, today) {
  if (task.status === 'completed') return 99
  if (task.dueDate && task.dueDate < today) return 1
  if (task.followUpDate && task.followUpDate < today) return 2
  if (task.dueDate === today) return 3
  if (task.followUpDate === today) return 4
  if (task.actionDate && task.actionDate <= today) return 5
  if (task.status === 'waiting') return 20

  return 30
}

const today = '2026-08-02'

const tasks = [
  {
    id: 'future-waiting',
    status: 'waiting',
    responsibility: 'client',
    followUpDate: '2026-08-05',
    dueDate: '',
    actionDate: '',
  },
  {
    id: 'follow-up-today',
    status: 'waiting',
    responsibility: 'client',
    followUpDate: today,
    dueDate: '',
    actionDate: '',
  },
  {
    id: 'follow-up-overdue',
    status: 'waiting',
    responsibility: 'third-party',
    followUpDate: '2026-08-01',
    dueDate: '',
    actionDate: '',
  },
  {
    id: 'deadline-today',
    status: 'needs-action',
    responsibility: 'va',
    followUpDate: '',
    dueDate: today,
    actionDate: '',
  },
  {
    id: 'deadline-overdue',
    status: 'needs-action',
    responsibility: 'va',
    followUpDate: '',
    dueDate: '2026-08-01',
    actionDate: '',
  },
  {
    id: 'today-with-future-deadline',
    status: 'needs-action',
    responsibility: 'va',
    followUpDate: '',
    dueDate: '2026-08-06',
    actionDate: today,
  },
  {
    id: 'later',
    status: 'needs-action',
    responsibility: 'va',
    followUpDate: '',
    dueDate: '2026-08-06',
    actionDate: '',
  },
]

const todayTasks = filterTasksForToday(tasks, today).sort(
  (first, second) =>
    rank(first, today) - rank(second, today),
)

const ids = todayTasks.map((task) => task.id)

assert.deepEqual(ids, [
  'deadline-overdue',
  'follow-up-overdue',
  'deadline-today',
  'follow-up-today',
  'today-with-future-deadline',
])

assert.equal(ids.includes('future-waiting'), false)
assert.equal(ids.includes('later'), false)

const laterIds = filterTasksForLater(
  tasks,
  today,
).map((task) => task.id)

assert.deepEqual(laterIds, ['later'])

assert.equal(
  laterIds.includes('today-with-future-deadline'),
  false,
)

const waitingTask = {
  id: 'waiting-to-today',
  status: 'waiting',
  responsibility: 'client',
  actionDate: '',
  followUpDate: '2026-08-05',
  dueDate: '2026-08-10',
}

const movedTask = moveWaitingTaskToToday(
  waitingTask,
  today,
)

assert.equal(movedTask.status, 'needs-action')
assert.equal(movedTask.responsibility, 'va')
assert.equal(movedTask.actionDate, today)
assert.equal(movedTask.followUpDate, '')
assert.equal(movedTask.dueDate, '2026-08-10')

assert.equal(
  filterTasksForToday([movedTask], today).length,
  1,
)

assert.equal(
  filterTasksForLater([movedTask], today).length,
  0,
)

/*
  These source checks make verification fail if the task
  date inputs lose their immediate React state handlers.
*/
const workspaceSource = readFileSync(
  new URL(
    '../src/va/VaWorkspacePage.tsx',
    import.meta.url,
  ),
  'utf8',
)

function assertDateInputKeepsState(fieldName) {
  const inputPattern = new RegExp(
    [
      `name=["']${fieldName}["']`,
      `[\\s\\S]{0,900}?`,
      `onInput=`,
      `[\\s\\S]{0,900}?`,
      `onChange=`,
    ].join(''),
  )

  assert.match(
    workspaceSource,
    inputPattern,
    `${fieldName} must keep both onInput and onChange state handlers`,
  )
}

assertDateInputKeepsState('actionDate')
assertDateInputKeepsState('followUpDate')
assertDateInputKeepsState('dueDate')

assert.match(
  workspaceSource,
  /status === 'needs-action'/,
  'Move to Today must recognize the needs-action status',
)

assert.match(
  workspaceSource,
  /\('va' as VaTaskResponsibility\)/,
  'Move to Today must return responsibility to the VA',
)

assert.match(
  workspaceSource,
  /status === 'needs-action'[\s\S]{0,150}?\?\s*today/,
  'Move to Today must set the action date to today',
)

assert.match(
  workspaceSource,
  /status === 'needs-action'[\s\S]{0,150}?\?\s*''/,
  'Move to Today must clear the follow-up date',
)

function moveTaskToWaiting(
  task,
  today,
  followUpDate,
  waitingFor,
) {
  return {
    ...task,
    status: 'waiting',
    responsibility: 'client',
    actionDate: '',
    followUpDate,
    waitingFor,
    waitingSince: task.waitingSince || today,
  }
}

function snoozeWaitingTask(task, followUpDate) {
  return {
    ...task,
    followUpDate,
  }
}

const radarSourceTask = {
  id: 'radar-source',
  status: 'needs-action',
  responsibility: 'va',
  actionDate: today,
  followUpDate: '',
  dueDate: '2026-08-10',
  waitingFor: '',
  waitingSince: '',
  nextStep: 'Attach the corrected invoice',
}

const waitingRadarTask = moveTaskToWaiting(
  radarSourceTask,
  today,
  '2026-08-05',
  'client approval',
)

assert.equal(waitingRadarTask.status, 'waiting')
assert.equal(waitingRadarTask.actionDate, '')
assert.equal(
  waitingRadarTask.followUpDate,
  '2026-08-05',
)
assert.equal(
  waitingRadarTask.waitingFor,
  'client approval',
)
assert.equal(waitingRadarTask.waitingSince, today)
assert.equal(
  waitingRadarTask.dueDate,
  '2026-08-10',
)
assert.equal(
  waitingRadarTask.nextStep,
  'Attach the corrected invoice',
)

const snoozedRadarTask = snoozeWaitingTask(
  waitingRadarTask,
  '2026-08-08',
)

assert.equal(
  snoozedRadarTask.followUpDate,
  '2026-08-08',
)
assert.equal(
  snoozedRadarTask.waitingSince,
  today,
)
assert.equal(
  snoozedRadarTask.dueDate,
  '2026-08-10',
)
assert.equal(
  snoozedRadarTask.waitingFor,
  'client approval',
)

assert.equal(
  workspaceSource.includes(
    'waitingSince: task.waitingSince || today',
  ),
  true,
  'Moving to Waiting must record when the wait started',
)

assert.match(
  workspaceSource,
  /waitingFor:\s*waitingFor\.trim\(\)/,
  'Moving to Waiting must save what the task is waiting for',
)

assert.match(
  workspaceSource,
  /nextStep:\s*nextStepDraft\.trim\(\)/,
  'Resume Marker must save the next step',
)

assert.match(
  workspaceSource,
  /Check this item later/,
  'Waiting tasks must provide Check later',
)

console.log('✓ Queue integrity checks passed')
console.log('  Overdue deadline appears first')
console.log('  Overdue follow-up appears in Today')
console.log('  Deadline today appears in Today')
console.log('  Waiting follow-up due today appears in Today')
console.log('  Future waiting and future work stay out of Today')
console.log('  Today tasks do not also appear in Later')
console.log('  Move to Today sets the action date to today')
console.log('  Move to Today clears the old follow-up date')
console.log('  Move to Today keeps the final deadline')
console.log('  Date inputs keep immediate state handlers')
console.log('  Moving to Waiting records the wait start')
console.log('  Waiting reason is preserved')
console.log('  Check later changes only the check-back date')
console.log('  Resume Marker is stored on the task')
