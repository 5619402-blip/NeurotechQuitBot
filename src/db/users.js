const db = require('./connection');

// Возвращает пользователя из БД по telegram_id.
// Если пользователь не найден — возвращает объект-заглушку со статусом 'new',
// чтобы router.js мог обработать без проверки на null (раздел 4, docs/TZ_v4.md).
// Реальное создание пользователя — upsertUser(), вызывается на Шаге 4.
async function getUserById(id) {
  try {
    return await db('users').where({ id }).first() ?? null;
  } catch (err) {
    console.error('[db] getUserById:', err.message);
    return null;
  }
}

async function getUserByTelegramId(telegramId) {
  const user = await db('users').where({ telegram_id: telegramId }).first();
  return user ?? { telegram_id: telegramId, user_status: 'new' };
}

// Создаёт пользователя при первом входе или обновляет last_activity_at при повторном.
// Используется в обработчике /start на Шаге 4 Приложения Б.
async function upsertUser({ telegramId, username, firstName }) {
  const existing = await db('users').where({ telegram_id: telegramId }).first();

  if (existing) {
    await db('users')
      .where({ telegram_id: telegramId })
      .update({ last_activity_at: db.fn.now(), username, first_name: firstName });
    return db('users').where({ telegram_id: telegramId }).first();
  }

  const [user] = await db('users')
    .insert({
      telegram_id: telegramId,
      username,
      first_name: firstName,
      user_status: 'new',
      created_at: db.fn.now(),
      last_activity_at: db.fn.now(),
    })
    .returning('*');

  return user;
}

async function updateUserStatus(telegramId, status) {
  try {
    await db('users')
      .where({ telegram_id: telegramId })
      .update({ user_status: status, last_activity_at: db.fn.now() });
  } catch (err) {
    console.error('[db] updateUserStatus:', err.message);
  }
}

async function setLowReadinessFlag(telegramId) {
  try {
    await db('users')
      .where({ telegram_id: telegramId })
      .update({ maturity_mode_enabled: true, user_status: 'low_motivation', last_activity_at: db.fn.now() });
  } catch (err) {
    console.error('[db] setLowReadinessFlag:', err.message);
  }
}

async function updateUserAfterPayment(telegramId, variant) {
  const statusMap = {
    single:      { user_status: 'paid_single', access_type: 'single_procedure' },
    full:        { user_status: 'paid_full',   access_type: 'full_access' },
    single_next: { user_status: 'paid_single', access_type: 'single_procedure' },
    upgrade:     { user_status: 'paid_full',   access_type: 'full_access' },
  };
  const fields = statusMap[variant];
  if (!fields) return;
  try {
    await db('users')
      .where({ telegram_id: telegramId })
      .update({ ...fields, access_status: 'active', last_activity_at: db.fn.now() });
  } catch (err) {
    console.error('[db] updateUserAfterPayment:', err.message);
  }
}

async function setActiveUnfinishedProcedure(userId, flag) {
  try {
    await db('users')
      .where({ id: userId })
      .update({ has_active_unfinished_procedure: flag, last_activity_at: db.fn.now() });
  } catch (err) {
    console.error('[db] setActiveUnfinishedProcedure:', err.message);
  }
}

async function setPaused(userId, reason) {
  try {
    await db('users')
      .where({ id: userId })
      .update({ user_status: 'protocol_paused', pause_reason: reason, paused_at: db.fn.now(), last_activity_at: db.fn.now() });
  } catch (err) {
    console.error('[db] setPaused:', err.message);
  }
}

const GIFT_ACCESS_MAP = {
  gift_single_procedure: { access_type: 'single_procedure' },
  gift_full_access:      { access_type: 'full_access' },
  gift_alpha:            { access_type: 'none' },
  gift_test_access:      { access_type: 'full_access' },
};

async function setLastBotMessageId(telegramId, messageId) {
  try {
    await db('users')
      .where({ telegram_id: telegramId })
      .update({ last_bot_message_id: messageId });
  } catch (err) {
    console.error('[db] setLastBotMessageId:', err.message);
  }
}

async function setRulesVideoWatched(telegramId) {
  try {
    await db('users')
      .where({ telegram_id: telegramId })
      .update({ rules_video_watched_at: db.fn.now() });
  } catch (err) {
    console.error('[db] setRulesVideoWatched:', err.message);
  }
}

async function updateUserAfterGift(telegramId, giftAccessType) {
  const fields = GIFT_ACCESS_MAP[giftAccessType];
  if (!fields) return;
  try {
    await db('users')
      .where({ telegram_id: telegramId })
      .update({ ...fields, access_status: 'active', last_activity_at: db.fn.now() });
  } catch (err) {
    console.error('[db] updateUserAfterGift:', err.message);
  }
}

module.exports = {
  getUserById,
  getUserByTelegramId,
  upsertUser,
  updateUserStatus,
  setLowReadinessFlag,
  updateUserAfterPayment,
  setActiveUnfinishedProcedure,
  setPaused,
  updateUserAfterGift,
  setLastBotMessageId,
  setRulesVideoWatched,
};
