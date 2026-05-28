const { Markup } = require('telegraf');
const { createPlayerToken } = require('../../db/playerTokens');
const { getUserByTelegramId } = require('../../db/users');
const publicUrl = require('../../tunnel/publicUrl');

// Legacy: presigned URL через Yandex Object Storage — больше не используется как основной путь.
// Оставлено для справки. Удалить после полного перехода на Mux.
// const { getPlayerToken } = require('../../db/playerTokens');
// const { generatePresignedUrl } = require('../../storage/presignedUrl');
// async function buildPresignedUrl(token) {
//   const row = await getPlayerToken(token);
//   if (!row?.storage_path) throw new Error('storage_path не найден для токена');
//   return generatePresignedUrl(row.storage_path);
// }

async function buildLaunchUrl(ctx, sessionId) {
  const botApiUrl = publicUrl.get();
  if (!botApiUrl) throw new Error('Tunnel URL не готов — повторите позже');

  const user = await getUserByTelegramId(ctx.from.id);
  if (!user?.id) throw new Error('Пользователь не найден');

  const playerToken = await createPlayerToken(user.id, sessionId);
  if (!playerToken) throw new Error('Не удалось создать токен запуска');

  return `${botApiUrl}/launch/${playerToken.token}`;
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
    url = await buildLaunchUrl(ctx, sessionId);
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
