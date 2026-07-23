// Крон брошенных процедур — ТЗ раздел 8 (стр. ~296):
// если session_status = 'started' и callback не поступил в течение
// duration_seconds + 30 минут — сессия помечается abandoned,
// is_counted_as_completed = false. Доступ НЕ списывается.
//
// Если длительность аудио не заполнена в базе — страховочный порог 3 часа
// (самое длинное аудио — Альфа, больше часа; 3ч заведомо с запасом).

const {
  getAllStartedSessions,
  getAudioDurationSeconds,
  abandonSession,
} = require('../db/sessions');
const { getUserById, setActiveUnfinishedProcedure, updateUserStatus } = require('../db/users');

const GRACE_MS = 30 * 60 * 1000;           // +30 минут по ТЗ
const FALLBACK_DURATION_S = 3 * 60 * 60;   // если duration_seconds пуст

let isRunning = false;

async function runAbandonedSessionsCron() {
  if (isRunning) return;
  isRunning = true;
  try {
    const sessions = await getAllStartedSessions();
    if (!sessions.length) return;

    const now = Date.now();
    for (const session of sessions) {
      try {
        const startedAt = session.started_at != null
          ? new Date(session.started_at).getTime()
          : NaN;
        if (!Number.isFinite(startedAt)) continue;

        const durationS = (await getAudioDurationSeconds(session.procedure_id)) || FALLBACK_DURATION_S;
        const deadline = startedAt + durationS * 1000 + GRACE_MS;
        if (now <= deadline) continue;

        const marked = await abandonSession(session.id);
        if (!marked) continue; // сессию успели завершить/прервать параллельно

        console.log(`[cron:abandoned] session ${session.id} → abandoned (started ${session.started_at})`);

        const user = await getUserById(session.user_id);
        if (user) {
          await setActiveUnfinishedProcedure(user.id, false);
          // Статус трогаем только если он «завис» на процедуре —
          // Альфа и другие состояния не задеваются
          if (user.user_status === 'procedure_in_progress') {
            await updateUserStatus(user.telegram_id, 'procedure_interrupted');
          }
        }
      } catch (err) {
        console.error(`[cron:abandoned] error on session ${session.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[cron:abandoned] unexpected error:', err.message);
  } finally {
    isRunning = false;
  }
}

module.exports = { runAbandonedSessionsCron };
