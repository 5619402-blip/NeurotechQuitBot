const { Markup } = require('telegraf');
const config = require('../../config');

const PLACEHOLDER_URL = 'https://player.example.com';

function buildLaunchText(token) {
  const baseUrl = config.playerBaseUrl;
  const isPlaceholder = !baseUrl || baseUrl === PLACEHOLDER_URL;

  if (isPlaceholder) {
    return 'Плеер процедуры пока не подключён. Тестовый режим активен.';
  }

  return (
    'Процедура готова к запуску.\n\n' +
    `Ссылка на плеер:\n${baseUrl}?token=${token}`
  );
}

function buildLaunchKeyboard(sessionId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Завершить процедуру (тест)', `player_stub:completed:${sessionId}`)],
    [Markup.button.callback('Экстренно выйти (тест)', `player_stub:interrupted:${sessionId}`)],
  ]);
}

async function sendScreen(ctx, text, keyboard) {
  try {
    await ctx.editMessageText(text, keyboard);
  } catch {
    await ctx.reply(text, keyboard);
  }
}

async function showProcedureLaunch(ctx, { token, sessionId }) {
  const text = buildLaunchText(token);
  const keyboard = buildLaunchKeyboard(sessionId);
  await sendScreen(ctx, text, keyboard);
}

module.exports = { showProcedureLaunch };
