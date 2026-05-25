const { upsertUser, updateUserAfterGift } = require('../../db/users');
const { getAccessRights } = require('../../db/access');
const { getGiftTokenByToken, activateGiftToken, createGiftAccessRights } = require('../../db/giftTokens');
const { showGiftAlreadyActive, showGiftExpired, showGiftInvalid, showGiftActivated } = require('../screens/giftAccess');
const { route } = require('../router');

module.exports = (bot) => {
  bot.start(async (ctx) => {
    const startParam = ctx.startPayload;

    if (startParam && startParam.startsWith('gift_')) {
      let user;
      try {
        user = await upsertUser({
          telegramId: ctx.from.id,
          username: ctx.from.username,
          firstName: ctx.from.first_name,
        });
      } catch (err) {
        console.error('[/start gift] upsertUser:', err.message);
        return ctx.reply('Ошибка подключения к базе данных. Попробуйте позже.');
      }

      const existingAccess = await getAccessRights(user.id);
      if (existingAccess?.access_status === 'active') {
        return showGiftAlreadyActive(ctx);
      }

      const activatedToken = await activateGiftToken(startParam, user.id);
      if (!activatedToken) {
        const tokenRow = await getGiftTokenByToken(startParam);
        if (!tokenRow) return showGiftInvalid(ctx);
        return showGiftExpired(ctx);
      }

      try {
        await createGiftAccessRights(user.id, activatedToken.gift_access_type);
      } catch (err) {
        console.error('[/start gift] createGiftAccessRights:', err.message);
        return ctx.reply('Ошибка при создании доступа. Обратитесь в поддержку.');
      }

      await updateUserAfterGift(ctx.from.id, activatedToken.gift_access_type);

      return showGiftActivated(ctx, activatedToken.gift_access_type);
    }

    let user;
    try {
      user = await upsertUser({
        telegramId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
      });
    } catch (err) {
      console.error('[/start] DB error:', err.message);
      user = { telegram_id: ctx.from.id, user_status: 'new' };
    }

    if (user?.last_bot_message_id) {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, user.last_bot_message_id);
      } catch {
        // сообщение уже удалено, слишком старое или недоступно
      }
    }

    await route(ctx, user);
  });
};
