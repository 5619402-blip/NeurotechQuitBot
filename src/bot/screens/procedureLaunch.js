const { Markup } = require('telegraf');
const config = require('../../config');
const { getPlayerToken } = require('../../db/playerTokens');
const { generatePresignedUrl } = require('../../storage/presignedUrl');

const PLACEHOLDER_URL = 'https://player.example.com';

async function buildLaunchUrl(token) {
  const baseUrl = config.playerBaseUrl;
  if (baseUrl && baseUrl !== PLACEHOLDER_URL) {
    return `${baseUrl}?token=${token}`;
  }

  const row = await getPlayerToken(token);
  if (!row?.storage_path) {
    throw new Error('storage_path не найден для токена');
  }
  return generatePresignedUrl(row.storage_path);
}

function buildLaunchText(url) {
  return (
    'Процедура готова к запуску.\n\n' +
    `Ссылка на процедуру:\n${url}\n\n` +
    'Ссылка действительна ограниченное время. Откройте её и пройдите процедуру полностью.'
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
  let url;
  try {
    url = await buildLaunchUrl(token);
  } catch (err) {
    console.error('[procedureLaunch] ошибка генерации ссылки:', err.message);
    await sendScreen(
      ctx,
      'Не удалось создать ссылку на процедуру. Попробуйте позже.',
      buildLaunchKeyboard(sessionId)
    );
    return;
  }
  await sendScreen(ctx, buildLaunchText(url), buildLaunchKeyboard(sessionId));
}

module.exports = { showProcedureLaunch };
