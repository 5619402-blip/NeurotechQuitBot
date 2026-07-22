// Общая логика завершения/прерывания процедуры.
// Используется двумя путями:
//  1) server callback от плеера (клиент дослушал аудио / нажал «Экстренно выйти»)
//  2) тест-кнопки админов player_stub:* в callbacks.js
// Бухгалтерия (списание доступа, шаг протокола, статусы) — здесь, в одном месте.

const { Markup } = require('telegraf');
const { getUserById, setActiveUnfinishedProcedure, updateUserStatus, setLastBotMessageId } = require('../db/users');
const { getSessionById, getProcedureById, completeSession, interruptSession } = require('../db/sessions');
const {
  getProtocolProgress,
  incrementUsedMain,
  incrementUsedAlpha,
  upsertProtocolProgress,
  getStepIntervalAfterMs,
} = require('../db/access');

// Тексты дублируют экраны postProcedureWait/postProcedure/procedureInterrupted —
// здесь они отправляются НОВЫМ сообщением через bot.telegram (без ctx).
const POST_PROCEDURE_TEXT =
  'Процедура завершена.\n\n' +
  'Сейчас важно наблюдать за своим состоянием. Воздержитесь от никотина ' +
  'и старайтесь не возвращаться к триггерам. Если возникнет тяга — ' +
  'вспомните заключительную часть процедуры.';

const ALPHA_POST_PROCEDURE_TEXT =
  'Альфа-процедура завершена.\n\n' +
  'Сейчас важно спокойно наблюдать за своим состоянием и дать эффекту процедуры закрепиться.\n\n' +
  'Альфа-процедуру можно использовать между этапами основного протокола или после его завершения, ' +
  'если нужна дополнительная поддержка, снижение напряжения и возвращение к более спокойному состоянию.\n\n' +
  'Сейчас вы можете вернуться в «Мой доступ».';

const INTERRUPTED_TEXT =
  'Процедура была прервана. ' +
  'Для корректного результата её нужно будет пройти заново с самого начала.';

const SINGLE_INTERRUPTED_TEXT =
  'Процедура не завершена.\n\n' +
  'Вы начали оплаченную процедуру, но не завершили её. Она ещё не считается пройденной.\n\n' +
  'Чтобы вернуться к процедуре, нужно заново пройти короткую подготовку. ' +
  'Это важно, чтобы запуск был корректным и безопасным.';

// Бухгалтерия завершения. Возвращает { ok, procedureType, user } или { ok:false, reason }.
// Идемпотентно: если сессия уже не 'started' — ничего не делает.
async function applyCompletion(sessionId) {
  const session = await getSessionById(sessionId);
  if (!session) return { ok: false, reason: 'session_not_found' };
  if (session.session_status !== 'started') return { ok: false, reason: 'not_started' };

  const user = await getUserById(session.user_id);
  if (!user) return { ok: false, reason: 'user_not_found' };

  const procedure = await getProcedureById(session.procedure_id);
  if (!procedure) return { ok: false, reason: 'procedure_not_found' };

  const procedureType = procedure.procedure_type;

  await completeSession(sessionId);

  if (procedureType === 'alpha') {
    await incrementUsedAlpha(user.id);
  } else {
    await incrementUsedMain(user.id);
    const progress = await getProtocolProgress(user.id);
    const completedStep = progress?.current_step_number ?? 0;
    const intervalMs = getStepIntervalAfterMs(completedStep);
    const unlockAt = intervalMs !== null ? new Date(Date.now() + intervalMs) : null;
    await upsertProtocolProgress(user.id, procedureType, completedStep, unlockAt);
  }

  await setActiveUnfinishedProcedure(user.id, false);
  await updateUserStatus(user.telegram_id, 'procedure_completed');

  return { ok: true, procedureType, user };
}

// Бухгалтерия прерывания. Идемпотентно.
async function applyInterruption(sessionId) {
  const session = await getSessionById(sessionId);
  if (!session) return { ok: false, reason: 'session_not_found' };
  if (session.session_status !== 'started') return { ok: false, reason: 'not_started' };

  const user = await getUserById(session.user_id);
  if (!user) return { ok: false, reason: 'user_not_found' };

  await interruptSession(sessionId);
  await setActiveUnfinishedProcedure(user.id, false);
  await updateUserStatus(user.telegram_id, 'procedure_interrupted');

  return { ok: true, user };
}

// Правило продукта: на экране всегда ОДНО сообщение бота. Поэтому сначала
// пробуем ОТРЕДАКТИРОВАТЬ последнее сообщение (его id хранится в users),
// и только если не вышло — шлём новое (и запоминаем его id).
async function sendScreenViaBot(bot, user, text, keyboard) {
  const chatId = user.telegram_id;
  const lastId = user.last_bot_message_id;
  if (lastId) {
    try {
      await bot.telegram.editMessageText(chatId, lastId, undefined, text, keyboard);
      return;
    } catch {
      // сообщение могло быть удалено/устареть — падаем на отправку нового
    }
  }
  try {
    const msg = await bot.telegram.sendMessage(chatId, text, keyboard);
    if (msg?.message_id) {
      await setLastBotMessageId(chatId, msg.message_id).catch(() => {});
    }
  } catch (err) {
    console.error('[completion] send failed:', err.message);
  }
}

// Завершение по callback от плеера: бухгалтерия + бот САМ показывает следующий экран.
async function completeFromPlayer(bot, sessionId) {
  const result = await applyCompletion(sessionId);
  if (!result.ok) return result;

  const { procedureType, user } = result;
  if (procedureType === 'alpha') {
    await sendScreenViaBot(bot, user, ALPHA_POST_PROCEDURE_TEXT, Markup.inlineKeyboard([
      [Markup.button.callback('Перейти в Мой доступ', 'post_procedure_wait:to_access')],
    ]));
  } else {
    await sendScreenViaBot(bot, user, POST_PROCEDURE_TEXT, Markup.inlineKeyboard([
      [Markup.button.callback('Далее', `postProcedure:next:${sessionId}`)],
    ]));
  }
  return result;
}

// Прерывание по callback от плеера («Экстренно выйти»).
async function interruptFromPlayer(bot, sessionId) {
  const result = await applyInterruption(sessionId);
  if (!result.ok) return result;

  const { user } = result;
  const isSingle = user.access_type === 'single_procedure';
  const text = isSingle ? SINGLE_INTERRUPTED_TEXT : INTERRUPTED_TEXT;
  const keyboard = isSingle
    ? Markup.inlineKeyboard([
        [Markup.button.callback('Начать процедуру заново', 'single_interrupted:restart')],
        [Markup.button.callback('Вернуться позже', 'single_interrupted:later')],
        [Markup.button.callback('Главное меню', 'single_interrupted:menu')],
      ])
    : Markup.inlineKeyboard([
        [Markup.button.callback('Пройти заново сейчас', 'procedure_interrupted:restart')],
        [Markup.button.callback('Вернуться позже', 'procedure_interrupted:later')],
      ]);
  await sendScreenViaBot(bot, user, text, keyboard);
  return result;
}

module.exports = { applyCompletion, applyInterruption, completeFromPlayer, interruptFromPlayer };
