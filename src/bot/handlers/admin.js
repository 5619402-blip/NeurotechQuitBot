const config = require('../../config');
const { getPendingReviews, updateReviewModerationStatus } = require('../../db/userReviews');
const { createGiftToken } = require('../../db/giftTokens');
const { createAdminPreviewToken } = require('../../db/adminPreviewTokens');
const { getUserByTelegramId } = require('../../db/users');
const publicUrl = require('../../tunnel/publicUrl');

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

const PREVIEW_PROCEDURE_TYPES = ['anti_tobacco', 'quick_lever', 'alpha'];

const PREVIEW_PROCEDURE_LABELS = {
  anti_tobacco: 'Антитабак',
  quick_lever:  'Быстрый рычаг',
  alpha:        'Альфа',
};

async function handleAdminPreviewCommand(ctx) {
  console.log('[admin] admin_preview received from', ctx.from?.id, '| isAdmin:', isAdmin(ctx.from?.id));
  if (!isAdmin(ctx.from.id)) return;
  if (ctx.chat.type !== 'private') return;

  const parts = ctx.message.text.trim().split(/\s+/);
  const typeInput = parts[1];

  if (!typeInput || !PREVIEW_PROCEDURE_TYPES.includes(typeInput)) {
    return ctx.reply(
      'Укажите тип процедуры. Допустимые значения: anti_tobacco, quick_lever, alpha\n\n' +
      'Пример: /admin_preview quick_lever'
    );
  }

  let adminUser;
  try {
    adminUser = await getUserByTelegramId(ctx.from.id);
  } catch (err) {
    console.error('[admin] /admin_preview getUserByTelegramId:', err.message);
    return ctx.reply('Ошибка при поиске вашего аккаунта.');
  }
  if (!adminUser?.id) {
    return ctx.reply('Ваш аккаунт не найден в базе данных бота. Напишите /start сначала.');
  }

  let tokenRow;
  try {
    tokenRow = await createAdminPreviewToken(adminUser.id, typeInput);
  } catch (err) {
    console.error('[admin] /admin_preview createAdminPreviewToken:', err.message);
    return ctx.reply('Ошибка при создании preview-токена. Попробуйте снова.');
  }

  const tunnelUrl = publicUrl.get();
  if (!tunnelUrl) {
    return ctx.reply('Ошибка: tunnel URL не готов. Попробуйте позже.');
  }

  const link = `${tunnelUrl}/admin-preview/${tokenRow.token}`;
  const label = PREVIEW_PROCEDURE_LABELS[typeInput];
  const expiresAt = new Date(tokenRow.expires_at).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });

  await ctx.reply(
    `Админ-preview ссылка для процедуры: ${label}.\n` +
    `Ссылка действует 2 часа, до 10 открытий.\n` +
    `Доступ пользователя не списывается.\n\n` +
    `Действует до: ${expiresAt} (МСК)\n\n` +
    link
  );
}

async function handleGiftCommand(ctx) {
  console.log('[admin] gift received from', ctx.from?.id, '| isAdmin:', isAdmin(ctx.from?.id));
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
}

module.exports = (bot) => {

  console.log('[admin] registerAdmin called');

  bot.command('admin_preview', handleAdminPreviewCommand);
  bot.command('gift', handleGiftCommand);

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

module.exports.handleGiftCommand = handleGiftCommand;
module.exports.handleAdminPreviewCommand = handleAdminPreviewCommand;
