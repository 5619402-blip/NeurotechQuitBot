const { Markup } = require('telegraf');
const { updateUserStatus } = require('../../db/users');

const NOT_READY_TEXT =
  'Похоже, сейчас вы ещё не до конца готовы отказаться от никотина. Это нормально.\n\n' +
  'Для прохождения технологии важно, чтобы решение было вашим и достаточно внутренне зрелым.\n\n' +
  'Вы можете вернуться позже, когда почувствуете больше готовности. Тогда начните диагностику заново.';

const notReadyKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Вернуться на главный экран', 'welcome:show')],
]);

async function showNotReady(ctx) {
  updateUserStatus(ctx.from.id, 'new').catch(e =>
    console.error('[notReady] updateStatus:', e.message)
  );
  try {
    await ctx.editMessageText(NOT_READY_TEXT, notReadyKeyboard);
  } catch {
    await ctx.reply(NOT_READY_TEXT, notReadyKeyboard);
  }
}

module.exports = { showNotReady };
