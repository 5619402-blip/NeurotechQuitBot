const { Markup } = require('telegraf');

const SESSION_PAUSED_TEXT =
  'Хорошо. Вы можете вернуться к NeuroTech Quit позже. ' +
  'Когда будете готовы, просто откройте бот снова — ' +
  'мы продолжим с того места, где вы остановились.';

const sessionPausedKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Вернуться в главное меню', 'session_paused:menu')],
  [Markup.button.callback('Пройти диагностику заново', 'session_paused:rediag')],
]);

async function showSessionPaused(ctx) {
  try {
    await ctx.editMessageText(SESSION_PAUSED_TEXT, sessionPausedKeyboard);
  } catch {
    await ctx.reply(SESSION_PAUSED_TEXT, sessionPausedKeyboard);
  }
}

module.exports = { showSessionPaused };
