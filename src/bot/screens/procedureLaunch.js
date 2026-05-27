const { Markup } = require('telegraf');
const config = require('../../config');
const { getMuxPlaybackId } = require('../../mux/playbackIds');
const { generateMuxPlaybackToken } = require('../../mux/token');

// Legacy: presigned URL через Yandex Object Storage — больше не используется как основной путь.
// Оставлено для справки. Удалить после полного перехода на Mux.
// const { getPlayerToken } = require('../../db/playerTokens');
// const { generatePresignedUrl } = require('../../storage/presignedUrl');
// async function buildPresignedUrl(token) {
//   const row = await getPlayerToken(token);
//   if (!row?.storage_path) throw new Error('storage_path не найден для токена');
//   return generatePresignedUrl(row.storage_path);
// }

function buildLaunchUrl(procedureType) {
  const playbackId = getMuxPlaybackId(procedureType);
  const token = generateMuxPlaybackToken(playbackId);
  const base = config.playerBaseUrl;
  if (!base) throw new Error('PLAYER_BASE_URL не задан');
  return `${base}/player?procedure=${procedureType}&playbackId=${playbackId}&token=${token}`;
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

async function showProcedureLaunch(ctx, { procedureType, sessionId }) {
  let url;
  try {
    url = buildLaunchUrl(procedureType);
  } catch (err) {
    console.error('[procedureLaunch] ошибка генерации ссылки:', err.message);
    await sendScreen(
      ctx,
      'Процедура временно недоступна. Напишите поддержке.',
      buildLaunchKeyboard(sessionId)
    );
    return;
  }
  await sendScreen(ctx, buildLaunchText(url), buildLaunchKeyboard(sessionId));
}

module.exports = { showProcedureLaunch };
