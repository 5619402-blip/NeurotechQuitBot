const config = require('../../config');
const { getPendingReviews, updateReviewModerationStatus } = require('../../db/userReviews');
const { createGiftToken } = require('../../db/giftTokens');

const GIFT_TYPE_MAP = {
  single: 'gift_single_procedure',
  full:   'gift_full_access',
  alpha:  'gift_alpha',
  test:   'gift_test_access',
};

const GIFT_TYPE_LABELS = {
  gift_single_procedure: 'Одна процедура',
  gift_full_access:      'Полный доступ',
  gift_alpha:            'Альфа-процедура',
  gift_test_access:      'Тестовый доступ',
};

const GIFT_DURATION_MS = {
  '24h': 24 * 60 * 60 * 1000,
  '3d':  3 * 24 * 60 * 60 * 1000,
  '7d':  7 * 24 * 60 * 60 * 1000,
};

function isAdmin(telegramId) {
  return config.adminTelegramIds.includes(String(telegramId));
}

module.exports = (bot) => {

  bot.command('gift', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    if (ctx.chat.type !== 'private') return;

    const parts = ctx.message.text.trim().split(/\s+/);
    const typeInput = parts[1];
    const durationInput = parts[2];
    const comment = parts.slice(3).join(' ') || null;

    const giftAccessType = GIFT_TYPE_MAP[typeInput];
    if (!giftAccessType) {
      return ctx.reply(
        'Неверный тип доступа. Допустимые значения: single, full, alpha, test\n\n' +
        'Пример: /gift full 7d Комментарий'
      );
    }

    const durationMs = GIFT_DURATION_MS[durationInput];
    if (!durationMs) {
      return ctx.reply(
        'Неверная длительность. Допустимые значения: 24h, 3d, 7d\n\n' +
        'Пример: /gift full 7d Комментарий'
      );
    }

    const expiresAt = new Date(Date.now() + durationMs);

    let tokenRow;
    try {
      tokenRow = await createGiftToken({
        adminId: ctx.from.id,
        giftAccessType,
        expiresAt,
        adminComment: comment,
      });
    } catch (err) {
      console.error('[admin] /gift createGiftToken:', err.message);
      return ctx.reply('Ошибка при создании токена. Попробуйте снова.');
    }

    const botUsername = ctx.botInfo?.username;
    const link = `https://t.me/${botUsername}?start=${tokenRow.token}`;
    const expires = expiresAt.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });

    const lines = [
      'Подарочная ссылка создана.',
      `Тип: ${GIFT_TYPE_LABELS[giftAccessType]}`,
      `Действует до: ${expires} (МСК)`,
    ];
    if (comment) lines.push(`Комментарий: ${comment}`);
    lines.push('', link);

    await ctx.reply(lines.join('\n'));
  });

  bot.command('reviews_pending', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;

    let reviews;
    try {
      reviews = await getPendingReviews();
    } catch (e) {
      console.error('[admin] getPendingReviews:', e.message);
      return ctx.reply('Ошибка при получении отзывов.');
    }

    if (!reviews.length) {
      return ctx.reply('Нет отзывов на модерации.');
    }

    const lines = reviews.map(r => {
      const date = new Date(r.created_at).toISOString().slice(0, 10);
      const text = r.text ? `"${r.text.slice(0, 200)}"` : '[без текста]';
      return `ID: ${r.id} | Тип: ${r.review_type} | ${date}\n${text}`;
    });

    await ctx.reply(`Отзывы на модерации (${reviews.length}):\n\n${lines.join('\n\n---\n\n')}`);
  });

  bot.command('review_approve', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;

    const parts = ctx.message.text.trim().split(/\s+/);
    const id = parseInt(parts[1], 10);
    if (!id || isNaN(id)) return ctx.reply('Укажите ID: /review_approve 123');

    try {
      const count = await updateReviewModerationStatus(id, 'approved');
      if (!count) return ctx.reply(`Отзыв ${id} не найден.`);
      await ctx.reply(`Отзыв ${id} одобрен.`);
    } catch (e) {
      console.error('[admin] review_approve:', e.message);
      await ctx.reply('Ошибка при обновлении отзыва.');
    }
  });

  bot.command('review_reject', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;

    const parts = ctx.message.text.trim().split(/\s+/);
    const id = parseInt(parts[1], 10);
    if (!id || isNaN(id)) return ctx.reply('Укажите ID: /review_reject 123');

    try {
      const count = await updateReviewModerationStatus(id, 'rejected');
      if (!count) return ctx.reply(`Отзыв ${id} не найден.`);
      await ctx.reply(`Отзыв ${id} отклонён.`);
    } catch (e) {
      console.error('[admin] review_reject:', e.message);
      await ctx.reply('Ошибка при обновлении отзыва.');
    }
  });

};
