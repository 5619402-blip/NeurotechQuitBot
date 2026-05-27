const { Markup } = require('telegraf');
const { getActiveReviews } = require('../../db/reviews');

const emptyKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Пройти диагностику', 'reviews:diagnostic')],
  [Markup.button.callback('Назад', 'reviews:back')],
]);

function buildReviewText(r, index, total) {
  const parts = [];
  if (r.client_name) parts.push(r.client_name);
  if (r.description) parts.push(r.description);
  if (r.source) parts.push(`Источник: ${r.source}`);
  parts.push(`${index + 1} / ${total}`);
  return parts.join('\n');
}

function buildReviewsKeyboard(index, total) {
  const nav = [];
  if (index > 0) nav.push(Markup.button.callback('⬅️ Предыдущий', `reviews:show:${index - 1}`));
  if (index < total - 1) nav.push(Markup.button.callback('➡️ Следующий', `reviews:show:${index + 1}`));
  const buttons = [];
  if (nav.length) buttons.push(nav);
  buttons.push([Markup.button.callback('Пройти диагностику', 'reviews:diagnostic')]);
  buttons.push([Markup.button.callback('Назад', 'reviews:back')]);
  return Markup.inlineKeyboard(buttons);
}

async function showReviews(ctx, index = 0) {
  let reviews;
  try {
    reviews = await getActiveReviews();
  } catch (e) {
    console.error('[reviews] DB error:', e.message);
    reviews = [];
  }

  if (!reviews.length) {
    try {
      await ctx.editMessageText('Отзывов пока нет.', emptyKeyboard);
    } catch {
      await ctx.reply('Отзывов пока нет.', emptyKeyboard);
    }
    return;
  }

  const total = reviews.length;
  const i = Math.max(0, Math.min(index, total - 1));
  const r = reviews[i];
  const text = buildReviewText(r, i, total);
  const keyboard = buildReviewsKeyboard(i, total);

  try { await ctx.deleteMessage(); } catch {}

  if (r.telegram_file_id) {
    await ctx.replyWithVideo(r.telegram_file_id, {
      caption: text,
      reply_markup: keyboard.reply_markup,
    });
  } else {
    await ctx.reply(text, keyboard);
  }
}

module.exports = { showReviews };
