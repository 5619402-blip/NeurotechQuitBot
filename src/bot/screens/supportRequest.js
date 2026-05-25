const { Markup } = require('telegraf');

const SUPPORT_REQUEST_TEXT =
  'Поддержка NeuroTech\n\n' +
  'Опишите ваш вопрос одним сообщением — мы сохраним обращение ' +
  'и вернёмся с ответом, когда поддержка будет доступна.';

const supportRequestKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Отмена', 'support:cancel')],
]);

async function showSupportRequest(ctx) {
  try {
    await ctx.editMessageText(SUPPORT_REQUEST_TEXT, supportRequestKeyboard);
  } catch {
    await ctx.reply(SUPPORT_REQUEST_TEXT, supportRequestKeyboard);
  }
}

module.exports = { showSupportRequest };
