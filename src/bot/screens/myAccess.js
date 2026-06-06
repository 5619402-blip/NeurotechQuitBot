const { Markup } = require('telegraf');
const { getAccessRights, getProtocolProgress } = require('../../db/access');

const PROCEDURE_NAMES = {
  anti_tobacco:       'Анти-табак',
  quick_lever:        'Быстрый рычаг',
  alpha:              'Альфа',
  short_quick_lever:  'Закрепление: Быстрый рычаг',
  short_anti_tobacco: 'Закрепление: Антитабак',
};

const STATUS_LABELS = {
  paid_single:            'Доступ открыт',
  paid_full:              'Полный доступ открыт',
  rules_watched:          'Правила просмотрены',
  preparation_started:    'Подготовка к процедуре',
  protocol_active:        'Протокол активен',
  waiting_next_procedure: 'Ожидание следующей процедуры',
  procedure_completed:    'Процедура завершена',
  protocol_paused:        'Протокол приостановлен',
  followup_pending:       'Запланирован follow-up',
  protocol_completed:     'Протокол завершён',
};

const ACCESS_ERROR_TEXT =
  'Не удалось загрузить данные доступа. ' +
  'Попробуйте позже или обратитесь в поддержку.';

const accessErrorKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Поддержка', 'my_access:support')],
  [Markup.button.callback('Главное меню', 'my_access:menu')],
]);

const PAUSED_NO_ACCESS_TEXT =
  'Сессия приостановлена.\n\n' +
  'Вы пока не открыли доступ к протоколу. ' +
  'Вы можете вернуться к диагностике или перейти в главное меню.';

const pausedNoAccessKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Пройти диагностику', 'welcome:diagnostic')],
  [Markup.button.callback('Вернуться к началу', 'my_access:to_welcome')],
]);

const BANNER_PAUSED =
  '\n\nПротокол приостановлен. Вы можете продолжить, когда будете готовы.';

const BANNER_COMPLETED =
  '\n\nПоследняя процедура завершена. Чтобы продолжить, нажмите «Продолжить протокол».';

const BANNER_FOLLOWUP =
  '\n\nУ вас запланирован контрольный follow-up. ' +
  'Пока вы можете продолжить доступные действия.';

const bannerKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Продолжить протокол', 'my_access:continue_protocol')],
  [Markup.button.callback('Поддержка', 'my_access:support')],
  [Markup.button.callback('Главное меню', 'my_access:menu')],
]);

function formatUnlockDate(unlockAt) {
  const m = new Date(new Date(unlockAt).getTime() + 3 * 60 * 60 * 1000);
  const day   = String(m.getUTCDate()).padStart(2, '0');
  const month = String(m.getUTCMonth() + 1).padStart(2, '0');
  const year  = m.getUTCFullYear();
  const hours = String(m.getUTCHours()).padStart(2, '0');
  const mins  = String(m.getUTCMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} в ${hours}:${mins} (МСК)`;
}

function formatTimeLeft(unlockAt) {
  const msLeft = new Date(unlockAt) - Date.now();
  if (msLeft <= 0) return '0 мин';
  const totalMinutes = Math.ceil(msLeft / 60000);
  const hours   = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} мин`;
  if (minutes === 0) return `${hours} ч`;
  return `${hours} ч ${minutes} мин`;
}

function isProtocolLocked(progress) {
  if (!progress?.next_procedure_unlocks_at) return false;
  return new Date(progress.next_procedure_unlocks_at) > new Date();
}

function nextProcedureName(progress) {
  const type = progress?.next_procedure_type ?? 'anti_tobacco';
  return PROCEDURE_NAMES[type] ?? 'Анти-табак';
}

function buildNextStepText(progress) {
  const step = progress?.current_step_number ?? 0;
  if (step >= 5) {
    return (
      'Основной цикл протокола завершён.\n' +
      'Вы прошли все основные этапы NeuroTech Quit.'
    );
  }
  if (isProtocolLocked(progress)) {
    const name = nextProcedureName(progress);
    const dateStr = formatUnlockDate(progress.next_procedure_unlocks_at);
    const timeLeftStr = formatTimeLeft(progress.next_procedure_unlocks_at);
    return (
      `Следующий этап: ${name}\n\n` +
      `Он откроется: ${dateStr}\n\n` +
      `Осталось примерно: ${timeLeftStr}\n\n` +
      'Это нужно, чтобы между этапами протокола прошло достаточно времени.'
    );
  }
  return `Следующий этап доступен: ${nextProcedureName(progress)}`;
}

function buildFullAccessText(user, progress, ar) {
  const statusLabel = STATUS_LABELS[user.user_status] ?? user.user_status;
  return (
    'Мой доступ\n\n' +
    'У вас открыт полный доступ NeuroTech Quit.\n\n' +
    'Вы можете продолжать основной протокол, проходить дополнительные процедуры по состоянию ' +
    'и использовать Альфа-процедуру для поддержки состояния.\n\n' +
    `Текущий статус: ${statusLabel}\n` +
    `Пройдено процедур: ${ar.used_main_procedures_count ?? 0}\n\n` +
    buildNextStepText(progress)
  );
}

