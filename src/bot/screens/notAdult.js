const { Markup } = require('telegraf');
const { updateUserStatus } = require('../../db/users');

const NOT_ADULT_TEXT =
  'Сейчас протокол NeuroTech Quit доступен только пользователям от 18 лет.\n\n' +
  'Если вам ещё нет 18 лет, пожалуйста, не продолжайте прохождение и обсудите ' +
  'вопрос отказа от никотина с родителями, законным представителем или специалистом.';

const notAdultKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Вернуться к началу', 'welcome:show')],
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
