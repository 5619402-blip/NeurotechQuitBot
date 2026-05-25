const { Markup } = require('telegraf');
const { updateUserStatus } = require('../../db/users');

const NOT_ADULT_TEXT =
  'NeuroTech Quit рассчитан на пользователей старше 18 лет.\n\n' +
  'К сожалению, мы не можем предоставить доступ к протоколу.';

const notAdultKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Вернуться на главный экран', 'welcome:show')],
]);

async function showNotAdult(ctx) {
  updateUserStatus(ctx.from.id, 'new').catch(e =>
    console.error('[notAdult] updateStatus:', e.message)
  );
  try {
    await ctx.editMessageText(NOT_ADULT_TEXT, notAdultKeyboard);
  } catch {
    await ctx.reply(NOT_ADULT_TEXT, notAdultKeyboard);
  }
}

module.exports = { showNotAdult };
