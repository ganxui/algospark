import { storage } from '../core/storage.js'

const history = []
const HISTORY_LIMIT = 8
let activeController = null
let generation = 0
const storedClientId = storage.getItem('algospark_tutor_client_id')
const clientId = storedClientId && /^[a-f0-9-]{36}$/i.test(storedClientId) ? storedClientId : crypto.randomUUID()
storage.setItem('algospark_tutor_client_id', clientId)

export async function askTutor({ message, lessonId, lessonTitle, taskIndex, taskCount, lessonCount, completedLessons, concept, taskQuestion, attempt }) {
  if (activeController) throw new Error('Дождись ответа на предыдущий вопрос.')
  const requestGeneration = generation
  const controller = new AbortController()
  activeController = controller
  const timeout = setTimeout(() => controller.abort(), 30000)
  try {
  const response = await fetch('/api/algospark/chat', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    body: JSON.stringify({
      message: String(message).slice(0, 1000),
      clientId,
      lessonId: Number(lessonId),
      lessonTitle: String(lessonTitle || '').slice(0, 160),
      taskIndex: Number(taskIndex),
      taskCount: Number(taskCount),
      lessonCount: Number(lessonCount),
      completedLessons: Number(completedLessons),
      concept: String(concept || '').slice(0, 360),
      taskQuestion: String(taskQuestion || '').slice(0, 500),
      attempt: String(attempt || '').slice(0, 900),
      history: history.slice(-6).map(item => ({ ...item, content: item.content.slice(0, 500) }))
    })
  })
  const payload = await response.json().catch(() => ({}))
  if (requestGeneration !== generation) throw new Error('Диалог был сброшен.')
  if (!response.ok) throw new Error(payload?.error?.message || 'Не удалось получить ответ. Попробуй ещё раз.')
  const reply = String(payload.reply || '').trim()
  if (!reply) throw new Error('Наставник не прислал ответ. Попробуй ещё раз.')
  history.push({ role: 'user', content: String(message).slice(0, 1000) }, { role: 'assistant', content: reply })
  if (history.length > HISTORY_LIMIT * 2) history.splice(0, history.length - HISTORY_LIMIT * 2)
  return reply
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Наставник не успел ответить. Попробуй ещё раз.')
    throw error
  } finally {
    clearTimeout(timeout)
    if (activeController === controller) activeController = null
  }
}

export function clearTutorHistory() {
  generation++
  activeController?.abort()
  activeController = null
  history.length = 0
}
