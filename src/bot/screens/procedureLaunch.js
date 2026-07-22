const { Markup } = require('telegraf');
const config = require('../../config');
const { createPlayerToken } = require('../../db/playerTokens');
const { getUserByTelegramId } = require('../../db/users');
const publicUrl = require('../../tunnel/publicUrl');

async function buildLaunchUrl(ctx, sessionId) {
  const botApiUrl = publicUrl.get();
  if (!botApiUrl) throw new Error('Tunnel URL не готов — повторите позже');

  const user = await getUserByTelegramId(ctx.from.id);
  if (!user?.id) throw new Error('Пользователь не найден');

  const playerToken = await createPlayerToken(user.id, sessionId);
  if (!playerToken) throw new Error('Не удалось создать токен запуска');

  return `${botApiUrl}/launch/${playerToken.token}`;
}

// Ссылка НЕ вставляется в текст сообщения: Telegram делает предпросмотр
// текстовых ссылок и «трогает» URL со своих серверов. Ссылка уходит только
// кнопкой — кнопочные URL Telegram не предзагружает.
const LAUNCH_TEXT =
  'Процедура готова к запуску.\n\n' +
  'Нажмите кнопку ниже, чтобы открыть защищённый плеер. ' +
  'Ссылка одноразовая и действует 5 минут — откройте её сразу.\n\n' +
  'Наденьте наушники и пройдите процедуру полностью, без остановок.';

// Тест-кнопки видят ТОЛЬКО админы (Альберт, Юля) — клиенты видят одну кнопку плеера.
// Завершение для клиентов бот узнаёт сам: плеер шлёт подписанный callback (см. player/server.js).
function buildLaunchKeyboard(sessionId, url, isAdmin) {
  const rows = [];
  if (url) rows.push([Markup.button.url('▶ Открыть процедуру', url)]);
  if (isAdmin) {
    rows.push([Markup.button.callback('Завершить процедуру (тест)', `player_stub:completed:${sessionId}`)]);
    rows.push([Markup.button.callback('Экстренно выйти (тест)', `player_stub:interrupted:${sessionId}`)]);
  }
  return Markup.inlineKeyboard(rows);
}

async function sendScreen(ctx, text, keyboard) {
  try {
    await ctx.editMessageText(text, keyboard);
  } catch {
    await ctx.reply(text, keyboard);
  }
}

async function showProcedureLaunch(ctx, { procedureType, sessionId }) {
  const isAdmin = config.adminTelegramIds.includes(String(ctx.from.id));
  let url;
  try {
    url = await buildLaunchUrl(ctx, sessionId);
  } catch (err) {
    console.error('[procedureLaunch] ошибка генерации ссылки:', err.message);
    await sendScreen(
      ctx,
      'Процедура временно недоступна. Напишите поддержке.',
      buildLaunchKeyboard(sessionId, null, isAdmin)
    );
    return;
  }
  await sendScreen(ctx, LAUNCH_TEXT, buildLaunchKeyboard(sessionId, url, isAdmin));
}

module.exports = { showProcedureLaunch };
