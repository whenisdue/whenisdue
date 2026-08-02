import assert from 'node:assert/strict'

function filterTasksForToday(tasks, today) {
  return tasks.filter((task) => {
    if (task.status === 'completed') return false
    if (task.status === 'waiting') {
      return Boolean(task.followUpDate && task.followUpDate <= today)
    }

    return Boolean(
      (task.actionDate && task.actionDate <= today) ||
      (task.dueDate && task.dueDate <= today) ||
      (task.followUpDate && task.followUpDate <= today)
    )
  })
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
  { id: 'future-waiting', status: 'waiting', followUpDate: '2026-08-05', dueDate: '', actionDate: '' },
  { id: 'follow-up-today', status: 'waiting', followUpDate: today, dueDate: '', actionDate: '' },
  { id: 'follow-up-overdue', status: 'waiting', followUpDate: '2026-08-01', dueDate: '', actionDate: '' },
  { id: 'deadline-today', status: 'needs-action', followUpDate: '', dueDate: today, actionDate: '' },
  { id: 'deadline-overdue', status: 'needs-action', followUpDate: '', dueDate: '2026-08-01', actionDate: '' },
  { id: 'later', status: 'needs-action', followUpDate: '', dueDate: '2026-08-06', actionDate: '' },
]

const todayTasks = filterTasksForToday(tasks, today).sort((a, b) => rank(a, today) - rank(b, today))
const ids = todayTasks.map((task) => task.id)

assert.deepEqual(ids, [
  'deadline-overdue',
  'follow-up-overdue',
  'deadline-today',
  'follow-up-today',
])

assert.equal(ids.includes('future-waiting'), false)
assert.equal(ids.includes('later'), false)

console.log('✓ Queue integrity checks passed')
console.log('  Overdue deadline appears first')
console.log('  Overdue follow-up appears in Today')
console.log('  Deadline today appears in Today')
console.log('  Waiting follow-up due today appears in Today')
console.log('  Future waiting and future work stay out of Today')
