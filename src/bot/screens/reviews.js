const { Markup } = require('telegraf');
const { getActiveReviews } = require('../../db/reviews');

const reviewsKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Пройти диагностику', 'reviews:diagnostic')],
  [Markup.button.callback('Назад', 'reviews:back')],
]);

async function showReviews(ctx) {
  let text;
  try {
    const reviews = await getActiveReviews();
    if (!reviews.length) {
      text = 'Отзывов пока нет.';
    } else {
      text = reviews.map(r => {
        const parts = [];
        if (r.client_name) parts.push(r.client_name);
        if (r.description) parts.push(r.description);
        if (r.source) parts.push(`Источник: ${r.source}`);
        return parts.join('\n');
      }).join('\n\n');
    }
  } catch (e) {
    console.error('[reviews] DB error:', e.message);
    text = 'Отзывы временно недоступны.';
  }

  try {
    await ctx.editMessageText(text, reviewsKeyboard);
  } catch {
    await ctx.reply(text, reviewsKeyboard);
  }
}

module.exports = { showReviews };