function buildSingleProcedureText(user, ar) {
  const alphaAvail = ar.available_alpha_sessions_count ?? '∞';
  return (
    'Мой доступ\n\n' +
    'У вас открыт доступ по тарифу «Одна процедура».\n\n' +
    `Оплачено основных процедур: ${ar.paid_main_procedures_count}\n` +
    `Пройдено основных процедур: ${ar.used_main_procedures_count}\n` +
    `Альфа-сессий доступно: ${alphaAvail}\n` +
    `Альфа-сессий пройдено: ${ar.used_alpha_sessions_count}\n\n` +
    'Если оплаченная процедура доступна, вы можете продолжить протокол. ' +
    'Если оплаченные процедуры закончились, вы можете оплатить следующую процедуру ' +
    'или перейти на полный доступ.'
  );
}

function buildFullAccessKeyboard(progress) {
  const step = progress?.current_step_number ?? 0;
  const locked = isProtocolLocked(progress);
  const showContinue = step < 5 && !locked;

  const buttons = [];
  if (showContinue) {
    buttons.push([Markup.button.callback('Продолжить протокол', 'my_access:continue_protocol')]);
  }
  buttons.push([Markup.button.callback('Альфа-процедура', 'my_access:alpha')]);
  buttons.push([Markup.button.callback('Поддержка', 'my_access:support')]);
  buttons.push([Markup.button.callback('Главное меню', 'my_access:menu')]);
  return Markup.inlineKeyboard(buttons);
}

function buildSingleProcedureKeyboard(ar) {
  const hasAvailableProcedure = ar.paid_main_procedures_count > ar.used_main_procedures_count;
  // NULL = безлимит только для full_access; для single_procedure всегда числовое значение
  const alphaAvailable = ar.available_alpha_sessions_count !== null
    && ar.available_alpha_sessions_count > ar.used_alpha_sessions_count;

  const buttons = [];

  if (hasAvailableProcedure) {
    buttons.push([Markup.button.callback('Продолжить протокол', 'my_access:continue_protocol')]);
  } else {
    buttons.push([Markup.button.callback('Оплатить следующую процедуру — 990 ₽', 'my_access:pay_next')]);
  }

  if (ar.upgrade_available) {
    buttons.push([Markup.button.callback('Доплатить до полного доступа — 3 910 ₽', 'my_access:upgrade')]);
  }

  if (alphaAvailable) {
    buttons.push([Markup.button.callback('Альфа-процедура', 'my_access:alpha')]);
  }

  buttons.push([Markup.button.callback('Поддержка', 'my_access:support')]);
  buttons.push([Markup.button.callback('Главное меню', 'my_access:menu')]);

  return Markup.inlineKeyboard(buttons);
}

async function sendScreen(ctx, text, keyboard) {
  try {
    await ctx.editMessageText(text, keyboard);
  } catch {
    await ctx.reply(text, keyboard);
  }
}

async function showMyAccess(ctx, user) {
  if (!user?.id) {
    return sendScreen(ctx, ACCESS_ERROR_TEXT, accessErrorKeyboard);
  }

  const [ar, progress] = await Promise.all([
    getAccessRights(user.id),
    getProtocolProgress(user.id),
  ]);

  if (!ar) {
    if (user.user_status === 'protocol_paused') {
      return sendScreen(ctx, PAUSED_NO_ACCESS_TEXT, pausedNoAccessKeyboard);
    }
    return sendScreen(ctx, ACCESS_ERROR_TEXT, accessErrorKeyboard);
  }

  const status = user.user_status;
  const isFullAccess = user.access_type === 'full_access';
  const baseText = isFullAccess
    ? buildFullAccessText(user, progress, ar)
    : buildSingleProcedureText(user, ar);

  if (isFullAccess) {
    const faKeyboard = buildFullAccessKeyboard(progress);
    if (status === 'protocol_paused') {
      return sendScreen(ctx, baseText + BANNER_PAUSED, faKeyboard);
    }
    if (status === 'followup_pending') {
      return sendScreen(ctx, baseText + BANNER_FOLLOWUP, faKeyboard);
    }
    return sendScreen(ctx, baseText, faKeyboard);
  }

  if (status === 'protocol_paused') {
    return sendScreen(ctx, baseText + BANNER_PAUSED, bannerKeyboard);
  }
  if (status === 'procedure_completed') {
    return sendScreen(ctx, baseText + BANNER_COMPLETED, bannerKeyboard);
  }
  if (status === 'followup_pending') {
    return sendScreen(ctx, baseText + BANNER_FOLLOWUP, buildSingleProcedureKeyboard(ar));
  }
  return sendScreen(ctx, baseText, buildSingleProcedureKeyboard(ar));
}

module.exports = { showMyAccess };
