const { Markup } = require('telegraf');

function formatUnlockDate(unlockAt) {
  const d = new Date(unlockAt);
  const m = new Date(d.getTime() + 3 * 60 * 60 * 1000); // UTC+3 МСК
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

async function showProcedureLockedWait(ctx, unlockAt) {
  const dateStr     = formatUnlockDate(unlockAt);
  const timeLeftStr = formatTimeLeft(unlockAt);

  const text =
    'Следующий этап пока закрыт.\n\n' +
    `Процедура откроется: ${dateStr}\n\n` +
    `Осталось примерно: ${timeLeftStr}\n\n` +
    'Это нужно, чтобы между этапами протокола прошло достаточно времени.';

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Мой доступ', 'locked_wait:access')],
    [Markup.button.callback('Главное меню', 'locked_wait:menu')],
  ]);

  try {
    await ctx.editMessageText(text, keyboard);
  } catch {
    await ctx.reply(text, keyboard);
  }
}

module.exports = { showProcedureLockedWait };
